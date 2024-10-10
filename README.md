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

  ## Program Overview

### 1. `lib.rs`
The program is written in Rust using the Anchor framework, and it includes several key functionalities:

- **Initialization**: Set up the lottery with a ticket price and expiration time.
- **Ticket Purchase**: Users can buy tickets to participate in the lottery.
- **Drawing Winners**: After enough participants join, the admin can draw winners and distribute the prize pool.
- **Lottery Reset**: Once the winners are drawn, the lottery is reset for the next round.

### 2. Tests (`anchor.test.ts`)
The tests simulate various scenarios to ensure the smart contract functions correctly:

- **Initialization of the lottery**.
- **Buying tickets** with different user accounts.
- **Drawing winners** with and without sufficient participants.
- **Ensuring the correct error codes** are returned when conditions are not met.

**Note**: The `anchor.test.ts` file is primarily for my own use. Feel free to read the code to understand the test cases.

### 3. Client (`client.ts`)
The client script allows for manual testing and interaction with the program. It can be used to:

- **Check wallet balances**.
- **Initialize the lottery**.
- **Buy single or multiple tickets**.
- **Draw multiple winners**.
- **Fetch the current state of the lottery**.

**Note**: The `client.ts` script is intended for my personal use, but you're welcome to review the code.

## License 
This project is under the **MIT LICENSE**
