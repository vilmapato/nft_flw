use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
#[instruction(id: u64, side_a_amount: u64)]
pub struct MakeOffer<'info> {

    // Maker (side A)
    #[account(mut)]
    pub side_a: Signer<'info>,

    // Mint of the NFT A is depositing
    pub side_a_mint_account: InterfaceAccount<'info, Mint>,

    // A's ATA holding the NFT that will be deposited
    #[account(
        mut,
        associated_token::mint = side_a_mint_account,
        associated_token::authority = side_a
    )]
    pub side_a_mint_ata: InterfaceAccount<'info, TokenAccount>,

    // Offer PDA
    #[account(
        init,
        payer = side_a,
        space = 8 + NftOffer::INIT_SPACE,
        seeds = [b"nft_offer", &id.to_le_bytes()],
        bump
    )]
    pub offer: Account<'info, NftOffer>,

    // Escrow ATA owned by the offer PDA
    #[account(
        init,
        payer = side_a,
        associated_token::mint = side_a_mint_account,
        associated_token::authority = offer
    )]
    pub escrow_a_ata: InterfaceAccount<'info, TokenAccount>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,

}

pub fn make_offer(ctx: Context<Make_offer>, side_a_amount:u64, id:u64 ) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow; //still to be completed

    Ok(())

}