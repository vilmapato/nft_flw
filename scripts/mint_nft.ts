import {
  createNft,
  mplTokenMetadata,
  createV1,
  createMasterEditionV3,
  createMetadataAccountV3,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
  sol,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";

import {
  Keypair as Web3Keypair,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { create } from "domain";

function readKeypair(filePath: string): Web3Keypair {
  const secret = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const secretKey = Uint8Array.from(secret);
  return Web3Keypair.fromSecretKey(secretKey);
}

// Adapter: convert @solana/web3.js Keypair -> minimal UMI Signer
function loadUmiWallet(umi: any, keypairPath: string) {
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const web3kp = Web3Keypair.fromSecretKey(Uint8Array.from(secret));
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(web3kp.secretKey);
  return createSignerFromKeypair(umi, umiKeypair);
}

// Create the wrapper function
const mint = async () => {
  // defining const for nft info
  const KEYPAIR_PATH =
    process.env.SOLANA_KEYPAIR || "/Users/vilma/.config/solana/id.json";
  const NAME = "Flow";
  const SYMBOL = "FLW";
  const DESCRIPTION = "Minted on Solana Devnet using Metaplex UMI by Vilma.";
  const IMAGE_PATH = "docs/figure_nft.png";

  // seeting up umi
  const umi = createUmi(clusterApiUrl("devnet"))
    .use(mplTokenMetadata())
    .use(irysUploader());

  // creating signer from keypair
  const signerKeypair = readKeypair(KEYPAIR_PATH);
  const payerSigner = loadUmiWallet(umi, KEYPAIR_PATH);
  umi.use(signerIdentity(payerSigner));

  console.log("Wallet:", signerKeypair.publicKey.toBase58());

  // uploading image
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(
      `Image not found at ${IMAGE_PATH}. Pass a path: ` +
        `npx ts-node scripts/mint_nft.ts ./docs/figure_nft.png "Flow" "FLW"`
    );
  }
  const imgBuf = fs.readFileSync(IMAGE_PATH);
  const imageFile = createGenericFile(imgBuf, path.basename(IMAGE_PATH), {
    contentType: "image/png",
  });

  console.log("Uploading image...");
  const [imageUri] = await umi.uploader.upload([imageFile], {
    uploadWith: "arweave",
  } as any);
  console.log("Image URI:", imageUri);

  //metadata
  const metadata = {
    name: NAME,
    symbol: SYMBOL,
    description: DESCRIPTION,
    image: imageUri,
    attributes: [{ trait_type: "Cohort", value: "Pre-Builders" }],
    properties: {
      files: [{ uri: imageUri, type: "image/png" }],
      category: "image",
      creators: [{ address: signerKeypair.publicKey.toBase58(), share: 100 }],
    },
  };
  const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
    throw new Error(err);
  });
  //creating nft
  const mint = generateSigner(umi);

  console.log("Creating NFT...");

  //   const tx = await createV1(umi, {
  //     mint,
  //     name: NAME,
  //     symbol: SYMBOL,
  //     uri: metadataUri,
  //     sellerFeeBasisPoints: percentAmount(0), // 5,5% royalties
  //     tokenStandard: TokenStandard.NonFungible,
  //   }).sendAndConfirm(umi);

  const tx = await createMetadataAccountV3(umi, {
    mint: mint.publicKey,
    mintAuthority: payerSigner,
    payer: payerSigner,
    updateAuthority: payerSigner.publicKey,
    data: {
      name: NAME,
      symbol: SYMBOL,
      uri: metadataUri, // JSON metadata URL
      sellerFeeBasisPoints: 0,
      creators: [
        { address: payerSigner.publicKey, verified: true, share: 100 },
      ],
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  }).sendAndConfirm(umi);

  const editionMaster = await createMasterEditionV3(umi, {
    mint: mint.publicKey,
    updateAuthority: payerSigner, // same wallet as mint
    mintAuthority: payerSigner,
    payer: payerSigner,
    maxSupply: 0, // 0 = no more prints allowed (1/1 NFT)
  }).sendAndConfirm(umi);

  console.log("\n✅ NFT Minted!");
  console.log("Mint Address:", mint.publicKey.toString());
  console.log("Metadata:", metadataUri);
  console.log(" ✅ Master Edition Created", editionMaster);
  console.log(
    `Explorer: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
  );
};

// run the wrapper function
mint();
