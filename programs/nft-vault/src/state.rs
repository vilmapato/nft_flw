use::anchor_lang::prelude::*;

//here I am saving all the info necesary to make an offer.

#[Account]
#[deriveInitSpace]
pub struct Nft_Offer {
    pub id: u64, // it is an identifier of the offer so It can be found afterwards
    pub side_a: Pubkey, //mades the offer
    pub side_b: Pubkey,

    pub side_a_amount: u64, // the amount offered for nft of b side
    pub side_b_amount: u64, // the amount offered for nft of a side

    pub side_a_mint_account: Pubkey, // the mint account where the nft is from side a
    pub side_b_mint_account: Pubkey,

    pub offer_bump: u68,
    pub escrow_bump_side_a: u68,
    pub escrow_bump_side_b: u68

}