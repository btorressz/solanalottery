# solanalottery
# Solana Lottery program 
This is a decentralized lottery program built on the Solana blockchain using the Anchor framework. The lottery allows participants to buy tickets, and a random winner (or multiple winners) is selected to receive the prize pool. The application includes support for features such as discounted bulk ticket purchases, multiple winners, and automatic lottery resets.

## Features

- **Initialize Lottery**: The admin can initialize a lottery with a specified ticket price and expiration time.
- **Buy Ticket**: Users can buy a single lottery ticket using SOL.
- **Buy Multiple Tickets**: Users can purchase multiple tickets in one transaction, with a discount if more than 5 tickets are purchased.
- **Draw Multiple Winners**: The admin can draw up to 3 winners, with configurable prize distribution (e.g., 50%, 30%, 20%).
- **Automatic Lottery Reset**: After drawing winners, the lottery resets for the next round.
- **Minimum Participant Requirement**: A minimum number of participants is required before drawing winners.
