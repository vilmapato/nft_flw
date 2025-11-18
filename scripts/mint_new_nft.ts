import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import fs from "fs";
import { Keypair as Web3Keypair, clusterApiUrl } from "@solana/web3.js";

// Load wallet keypair
function loadWallet(pathStr: string): Web3Keypair {
  const secret = JSON.parse(fs.readFileSync(pathStr, "utf8"));
  return Web3Keypair.fromSecretKey(Uint8Array.from(secret));
}

const mintNft = async () => {
  // --- NFT configuration
  const KEYPAIR_PATH = "/Users/vilma/.config/solana/id.json";
  const NAME = "Flow_new";
  const SYMBOL = "FLWN";
  const DESCRIPTION = "Minted on Solana Devnet using Metaplex UMI by Vilma.";
  const IMAGE_PATH = "docs/figure_nft.png";

  // --- setup umi connection + identity
  const umi = createUmi(clusterApiUrl("devnet"))
    .use(mplTokenMetadata())
    .use(irysUploader());

  const web3kp = loadWallet(KEYPAIR_PATH);
  const umiKp = umi.eddsa.createKeypairFromSecretKey(web3kp.secretKey);
  const signer = createSignerFromKeypair(umi, umiKp);
  umi.use(signerIdentity(signer));

  console.log("Wallet:", web3kp.publicKey.toBase58());
  //   const signer = generateSigner(umi); // this would be in the case I want to generate a new keypair
  //   umi.use(signerIdentity(signer));

  const imageFile = fs.readFileSync(IMAGE_PATH);  // read image file
 

  const umiImageFile = createGenericFile(imageFile, "flown.png",{     // create GenericFile
    tags: [{ name: "NftCreation", value: "image/png" }],
  });

  //upload the image as a GenericFile array
  const [imageUri] = await umi.uploader.upload([umiImageFile]);
  console.log("✅ Image uploaded:", imageUri);

  // --- upload metadata
  const metadata = {
    name: NAME,
    symbol: SYMBOL,
    description: DESCRIPTION,
    image: umiImageFile,
    attributes: [{ trait_type: "Cohort", value: "Pre-Builders" }],
    properties: {
      files: [{ uri: umiImageFile, type: "image/png" }],
      category: "image",
    },
  };
  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log("✅ Metadata uploaded:", metadataUri);

  console.log("Creating Nft...");

  const nftSigner = generateSigner(umi);

  const tx = await createV1(umi, {
    mint: nftSigner,
    sellerFeeBasisPoints: percentAmount(5.0),
    name: metadata.name,
    uri: metadataUri,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  console.log("\n✅ NFT Minted Successfully!");
  console.log("Mint Address:", nftSigner.publicKey.toString());
  console.log("Metadata URI:", metadataUri);
  console.log(
    `Explorer: https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`
  );
};

mintNft();
