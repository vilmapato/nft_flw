## my learning process

In the first mint_nft.ts file I followed the guide of metaplex with umi for creating my first NFTs. It was very simple and it helped me to understand the logic of how the process works.

The cons (-): when checking in solscan for the nft the metadata is in bytecode so I can not visualize the nft which it's not convenient as I am trying to share it with my classmmates.

# next step

I used createV1 UMI which produces a more explorer friendly instructions in the file mint_new_nft.ts

import { createV1 } from "@metaplex-foundation/mpl-token-metadata";

After changing the code and while checking the solana explorer transaction, the information given through createV1, it is not taking all the metadata information such as the Symbol. But there is a clue: next to the token there is a "master edition" tag which leads me to think I have to use a master edition in my code.