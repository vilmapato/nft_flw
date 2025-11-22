import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";

import { NftSwap } from "../target/types/nft_swap"; // <-- rename to your program

describe("make_offer", () => {
  // Standard provider + program setup
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.NftSwap as Program<NftSwap>;

  // Wallets
  const sideA = provider.wallet;               // payer, signer
  const sideB = anchor.web3.Keypair.generate(); // not used in this test yet

  // Variables
  let mintA: anchor.web3.PublicKey;
  let sideA_ata: anchor.web3.PublicKey;
  let escrowA_ata: anchor.web3.PublicKey;
  let offerPda: anchor.web3.PublicKey;
  let offerBump: number;

  // ID for this offer
  const offerId = new anchor.BN(777); // any unique ID
  const sideASolAmount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

  it("initializes Side A NFT mint + ATA", async () => {
    // 1. Create NFT mint for Side A
    mintA = await createMint(
      provider.connection,
      sideA.payer,        // payer
      sideA.publicKey,    // mint authority
      null,               // freeze authority
      0                   // decimals = 0 for NFT
    );

    // 2. Create ATA for side A
    sideA_ata = await createAssociatedTokenAccount(
      provider.connection,
      sideA.payer,
      mintA,
      sideA.publicKey
    );

    // 3. Mint 1 NFT to Side A
    await mintTo(
      provider.connection,
      sideA.payer,
      mintA,
      sideA_ata,
      sideA.publicKey,
      1
    );

    const ataInfo = await getAccount(provider.connection, sideA_ata);
    console.log("Side A NFT amount:", ataInfo.amount);
    if (ataInfo.amount !== 1n) throw new Error("Mint failed");
  });

  it("executes make_offer and creates offer PDA + escrow ATA", async () => {
    //
    // 1. Derive Offer PDA
    //
    [offerPda, offerBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nft_offer"), offerId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    //
    // 2. Send make_offer()
    //
    await program.methods
      .makeOffer(
        offerId,               // u64
        sideASolAmount         // u64
      )
      .accounts({
        sideA: sideA.publicKey,
        sideAMintAccount: mintA,
        sideAMintAta: sideA_ata,
        offer: offerPda,
        escrowAAta: null, // Anchor auto-derives the ATA if using associated_token::authority = offer
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .signers([])
      .rpc();

    //
    // 3. Validate escrow ATA was created
    //
    escrowA_ata = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: offerPda,
    });

    const escrowATAInfo = await getAccount(provider.connection, escrowA_ata);

    console.log("Escrow ATA:", escrowA_ata.toBase58());
    console.log("Escrow initially holds NFT:", escrowATAInfo.amount);

    if (escrowATAInfo.amount !== 1n)
      throw new Error("NFT was not transferred to escrow");
  });

  it("checks offer PDA data is correct", async () => {
    const offerData = await program.account.nftOffer.fetch(offerPda);

    console.log("Offer PDA data:", offerData);

    if (!offerData.sideA.equals(sideA.publicKey))
      throw new Error("Side A not recorded");
    if (!offerData.sideAMintAccount.equals(mintA))
      throw new Error("Wrong mint stored");
    if (offerData.sideAAmount.toString() !== sideASolAmount.toString())
      throw new Error("SOL amount mismatch");
  });
});