// ------------------------- IMPORTS -----------------------------
import {
  createMetadataAccountV3,
  createMasterEditionV3,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  signerIdentity,
} from "@metaplex-foundation/umi";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

import { mintTokensTo } from "@metaplex-foundation/mpl-toolbox";

import {
  Keypair as Web3Keypair,
  Connection,
  clusterApiUrl,
  PublicKey,
} from "@solana/web3.js";

import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

import fs from "fs";
import path from "path";

// ---------------------- HELPER FUNCTIONS ------------------------
function readKeypair(filePath: string): Web3Keypair {
  const secret = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Web3Keypair.fromSecretKey(Uint8Array.from(secret));
}

function loadUmiWallet(umi: any, keypairPath: string) {
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const web3kp = Web3Keypair.fromSecretKey(Uint8Array.from(secret));
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(web3kp.secretKey);
  return createSignerFromKeypair(umi, umiKeypair);
}

// -------------------------- MAIN LOGIC --------------------------
const mintNft = async () => {
  const KEYPAIR_PATH = "/Users/vilma/.config/solana/id.json";
  const NAME = "Flow";
  const SYMBOL = "FLW";
  const DESCRIPTION = "Minted on Solana Devnet using Metaplex UMI by Vilma.";
  const IMAGE_PATH = "docs/figure_nft.png";

  // 1. Connection + Umi Setup
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const umi = createUmi(clusterApiUrl("devnet"))
    .use(mplTokenMetadata())
    .use(irysUploader());

  const payer = loadUmiWallet(umi, KEYPAIR_PATH);
  umi.use(signerIdentity(payer));

  console.log("Wallet:", payer.publicKey.toString());

  // 2. Upload image
  if (!fs.existsSync(IMAGE_PATH)) throw new Error("Image not found");
  const imgBuffer = fs.readFileSync(IMAGE_PATH);
  const imageFile = createGenericFile(imgBuffer, path.basename(IMAGE_PATH), {
    contentType: "image/png",
  });

  console.log("Uploading image to Arweave...");
  const [imageUri] = await umi.uploader.upload([imageFile]);
  console.log("✅ Image URI:", imageUri);

  // 3. Upload metadata JSON
  const metadata = {
    name: NAME,
    symbol: SYMBOL,
    description: DESCRIPTION,
    image: imageUri,
    attributes: [{ trait_type: "Cohort", value: "Pre-Builders" }],
    properties: {
      files: [{ uri: imageUri, type: "image/png" }],
      creators: [{ address: payer.publicKey, share: 100 }],
    },
  };

  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log("✅ Metadata URI:", metadataUri);

  // 4. Create the Mint Account (NFT mint)
  const mint = generateSigner(umi);

  await createUmi(umi, {
    mint,
    decimals: 0,
    mintAuthority: payer.publicKey,
    freezeAuthority: payer.publicKey,
  }).sendAndConfirm(umi);

  console.log("✅ Mint created:", mint.publicKey.toString());

  // 5. Create ATA using Web3 SPL (fastest + reliable)
  const ataAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    readKeypair(KEYPAIR_PATH), // payer as web3 signer
    new PublicKey(mint.publicKey), // mint
    new PublicKey(payer.publicKey) // owner
  );

  console.log("✅ ATA created:", ataAccount.address.toBase58());

  // 6. Mint 1 token to ATA
  await mintTokensTo(umi, {
    mint: mint.publicKey,
    token: ataAccount.address.toBase58() as unknown as any,
    amount: 1n,
    mintAuthority: payer,
  }).sendAndConfirm(umi);

  console.log("✅ 1 Token minted");

  // 7. Create Metadata Account
  await createMetadataAccountV3(umi, {
    mint: mint.publicKey,
    mintAuthority: payer,
    payer: payer,
    updateAuthority: payer.publicKey,
    data: {
      name: NAME,
      symbol: SYMBOL,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: [{ address: payer.publicKey, verified: true, share: 100 }],
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  console.log("✅ Metadata added");

  // 8. Master Edition (marks it as NFT)
  await createMasterEditionV3(umi, {
    mint: mint.publicKey,
    updateAuthority: payer,
    mintAuthority: payer,
    payer: payer,
    maxSupply: 1n,
  }).sendAndConfirm(umi);

  console.log("\n🎉 ✅ NFT Minted Successfully!");
  console.log("Mint Address:", mint.publicKey.toString());
  console.log(
    `Explorer: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
  );
};

// Run the script
mintNft();
