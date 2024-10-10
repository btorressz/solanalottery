// No imports needed: web3, anchor, pg, and more are globally available

describe("Lottery Tests", () => {
  const provider = pg.provider;
  const program = pg.program;

  // Accounts needed for the tests
  const admin = web3.Keypair.generate();
  const user1 = web3.Keypair.generate();
  const user2 = web3.Keypair.generate();
  const user3 = web3.Keypair.generate();
  let lotteryAccount = web3.Keypair.generate();

  // Ticket price and duration for the lottery
  const ticketPrice = new BN(1 * web3.LAMPORTS_PER_SOL); // 1 SOL per ticket
  const lotteryDuration = new BN(60); // 60 seconds

  before(async () => {
    // Airdrop some SOL to admin and user accounts for testing
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 5 * web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 2 * web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 2 * web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user3.publicKey, 2 * web3.LAMPORTS_PER_SOL)
    );
  });

  it("Initialize the lottery", async () => {
    // Send the initialize transaction
    const txHash = await program.methods
      .initializeLottery(ticketPrice, lotteryDuration)
      .accounts({
        lottery: lotteryAccount.publicKey,
        admin: admin.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([lotteryAccount, admin])
      .rpc();

    console.log(`Lottery initialized. Transaction: ${txHash}`);

    // Fetch the lottery account data to verify initialization
    const lotteryData = await program.account.lottery.fetch(lotteryAccount.publicKey);

    assert.equal(lotteryData.admin.toBase58(), admin.publicKey.toBase58());
    assert.equal(lotteryData.ticketPrice.toString(), ticketPrice.toString());
    assert.equal(lotteryData.totalTickets.toNumber(), 0);
    assert.equal(lotteryData.totalFunds.toNumber(), 0);
    console.log("Lottery initialized successfully.");
  });

  it("Buy a single ticket", async () => {
    const txHash = await program.methods
      .buyTicket()
      .accounts({
        lottery: lotteryAccount.publicKey,
        buyer: user1.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    console.log(`User 1 bought a ticket. Transaction: ${txHash}`);

    // Fetch the lottery account data to verify the ticket purchase
    const lotteryData = await program.account.lottery.fetch(lotteryAccount.publicKey);
    assert.equal(lotteryData.totalTickets.toNumber(), 1);
    assert.equal(lotteryData.totalFunds.toString(), ticketPrice.toString());
    console.log("User 1 successfully bought a ticket.");
  });

  it("Buy multiple tickets with discount", async () => {
    const numberOfTickets = new BN(6); // Buying 6 tickets (should apply discount)

    const txHash = await program.methods
      .buyMultipleTickets(numberOfTickets)
      .accounts({
        lottery: lotteryAccount.publicKey,
        buyer: user2.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    console.log(`User 2 bought multiple tickets. Transaction: ${txHash}`);

    // Fetch the lottery account data to verify multiple ticket purchases
    const lotteryData = await program.account.lottery.fetch(lotteryAccount.publicKey);
    assert.equal(lotteryData.totalTickets.toNumber(), 7); // 1 from previous + 6
    assert.ok(lotteryData.totalFunds.toNumber() > ticketPrice.toNumber() * 6 * 0.9); // Check discounted total
    console.log("User 2 successfully bought multiple tickets with discount.");
  });

  it("Attempt to draw a winner with insufficient participants", async () => {
    try {
      await program.methods
        .drawMultipleWinners()
        .accounts({
          lottery: lotteryAccount.publicKey,
          admin: admin.publicKey,
          winner1: user1.publicKey,
          winner2: user2.publicKey,
          winner3: user3.publicKey,
        })
        .signers([admin])
        .rpc();
      assert.fail("Drawing a winner should have failed due to insufficient participants.");
    } catch (err) {
      assert.include(err.toString(), "NotEnoughParticipants");
      console.log("Correctly failed to draw winners due to insufficient participants.");
    }
  });

  it("Draw multiple winners after more participants join", async () => {
    // User 3 buys tickets
    const txHash1 = await program.methods
      .buyTicket()
      .accounts({
        lottery: lotteryAccount.publicKey,
        buyer: user3.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user3])
      .rpc();
    console.log(`User 3 bought a ticket. Transaction: ${txHash1}`);

    // Attempt to draw winners (should now succeed)
    const txHash2 = await program.methods
      .drawMultipleWinners()
      .accounts({
        lottery: lotteryAccount.publicKey,
        admin: admin.publicKey,
        winner1: user1.publicKey,
        winner2: user2.publicKey,
        winner3: user3.publicKey,
      })
      .signers([admin])
      .rpc();

    console.log(`Winners drawn successfully. Transaction: ${txHash2}`);

    // Fetch the lottery data to check if it reset for the next round
    const lotteryData = await program.account.lottery.fetch(lotteryAccount.publicKey);
    assert.equal(lotteryData.totalTickets.toNumber(), 0);
    assert.equal(lotteryData.totalFunds.toNumber(), 0);
    assert.equal(lotteryData.currentRound.toNumber(), 2);
    console.log("Lottery reset successfully for the next round.");
  });
});
