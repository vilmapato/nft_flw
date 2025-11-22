use anchor_lang::prelude::*;

use instructions::*;

pub mod state;
pub mod instructions;




declare_id!("Dg14CmLBnFAtFe5oH7YpQoTwaiuUDsv662CSRxnQWfRZ");

#[program]
pub mod nft_vault {
    use super::*;

    pub fn initialize(ctx: Context<_initialize_nft_vault>, side_a_amount:u64, id:u64) -> Result<()> {
        initialize::make_offer(context, side_a_amount, id)
        
    }
}
