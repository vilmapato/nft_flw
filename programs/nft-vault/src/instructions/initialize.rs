use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
#[instruction(a_to_b_amount: u64,b_to_a_amount:u64,side_b:Pubkey)]
pub struct Initialize_vault<'info> {
    #[account(mut)]
    pub side_a: Pubkey,

    #[account(mut)]
    pub side_b: Pubkey,

    #[account(
        init_if_needed,
        payer = side_a,
        associated_token::mint = side_a_mint_account,
        associated_token::authority = side_a,
        associated_token::program = token_program,
    )] //init my escrow account_side a
    pub ata_side_a: InterfaceAccount<'info, TokenAccount>

    pub associated_token_program: Program<'info, AssociatedToken>,

}

fn _initialize_nft_vault(ctx: Context<Initialize_vault>, side_a_amount:u64, side_b_amount:u64, side_b:Pubkey) -> Result () {
    let escrow = ctx.

}