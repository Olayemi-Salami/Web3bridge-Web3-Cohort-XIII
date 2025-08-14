import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, BigNumberish, ZeroAddress } from "ethers";
import { VRFCoordinatorV2PlusMock } from "@chainlink/contracts/src/v0.8/vrf/dev/VRFCoordinatorV2PlusMock.sol/VRFCoordinatorV2PlusMock";

describe("LootBox", function () {
  let owner: Signer;
  let user: Signer;
  let lootBox: Contract;
  let vrfMock: Contract;
  let erc20Mock: Contract;
  let erc721Mock: Contract;
  let erc1155Mock: Contract;
  let subId: BigNumberish;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mocks
    const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2PlusMock");
    vrfMock = await VRFMock.deploy(ethers.parseEther("0.000000001"), ethers.parseEther("0.000000001")); // baseFee, gasPriceLink

    subId = await vrfMock.createSubscription();
    await vrfMock.fundSubscription(subId, ethers.parseEther("10")); // Fund with LINK

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock"); // Assume you have a mock ERC20
    erc20Mock = await ERC20Mock.deploy("MockERC20", "M20");
    await erc20Mock.mint(await owner.getAddress(), ethers.parseEther("1000"));

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock"); // Assume mock ERC721
    erc721Mock = await ERC721Mock.deploy("MockERC721", "M721");
    await erc721Mock.mint(await owner.getAddress(), 1);

    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock"); // Assume mock ERC1155
    erc1155Mock = await ERC1155Mock.deploy("uri");
    await erc1155Mock.mint(await owner.getAddress(), 1, 10, "0x");

    // Deploy LootBox
    const LootBox = await ethers.getContractFactory("LootBox");
    lootBox = await LootBox.deploy(
      await vrfMock.getAddress(),
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // Mock keyHash
      subId,
      ethers.parseEther("0.1") // boxFee
    );

    // Add LootBox as consumer
    await vrfMock.addConsumer(subId, await lootBox.getAddress());

    // Transfer rewards to LootBox
    await erc20Mock.transfer(await lootBox.getAddress(), ethers.parseEther("100"));
    await erc721Mock.transferFrom(await owner.getAddress(), await lootBox.getAddress(), 1);
    await erc1155Mock.safeTransferFrom(await owner.getAddress(), await lootBox.getAddress(), 1, 5, "0x");
  });

  it("should allow owner to add rewards and update totalWeight", async () => {
    const tx = await lootBox.addReward(0, await erc20Mock.getAddress(), ethers.parseEther("10"), 50); // ERC20
    await expect(tx).to.emit(lootBox, "RewardAdded").withArgs(0, 0, await erc20Mock.getAddress(), ethers.parseEther("10"), 50);
    expect(await lootBox.totalWeight()).to.equal(50);
  });

  it("should allow owner to update fee, subscriptionId, and keyHash", async () => {
    const newFee = ethers.parseEther("0.2");
    await expect(lootBox.updateFee(newFee)).to.emit(lootBox, "FeeUpdated").withArgs(newFee);
    expect(await lootBox.boxFee()).to.equal(newFee);

    const newSubId = 2;
    await expect(lootBox.updateSubscriptionId(newSubId)).to.emit(lootBox, "SubscriptionUpdated").withArgs(newSubId);

    const newKeyHash = "0xabc";
    await expect(lootBox.updateKeyHash(newKeyHash)).to.emit(lootBox, "KeyHashUpdated").withArgs(newKeyHash);
  });

  it("should revert openBox if incorrect fee or no rewards", async () => {
    await expect(lootBox.openBox({ value: ethers.parseEther("0.05") })).to.be.revertedWith("Incorrect fee");
    await expect(lootBox.openBox({ value: ethers.parseEther("0.1") })).to.be.revertedWith("No rewards set");
  });

  it("should open box, request randomness, fulfill, assign reward, and transfer", async () => {
    // Add rewards
    await lootBox.addReward(0, await erc20Mock.getAddress(), ethers.parseEther("10"), 50); // ERC20, weight 50
    await lootBox.addReward(1, await erc721Mock.getAddress(), 1, 30); // ERC721, weight 30
    await lootBox.addReward(2, await erc1155Mock.getAddress(), 1, 20); // ERC1155, weight 20 (id=1, but amount in transfer is 1)

    // Open box
    const tx = await lootBox.connect(user).openBox({ value: ethers.parseEther("0.1") });
    const receipt = await tx.wait();
    const requestId = receipt.logs.find((log: any) => log.fragment.name === "BoxOpened").args.requestId;

    await expect(tx).to.emit(lootBox, "BoxOpened").withArgs(await user.getAddress(), requestId);
    await expect(tx).to.emit(vrfMock, "RandomWordsRequested");

    // Fulfill (mock returns a fixed random word that selects index 0 for testing)
    const fulfillTx = await vrfMock.fulfillRandomWords(requestId, await lootBox.getAddress(), [12345]); // Random word, %100 =45, <50 -> index0
    await expect(fulfillTx).to.emit(vrfMock, "RandomWordsFulfilled");
    await expect(fulfillTx).to.emit(lootBox, "RandomnessFulfilled");
    await expect(fulfillTx).to.emit(lootBox, "RewardAssigned").withArgs(await user.getAddress(), 0, 0, await erc20Mock.getAddress(), ethers.parseEther("10"));

    // Check transfer
    expect(await erc20Mock.balanceOf(await user.getAddress())).to.equal(ethers.parseEther("10"));
  });

  it("should allow owner to withdraw fees", async () => {
    const initialBalance = await ethers.provider.getBalance(await owner.getAddress());
    await lootBox.connect(user).openBox({ value: ethers.parseEther("0.1") }); // Add fee (ignore fulfill for this test)
    await lootBox.withdrawFees();
    const newBalance = await ethers.provider.getBalance(await owner.getAddress());
    expect(newBalance).to.be.gt(initialBalance);
  });
});