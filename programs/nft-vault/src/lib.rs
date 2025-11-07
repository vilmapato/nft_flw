use anchor_lang::prelude::*;

declare_id!("Dg14CmLBnFAtFe5oH7YpQoTwaiuUDsv662CSRxnQWfRZ");

#[program]
pub mod nft_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
