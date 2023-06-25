// BY Jamill (Jnbez)
const { expect } = require('chai');
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe("Interact successful Binance AtomicSwap Scenario:", function () {
  

  async function deployTokenFixture() {
    
  // Define constants and secrets :

  const SWAP_ID = 1;
  const TIME_LOCK_DURATION = 360; // 10 min
  const secret='factory';
  const secret32 = ethers.utils.formatBytes32String(secret);

  //const HASHLOCK =  ethers.utils.solidityKeccak256([""], ["factory"]);

  // Calculate hashlock using the secret

  const HASHLOCK = ethers.utils.keccak256(secret32)
  const AMOUNT = ethers.utils.parseUnits("1");

  // Deploy BinanceAtomicSwap contract

  const AtomicSwap = await ethers.getContractFactory("BinanceAtomicSwap");
  const atomicSwap = await AtomicSwap.deploy();
  const atomicSwap_address = await atomicSwap.address

  // Deploy BUSD token contract

  const Busd = await ethers.getContractFactory("BUSD");
  const busd = await Busd.deploy();

  
  [owner, participant] = await ethers.getSigners();

    return { owner, participant, busd, atomicSwap_address,atomicSwap,SWAP_ID,TIME_LOCK_DURATION,secret,HASHLOCK,AMOUNT};
  }
  it("should initiate a swap", async function () {

  // Load the  fixture
     const {owner, participant, busd, atomicSwap_address,atomicSwap,SWAP_ID,TIME_LOCK_DURATION,secret,HASHLOCK,AMOUNT } = await loadFixture(deployTokenFixture);
     
  // Approve token transfer from owner to atomicSwap contract

     const tx =  await busd.approve(atomicSwap_address,AMOUNT);

  // Initiate the swap
      const txs= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
         
  // Get the swap details

      const swaps = await atomicSwap.swaps(1);
      
  // Perform assertions

      expect(txs).to.emit(atomicSwap, 'SwapInitiated').withArgs(SWAP_ID, busd.address, owner.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      expect(swaps.initiator).to.equal(owner.address);
      expect(swaps.participant).to.equal(participant.address);
      expect(swaps.timeLockDuration).to.equal(TIME_LOCK_DURATION);
      expect(swaps.hashlock).to.equal(HASHLOCK);
      expect(swaps.amount).to.equal(AMOUNT);
      

  });
 
  
  it("should not  Refund before lock_Duration End", async function () {
    const { owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID, TIME_LOCK_DURATION, secret, HASHLOCK, AMOUNT } = await loadFixture(deployTokenFixture);
    const tx = await busd.approve(atomicSwap_address, AMOUNT);
    const txs = await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    
    
      // Attempt to refund before the lock_Duration has ended and expect it to revert

    await expect(atomicSwap.connect(owner).refundSwap(SWAP_ID)).to.be.revertedWith("Time-lock period has not passed yet"); 

  });

  it("should Refund after lock_Duration End", async function () {
    const { owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID, TIME_LOCK_DURATION, secret, HASHLOCK, AMOUNT } = await loadFixture(deployTokenFixture);
    const tx = await busd.approve(atomicSwap_address, AMOUNT);
    const txs = await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    
    // Increase time to simulate lock_Duration end

    await ethers.provider.send("evm_increaseTime", [TIME_LOCK_DURATION + 1]);
    await ethers.provider.send("evm_mine");
  
    const ownerBUSDBalanceBefore = await busd.balanceOf(owner.address);

    // Refund the swap after the lock_Duration has ended

    await atomicSwap.connect(owner).refundSwap(SWAP_ID);
    const ownerBUSDBalanceAfter = await busd.balanceOf(owner.address);    
    expect(ownerBUSDBalanceAfter).to.equal(ownerBUSDBalanceBefore.add(AMOUNT));
  });



});



describe(" successful Cross chain  Scenario:", function () {

  async function deployCrossFixture() {
    const SWAP_ID = 1;
    const TIME_LOCK_DURATION = 360; // 1 hour
    const AWARYTIME_LOCK_DURATION = 240 ;
    const secret='factory';
    const attacksecret = "bug";

    const secret32 = ethers.utils.formatBytes32String(secret);
    const HASHLOCK = ethers.utils.keccak256(secret32);
    
    const bugsecret =ethers.utils.formatBytes32String(attacksecret);
    const ATTACKHASHLOCK =ethers.utils.keccak256(bugsecret);

    const AMOUNT = ethers.utils.parseUnits("1");
  
    const AtomicSwap = await ethers.getContractFactory("BinanceAtomicSwap");
    const atomicSwap = await AtomicSwap.deploy();

    const atomicSwap_address = await atomicSwap.address

    const Busd = await ethers.getContractFactory("BUSD");
    const busd = await Busd.deploy();
    [owner, participant] = await ethers.getSigners();

    // Deploy PolygonAtomicSwap contract

   const PAtomicSwap = await ethers.getContractFactory("PolygonAtomicSwap");
   const patomicSwap = await PAtomicSwap.connect(participant).deploy();

   const PatomicSwap_address = await patomicSwap.address

    // Deploy Pusd token contract on Polygon

   const Pusd = await ethers.getContractFactory("PUSD");
   const pusd = await Pusd.connect(participant).deploy();
  
      return { owner, participant, busd, atomicSwap_address,atomicSwap,SWAP_ID,TIME_LOCK_DURATION,secret32,HASHLOCK,AMOUNT,
               PatomicSwap_address ,pusd,patomicSwap,AWARYTIME_LOCK_DURATION,bugsecret};
  }

  it("should initiate a swap in Binance / Polygon Networks", async function () {

    const {  PatomicSwap_address ,pusd,patomicSwap,owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID, TIME_LOCK_DURATION, secret32, HASHLOCK, AMOUNT } = await loadFixture(deployCrossFixture);

      const tx =  await busd.approve(atomicSwap_address,AMOUNT);

      const txs= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      const swaps = await atomicSwap.swaps(1);
      expect(txs).to.emit(atomicSwap, 'SwapInitiated').withArgs(SWAP_ID, busd.address, owner.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      expect(swaps.initiator).to.equal(owner.address);
      expect(swaps.participant).to.equal(participant.address);
      expect(swaps.timeLockDuration).to.equal(TIME_LOCK_DURATION);
      expect(swaps.hashlock).to.equal(HASHLOCK);
      expect(swaps.amount).to.equal(AMOUNT);



      const pptx =  await pusd.connect(participant).approve(PatomicSwap_address,AMOUNT);


      const ptxs = await patomicSwap.connect(participant).initiateSwap(SWAP_ID, pusd.address, owner.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      const pswaps = await patomicSwap.swaps(1);
      expect(txs).to.emit(atomicSwap, 'SwapInitiated').withArgs(SWAP_ID, pusd.address, participant.address, owner.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      expect(pswaps.initiator).to.equal(participant.address);
      expect(pswaps.participant).to.equal(owner.address);
      expect(pswaps.timeLockDuration).to.equal(TIME_LOCK_DURATION);
      expect(pswaps.hashlock).to.equal(HASHLOCK);
      expect(pswaps.amount).to.equal(AMOUNT);

  });

  it("should Alice excute Cross_chain swap successful ( Having now PUSD in Polygon network ) ", async function () {
    const {  PatomicSwap_address ,pusd,patomicSwap,owner, AWARYTIME_LOCK_DURATION,participant, busd, atomicSwap_address, atomicSwap, SWAP_ID, TIME_LOCK_DURATION, secret32,bugsecret, HASHLOCK, AMOUNT } = await loadFixture(deployCrossFixture);
    
    
    const tx =  await busd.approve(atomicSwap_address,AMOUNT);
    const txs= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    const swaps = await atomicSwap.swaps(1);

    const pptx =  await pusd.connect(participant).approve(PatomicSwap_address,AMOUNT);
    const ptxs = await patomicSwap.connect(participant).initiateSwap(SWAP_ID, pusd.address, owner.address, AWARYTIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    const pswaps = await patomicSwap.swaps(1);
    usedhash= pswaps.hashlock ;

//before executeSwap have to check hash 
    const checktx=await patomicSwap.checkHash(SWAP_ID,usedhash)
   if (checktx){
    const Btx = await patomicSwap.connect(owner).executeSwap(SWAP_ID,secret32) ;
    const ownerPUSDBalanceAfter = await pusd.balanceOf(owner.address);    
 
    expect(ownerPUSDBalanceAfter).to.equal(AMOUNT);
   }
  });

  it("should Bob excute Cross_chain swap successful ( Having now BUSD in Binance network )", async function () {
    const {  PatomicSwap_address ,pusd,patomicSwap,owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID,
      AWARYTIME_LOCK_DURATION, TIME_LOCK_DURATION, secret32, HASHLOCK, AMOUNT } = await loadFixture(deployCrossFixture);
    
    
    const tx =  await busd.approve(atomicSwap_address,AMOUNT);
    const txs= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    const swaps = await atomicSwap.swaps(1);

    const pptx =  await pusd.connect(participant).approve(PatomicSwap_address,AMOUNT);
    const ptxs = await patomicSwap.connect(participant).initiateSwap(SWAP_ID, pusd.address, owner.address, AWARYTIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    const pswaps = await patomicSwap.swaps(1);


    const Btx = await atomicSwap.connect(participant).executeSwap(SWAP_ID,secret32) ;
    const ownerBUSDBalanceAfter = await busd.balanceOf(participant.address);    

    expect(ownerBUSDBalanceAfter).to.equal(AMOUNT);


  });

});


describe("Failure / Attacks  Cross chain Scenario:", function () {

  async function deployCrossFixture() {
    const SWAP_ID = 1;
    const TIME_LOCK_DURATION = 360; // 1 hour
    const AWARYTIME_LOCK_DURATION = 240 ;
    const secret='factory';
    const attacksecret = "bug";

    const secret32 = ethers.utils.formatBytes32String(secret);
    const HASHLOCK = ethers.utils.keccak256(secret32);
    
    const bugsecret =ethers.utils.formatBytes32String(attacksecret);
    const ATTACKHASHLOCK =ethers.utils.keccak256(bugsecret);

    const AMOUNT = ethers.utils.parseUnits("1");
  
    const AtomicSwap = await ethers.getContractFactory("BinanceAtomicSwap");
    const atomicSwap = await AtomicSwap.deploy();

    const atomicSwap_address = await atomicSwap.address

    const Busd = await ethers.getContractFactory("BUSD");
    const busd = await Busd.deploy();
    [owner, participant] = await ethers.getSigners();


   const PAtomicSwap = await ethers.getContractFactory("PolygonAtomicSwap");
   const patomicSwap = await PAtomicSwap.connect(participant).deploy();

   const PatomicSwap_address = await patomicSwap.address

   const Pusd = await ethers.getContractFactory("PUSD");
   const pusd = await Pusd.connect(participant).deploy();
  
      return { owner, participant, busd, atomicSwap_address,atomicSwap,SWAP_ID,TIME_LOCK_DURATION,secret32,HASHLOCK,AMOUNT,
               PatomicSwap_address ,pusd,patomicSwap,AWARYTIME_LOCK_DURATION,bugsecret,ATTACKHASHLOCK};
  }
  it("should not refund if cross-swap excute", async function () {
    const {  PatomicSwap_address ,pusd,patomicSwap,owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID,
      AWARYTIME_LOCK_DURATION, TIME_LOCK_DURATION, secret32, HASHLOCK, AMOUNT } = await loadFixture(deployCrossFixture);
    
    
    const tx =  await busd.approve(atomicSwap_address,AMOUNT);
    const txs= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    const swaps = await atomicSwap.swaps(1);

    const pptx =  await pusd.connect(participant).approve(PatomicSwap_address,AMOUNT);
    const ptxs = await patomicSwap.connect(participant).initiateSwap(SWAP_ID, pusd.address, owner.address, AWARYTIME_LOCK_DURATION, HASHLOCK, AMOUNT);
    const pswaps = await patomicSwap.swaps(1);


    const Btx = await atomicSwap.connect(participant).executeSwap(SWAP_ID,secret32) ;
    const atx = await patomicSwap.connect(owner).executeSwap(SWAP_ID,secret32) ;

    const ownerBUSDBalanceAfter = await busd.balanceOf(participant.address);    
    const ownerPUSDBalanceAfter = await pusd.balanceOf(owner.address);    

    expect(ownerBUSDBalanceAfter).to.equal(AMOUNT);
    expect(ownerPUSDBalanceAfter).to.equal(AMOUNT);

    await expect(patomicSwap.connect(participant).refundSwap(SWAP_ID)).to.be.revertedWith("Swap ID does not exist"); 
    await expect(atomicSwap.connect(owner).refundSwap(SWAP_ID)).to.be.revertedWith("Swap ID does not exist"); 


  });





  it("Untrust hash attack Scenario :Bob init swap with  different hash , Alice  excute Cross_chain swap Without check the hash (give her secret), bob know the alice secret ,take alice's token , wait until IME_LOCK_DURATION end then refund his token , alice can't take bob's token cause hash is different"
  
  ,async function () {

    const {  PatomicSwap_address ,pusd,patomicSwap,owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID,
      AWARYTIME_LOCK_DURATION, TIME_LOCK_DURATION, secret32, HASHLOCK, AMOUNT,ATTACKHASHLOCK } = await loadFixture(deployCrossFixture);

      const bobPusdbalancebefore = await pusd.balanceOf(owner.address)

      const alice =  await busd.approve(atomicSwap_address,AMOUNT);
      const alicex= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      const swaps = await atomicSwap.swaps(1);
  
      const bob =  await pusd.connect(participant).approve(PatomicSwap_address,AMOUNT);
      const bobx = await patomicSwap.connect(participant).initiateSwap(SWAP_ID, pusd.address, owner.address, AWARYTIME_LOCK_DURATION, ATTACKHASHLOCK, AMOUNT);
      const pswaps = await patomicSwap.swaps(1);
     

      await expect(patomicSwap.connect(owner).executeSwap(SWAP_ID,secret32)).to.be.revertedWith("Invalid secret"); 

      const BobBx = await atomicSwap.connect(participant).executeSwap(SWAP_ID,secret32) ;

      await ethers.provider.send("evm_increaseTime", [TIME_LOCK_DURATION + 1]);
      await ethers.provider.send("evm_mine");

      const boba= await patomicSwap.connect(participant).refundSwap(SWAP_ID);

      const bobBUSDBalanceAfter = await busd.balanceOf(participant.address);    
      const bobPusdbalanceafter = await pusd.balanceOf(owner.address)
      expect(bobBUSDBalanceAfter).to.equal(AMOUNT);
      expect(bobPusdbalanceafter).to.equal(bobPusdbalancebefore);

  });



  it("last moments attack Scenario :Alice init swap with TIME_LOCK_DURATION = 10 m , bob do wrong and   init swap with TIME_LOCK_DURATION = 10 m also, alice wait 9.55 m then excute swap,alice got bob's token, but bob have no time to excute swap to get alice 's token, alice can now refund cause TIME_LOCK_DURATION end ."
  
  ,async function () {

    const {  PatomicSwap_address ,pusd,patomicSwap,owner, participant, busd, atomicSwap_address, atomicSwap, SWAP_ID,
      AWARYTIME_LOCK_DURATION, TIME_LOCK_DURATION, secret32, HASHLOCK, AMOUNT,ATTACKHASHLOCK } = await loadFixture(deployCrossFixture);

      const alcieBusdbalancebefore = await busd.balanceOf(owner.address)
      const alice =  await busd.approve(atomicSwap_address,AMOUNT);
      const alicex= await atomicSwap.initiateSwap(SWAP_ID, busd.address, participant.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      const swaps = await atomicSwap.swaps(1);
  
      const bob =  await pusd.connect(participant).approve(PatomicSwap_address,AMOUNT);
      const bobx = await patomicSwap.connect(participant).initiateSwap(SWAP_ID, pusd.address, owner.address, TIME_LOCK_DURATION, HASHLOCK, AMOUNT);
      const pswaps = await patomicSwap.swaps(1);
     

// alice wait to last moment to excute swap and provide her secret 
const alicexx = await patomicSwap.connect(owner).executeSwap(SWAP_ID,secret32) ;

      await ethers.provider.send("evm_increaseTime", [TIME_LOCK_DURATION +1 ]);
      await ethers.provider.send("evm_mine");

      await expect(atomicSwap.connect(participant).executeSwap(SWAP_ID,secret32)).to.be.revertedWith("Time-lock period has passed"); 

      const boba= await atomicSwap.connect(owner).refundSwap(SWAP_ID);

       const aliceBUSDBalanceAfter = await busd.balanceOf(owner.address);    
       const alicePusdbalanceafter = await pusd.balanceOf(owner.address)
       expect(aliceBUSDBalanceAfter).to.equal(alcieBusdbalancebefore);
       expect(alicePusdbalanceafter).to.equal(AMOUNT);
       const bobBUSDBalance = await busd.balanceOf(participant.address)
       expect(bobBUSDBalance).to.equal(0);


  });
});

