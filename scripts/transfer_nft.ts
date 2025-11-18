import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, transferV1 } from "@metaplex-foundation/mpl-token-metadata";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";
import { Keypair, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";

const KEYPAIR_PATH = "/Users/vilma/.config/solana/id.json";
const MINT = "EspH3oRVo3VHH436ru7aDj4WZm1Ba7FLQjfb54b53vtF";
const RECIPIENT = "6SLbMLqnoaSoPzdHJTBQUFu5ewB1PErQjynQa4pTH8tZ";

function readKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

(async () => {
  const umi = createUmi(clusterApiUrl("devnet")).use(mplTokenMetadata());
  const kp = readKeypair(KEYPAIR_PATH);
  const umiKp = umi.eddsa.createKeypairFromSecretKey(kp.secretKey);
  const signer = createSignerFromKeypair(umi, umiKp);
  umi.use(signerIdentity(signer));

  console.log("🚀 Transferring NFT...");

  await transferV1(umi, {
    mint: publicKey(MINT),
    authority: signer,
    tokenOwner: signer.publicKey, // 👈 explicitly set
    destinationOwner: publicKey(RECIPIENT),
    tokenStandard: TokenStandard.NonFungible, // 👈 specify token standard
  }).sendAndConfirm(umi);

  console.log(`✅ NFT transferred to ${RECIPIENT}`);
})();