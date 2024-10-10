use anchor_lang::prelude::*;

declare_id!("9MW5Uvnrp5nZCoxs1kTYdmkucTBoMQ7CYQpqauw4qVj7");

#[program]
pub mod lottery {
    use super::*;

    // Initialize the lottery with a ticket price and expiration duration
    pub fn initialize_lottery(
        ctx: Context<InitializeLottery>,
        ticket_price: u64,
        duration: i64,
    ) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        lottery.admin = *ctx.accounts.admin.key;
        lottery.ticket_price = ticket_price;
        lottery.total_tickets = 0;
        lottery.total_funds = 0;
        lottery.tickets = Vec::new();
        lottery.expires_at = Clock::get()?.unix_timestamp + duration;
        lottery.current_round = 1;
        lottery.previous_winners = Vec::new();

        // Emit the LotteryInitialized event
        emit!(LotteryInitialized {
            admin: *ctx.accounts.admin.key,
            ticket_price,
        });

        Ok(())
    }

    // Buy a ticket for the lottery
    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        let buyer = &mut ctx.accounts.buyer;

        // Check if the buyer has enough lamports to purchase a ticket
        require!(
            buyer.to_account_info().lamports() >= lottery.ticket_price,
            LotteryError::InsufficientFunds
        );

        // Transfer the ticket price from the buyer to the lottery account
        **buyer.to_account_info().try_borrow_mut_lamports()? -= lottery.ticket_price;
        **lottery.to_account_info().try_borrow_mut_lamports()? += lottery.ticket_price;

        // Record the buyer's ticket
        lottery.total_tickets += 1;
        lottery.total_funds += lottery.ticket_price;
        lottery.tickets.push(buyer.key());

        // Emit the TicketPurchased event
        emit!(TicketPurchased {
            buyer: *buyer.key,
            ticket_number: lottery.total_tickets,
        });

        Ok(())
    }

    // Buy multiple tickets for the lottery with optional discounts
    pub fn buy_multiple_tickets(ctx: Context<BuyTicket>, number_of_tickets: u64) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;
        let buyer = &mut ctx.accounts.buyer;

        let total_price = lottery.ticket_price * number_of_tickets;

        // Apply a discount if buying more than 5 tickets
        let discounted_price = if number_of_tickets > 5 {
            total_price * 90 / 100  // 10% discount
        } else {
            total_price
        };

        require!(
            buyer.to_account_info().lamports() >= discounted_price,
            LotteryError::InsufficientFunds
        );

        // Transfer the discounted price from the buyer to the lottery account
        **buyer.to_account_info().try_borrow_mut_lamports()? -= discounted_price;
        **lottery.to_account_info().try_borrow_mut_lamports()? += discounted_price;

        // Record each ticket purchased
        for _ in 0..number_of_tickets {
            lottery.total_tickets += 1;
            lottery.total_funds += lottery.ticket_price;
            lottery.tickets.push(buyer.key());
        }

        // Emit the TicketPurchased event
        emit!(TicketPurchased {
            buyer: *buyer.key,
            ticket_number: lottery.total_tickets,
        });

        Ok(())
    }

    // Draw multiple winners for the lottery with dynamic prize distribution
    pub fn draw_multiple_winners(ctx: Context<DrawMultipleWinners>) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery;

        // Only the admin can call this function
        require!(ctx.accounts.admin.key() == lottery.admin, LotteryError::Unauthorized);

        // Ensure there are enough tickets available
        require!(lottery.total_tickets >= 3, LotteryError::NotEnoughParticipants);

        // Check if the lottery has expired
        require!(
            Clock::get()?.unix_timestamp >= lottery.expires_at,
            LotteryError::LotteryNotExpired
        );

        // Use pseudo-random numbers based on the recent block's slot number
        let recent_slot = Clock::get()?.slot;
        let first_winner_index = (recent_slot % lottery.total_tickets as u64) as usize;
        let second_winner_index = ((recent_slot + 1) % lottery.total_tickets as u64) as usize;
        let third_winner_index = ((recent_slot + 2) % lottery.total_tickets as u64) as usize;

        let first_winner = lottery.tickets[first_winner_index];
        let second_winner = lottery.tickets[second_winner_index];
        let third_winner = lottery.tickets[third_winner_index];

        // Prize distribution: 50%, 30%, 20%
        let prize_amount = lottery.total_funds;
        let first_prize = prize_amount * 50 / 100;
        let second_prize = prize_amount * 30 / 100;
        let third_prize = prize_amount * 20 / 100;

        **lottery.to_account_info().try_borrow_mut_lamports()? -= first_prize;
        **ctx.accounts.winner1.to_account_info().try_borrow_mut_lamports()? += first_prize;

        **lottery.to_account_info().try_borrow_mut_lamports()? -= second_prize;
        **ctx.accounts.winner2.to_account_info().try_borrow_mut_lamports()? += second_prize;

        **lottery.to_account_info().try_borrow_mut_lamports()? -= third_prize;
        **ctx.accounts.winner3.to_account_info().try_borrow_mut_lamports()? += third_prize;

        // Emit events for multiple winners
        emit!(WinnerDrawn { winner: first_winner, prize_amount: first_prize });
        emit!(WinnerDrawn { winner: second_winner, prize_amount: second_prize });
        emit!(WinnerDrawn { winner: third_winner, prize_amount: third_prize });

        // Add winners to previous winners list
        lottery.previous_winners.push(first_winner);
        lottery.previous_winners.push(second_winner);
        lottery.previous_winners.push(third_winner);

        // Reset the lottery for the next round
        lottery.total_tickets = 0;
        lottery.total_funds = 0;
        lottery.tickets.clear();
        lottery.current_round += 1;

        Ok(())
    }
}

// Define account structures used by the lottery program
#[derive(Accounts)]
pub struct InitializeLottery<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 64 + 64 + 64 + 8 + 1024 + 8 + 2048)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrawMultipleWinners<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,
    #[account(mut, signer)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub winner1: Signer<'info>,
    #[account(mut)]
    pub winner2: Signer<'info>,
    #[account(mut)]
    pub winner3: Signer<'info>,
}

// Define the data structure for the Lottery account
#[account]
pub struct Lottery {
    pub admin: Pubkey,            // Administrator's public key
    pub ticket_price: u64,        // Price of one ticket
    pub total_tickets: u64,       // Number of tickets sold
    pub total_funds: u64,         // Total funds collected
    pub tickets: Vec<Pubkey>,     // List of participants
    pub expires_at: i64,          // Expiration timestamp
    pub current_round: u64,       // Current round number
    pub previous_winners: Vec<Pubkey>, // List of previous winners
}

// Define custom error codes for the lottery program
#[error_code]
pub enum LotteryError {
    #[msg("Insufficient funds to buy a ticket")]
    InsufficientFunds,
    #[msg("No tickets available to draw a winner")]
    NoTickets,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Lottery has not yet expired")]
    LotteryNotExpired,
    #[msg("Not enough participants to draw winners")]
    NotEnoughParticipants,
}

// Define event types for the lottery program
#[event]
pub struct LotteryInitialized {
    pub admin: Pubkey,
    pub ticket_price: u64,
}

#[event]
pub struct TicketPurchased {
    pub buyer: Pubkey,
    pub ticket_number: u64,
}

#[event]
pub struct WinnerDrawn {
    pub winner: Pubkey,
    pub prize_amount: u64,
}
