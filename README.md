# 🧩 NFT Swap Escrow Program — Development Notes & Progress

This document summarizes my project, current implementation, progress, and my evolving understanding of **escrow mechanics**, **vault PDAs**, and **Anchor account flows**.  
I am still actively debugging and refining the escrow logic, especially around ATAs, PDA ownership, and token transfers.

---

## 📌 Project Overview

I am building a **trustless escrow system** on Solana, where:

- **Side A** offers an NFT + optionally requests SOL payment
- **Side B** can later accept the offer by depositing their own NFT
- Once both NFTs are held inside escrow vaults, the program performs a **trustless cross-swap**
- SOL settlement happens at the end (e.g., Side B pays Side A extra SOL)

The entire swap is handled by the program through **PDA-owned vaults**, meaning:

- No party can rug or withdraw midway
- All state is stored in a deterministic **Offer PDA**
- NFTs remain safe inside **program-controlled accounts** until swap completion

This system is essentially an **NFT-for-NFT swap** with optional **SOL compensation**, enforced entirely on-chain.

---

## 🚧 What I Have Implemented So Far

### ✔ 1. `NftOffer` State Struct

The on-chain `NftOffer` account holds all metadata necessary for a swap:

- `id`
- `side_a` and `side_b`
- NFT mint addresses for both sides
- SOL amounts each side wants to receive
- PDA bumps (offer bump, escrow bump A, escrow bump B)
- Deposit flags

This struct provides a full snapshot of a pending or completed escrow offer.

---

### ✔ 2. `MakeOffer` Instruction (Side A)

This instruction performs the first half of the escrow process:

- Creates the **Offer PDA** using seeds:  
  `["nft_offer", id]`
- Creates the **Escrow ATA** owned by the Offer PDA
- Transfers Side A’s NFT into escrow (vault ATA)
- Saves all offer details into the on-chain `NftOffer` state

This finalizes Side A’s commitment and locks their NFT safely in a program-owned vault.

---

### ✔ 3. `transfer_nft_to_escrow()` Helper

A reusable CPI helper that: --> under dev trying to make it work

- Transfers 1 NFT from Side A → program escrow ATA
- Enforces proper authority (the signer must be Side A)
- Uses the Token-2022 `transfer` interface
- Ensures the vault ATA remains program-controlled

This makes the NFT transfer logic clean, safe, and modular.

---

## my learning process

In the first mint_nft.ts file I followed the guide of metaplex with umi for creating my first NFTs. It was very simple and it helped me to understand the logic of how the process works.

The cons (-): when checking in solscan for the nft the metadata is in bytecode so I can not visualize the nft which it's not convenient as I am trying to share it with my classmmates.

# next step

I used createV1 UMI which produces a more explorer friendly instructions in the file mint_new_nft.ts

import { createV1 } from "@metaplex-foundation/mpl-token-metadata";

After changing the code and while checking the solana explorer transaction, the information given through createV1, it is not taking all the metadata information such as the Symbol. But there is a clue: next to the token there is a "master edition" tag which leads me to think I have to use a master edition in my code.
