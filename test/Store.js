HARDHAT_LOG=console
const { expect } = require("chai");

describe("Store", function () {
  let store;
  let owner;
  let otherAccount;

  beforeEach(async () => {
    // Deploy the Store contract before each test
    const Store = await ethers.getContractFactory("Store");
    store = await Store.deploy();
    await store.deployed();

    // Get signers (accounts) to use for testing
    [owner, otherAccount] = await ethers.getSigners();
  });

  describe("addProduct", function () {
    it("should allow the owner to add a new product to the store", async function () {
      await store.connect(owner).addProduct("Vodka", 10);
      const product = await store.getProductByName("Vodka");
      expect(product.name).to.equal("Vodka");
      expect(product.quantity).to.equal(10);
    });

    it("should not allow non-owners to add a new product to the store", async function () {
      await expect(store.connect(otherAccount).addProduct("Vodka", 10)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not allow adding a product with an empty name", async function () {
      await expect(store.connect(owner).addProduct("", 10)).to.be.revertedWith("You have to enter a name!");
    });

    it("should not allow adding a product with a quantity of 0", async function () {
      await expect(store.connect(owner).addProduct("Vodka", 0)).to.be.revertedWith("Quantity can't be 0!");
    });
  });

  describe("updateProductQuantity", function () {
    it("should allow the owner to update the quantity of a product", async function () {
      await store.connect(owner).addProduct("Tequila", 10);
      await store.connect(owner).updateProductQuantity(0, 5);
      const product = await store.getProductByName("Tequila");
      expect(product.name).to.equal("Tequila");
      expect(product.quantity).to.equal(5);
    });

    it("should not allow non-owners to update the quantity of a product", async function () {
      await store.connect(owner).addProduct("Tequila", 10);
      await expect(store.connect(otherAccount).updateProductQuantity(0, 5)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not allow updating the quantity of a non-existent product", async function () {
      await expect(store.connect(owner).updateProductQuantity(0, 5)).to.be.revertedWith("This product does not exist!");
    });
  });

  describe("buyProduct", function () {
    beforeEach(async () => {
      // Add a product to the store before each test
      await store.connect(owner).addProduct("Wiskey", 10);
    });

    it("should allow a buyer to buy a product from the store", async function () {
      const [buyer] = await ethers.getSigners();
      await store.connect(buyer).buyProduct(0);
      const product = await store.getProductByName("Wiskey");
      expect(product.name).to.equal("Wiskey");
      expect(product.quantity).to.equal(9);
    });

    it("should not allow a buyer to buy a product twice", async function () {
      const [buyer] = await ethers.getSigners();
      await store.connect(buyer).buyProduct(0);
      await expect(store.connect(buyer).buyProduct(0)).to.be.revertedWith("You cannot buy the same product more than once!");
    });

    it("should not allow a buyer to buy a product with a quantity of 0", async function () {
      await store.connect(owner).addProduct("Mastika", 1);
      const [buyer] = await ethers.getSigners();
      await store.connect(buyer).buyProduct(1);
      const [otherAccount] = await ethers.getSigners();
      try {
        await store.connect(otherAccount).buyProduct(1);
      } catch (error) {
        expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Quantity can't be 0!'");
      }
    });
  });

  describe("refundProduct", function () {
    it("should allow a buyer to return a product if they are not satisfied within 100 blocks", async function () {
      await store.connect(owner).addProduct("Rakia", 1);
      const [buyer] = await ethers.getSigners();
  
      // Buy the product
      await store.connect(buyer).buyProduct(0);

      const productQuantityBefore = await store.getProductById(0);
      expect(productQuantityBefore.quantity).to.equal(0);
  
      // Return the product
      const returnTx = await store.connect(buyer).refundProduct(0);
      await returnTx.wait();
  
      // Verify that the product is available for purchase again
      const productQuantityAfter = await store.getProductById(0);
      expect(productQuantityAfter.quantity).to.equal(1);
    });

    it("should not allow a buyer to refund a product twice", async function () {
      await store.connect(owner).addProduct("Djin", 1);
      const [buyer] = await ethers.getSigners();
    
      // Buy the product
      await store.connect(buyer).buyProduct(0);
    
      // Refund the product
      const returnTx = await store.connect(buyer).refundProduct(0);
      await returnTx.wait();

      // Attempt to refund again
      await expect(store.connect(buyer).refundProduct(0)).to.be.revertedWith("You've already returned your product or didn't even bought it.");
    
      // Verify that the product quantity has not changed
      const product = await store.getProductById(0);
      expect(product.quantity).to.equal(1);
    });

    it("should not allow a buyer to refund a product after 100 blocks", async function () {
      await store.connect(owner).addProduct("Djin", 1);
      const [buyer] = await ethers.getSigners();
    
      // Buy the product
      await store.connect(buyer).buyProduct(0);
    
      // Advance the blocktime by 101 blocks
      for (let i = 0; i < 101; i++) {
        await network.provider.send("evm_mine");
      }

      // Attempt to refund the product
      try {
        await store.connect(buyer).refundProduct(0);
      } catch (error) {
        expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Sorry, your request for refund has been denied.'");
      }    

      // Verify that the product quantity has not changed
      const product = await store.getProductById(0);
      expect(product.quantity).to.equal(0);
    });
  });
});