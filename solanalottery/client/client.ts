// Client

// Display wallet information
console.log("My address:", pg.wallet.publicKey.toString());
const balance = await pg.connection.getBalance(pg.wallet.publicKey);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

// Lottery account details
const lotteryAccount = new web3.Keypair();
const ticketPrice = new BN(1 * web3.LAMPORTS_PER_SOL); // 1 SOL per ticket
const lotteryDuration = new BN(60); // 60 seconds

// Admin and users for demonstration purposes
const admin = pg.wallet;
const user1 = web3.Keypair.generate();
const user2 = web3.Keypair.generate();

// Airdrop some SOL to user accounts for testing
async function airdropSol(publicKey, amountSol) {
  const signature = await pg.connection.requestAirdrop(
    publicKey,
    amountSol * web3.LAMPORTS_PER_SOL
  );
  await pg.connection.confirmTransaction(signature);
  console.log(`Airdropped ${amountSol} SOL to ${publicKey.toString()}`);
}

// Initialize the lottery
async function initializeLottery() {
  try {
    const txHash = await pg.program.methods
      .initializeLottery(ticketPrice, lotteryDuration)
      .accounts({
        lottery: lotteryAccount.publicKey,
        admin: admin.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([lotteryAccount, admin.payer])
      .rpc();
    console.log(`Lottery initialized. Transaction: ${txHash}`);
  } catch (err) {
    console.error("Failed to initialize lottery:", err);
  }
}

// Fetch the lottery details
async function fetchLotteryDetails() {
  try {
    const lotteryData = await pg.program.account.lottery.fetch(
      lotteryAccount.publicKey
    );
    console.log("Lottery Details:", {
      admin: lotteryData.admin.toString(),
      ticketPrice: lotteryData.ticketPrice.toString(),
      totalTickets: lotteryData.totalTickets.toString(),
      totalFunds: lotteryData.totalFunds.toString(),
      expiresAt: new Date(lotteryData.expiresAt.toNumber() * 1000).toLocaleString(),
      currentRound: lotteryData.currentRound.toString(),
    });
  } catch (err) {
    console.error("Failed to fetch lottery details:", err);
  }
}

// Buy a single ticket
async function buyTicket(buyer) {
  try {
    const txHash = await pg.program.methods
      .buyTicket()
      .accounts({
        lottery: lotteryAccount.publicKey,
        buyer: buyer.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    console.log(`Ticket purchased by ${buyer.publicKey.toString()}. Transaction: ${txHash}`);
  } catch (err) {
    console.error("Failed to buy ticket:", err);
  }
}

// Buy multiple tickets with a discount
async function buyMultipleTickets(buyer, numberOfTickets) {
  try {
    const txHash = await pg.program.methods
      .buyMultipleTickets(new BN(numberOfTickets))
      .accounts({
        lottery: lotteryAccount.publicKey,
        buyer: buyer.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    console.log(`Bought ${numberOfTickets} tickets by ${buyer.publicKey.toString()}. Transaction: ${txHash}`);
  } catch (err) {
    console.error("Failed to buy multiple tickets:", err);
  }
}

// Draw multiple winners
async function drawWinners() {
  try {
    const txHash = await pg.program.methods
      .drawMultipleWinners()
      .accounts({
        lottery: lotteryAccount.publicKey,
        admin: admin.publicKey,
        winner1: user1.publicKey,
        winner2: user2.publicKey,
        winner3: user1.publicKey, // Using user1 again just as an example
      })
      .signers([admin.payer])
      .rpc();
    console.log(`Winners drawn successfully. Transaction: ${txHash}`);
  } catch (err) {
    console.error("Failed to draw winners:", err);
  }
}

// Main execution
(async () => {
  // Airdrop some SOL for testing
  await airdropSol(admin.publicKey, 5);
  await airdropSol(user1.publicKey, 2);
  await airdropSol(user2.publicKey, 2);

  // Initialize the lottery
  await initializeLottery();

  // Fetch lottery details
  await fetchLotteryDetails();

  // User 1 buys a single ticket
  await buyTicket(user1);

  // Fetch updated lottery details
  await fetchLotteryDetails();

  // User 2 buys multiple tickets
  await buyMultipleTickets(user2, 6);

  // Fetch updated lottery details again
  await fetchLotteryDetails();

  // Attempt to draw winners (should work since we have participants)
  await drawWinners();

  // Fetch final lottery details to verify it has been reset
  await fetchLotteryDetails();
})();
