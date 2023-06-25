const { expect } = require("chai");

describe("BUSD contract", function () {
  let hardhatToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    const Token = await ethers.getContractFactory("BUSD");
    [owner, addr1, addr2] = await ethers.getSigners();

    hardhatToken = await Token.deploy();
 });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    

    it("Should emit Transfer events", async function () {
      // Transfer 50 tokens from owner to addr1
      await expect(hardhatToken.transfer(addr1.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr1.address, 50);

      // Transfer 50 tokens from addr1 to addr2
      await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr1.address, addr2.address, 50);
    });

    
  });
});
