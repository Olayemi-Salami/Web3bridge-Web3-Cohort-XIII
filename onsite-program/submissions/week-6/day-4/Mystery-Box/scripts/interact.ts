import { ethers } from "hardhat";

async function main() {
  const [deployer, user] = await ethers.getSigners();

  // Deploy VRF Mock (for local)
  const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2PlusMock");
  const vrfMock = await VRFMock.deploy(ethers.parseEther("0.000000001"), ethers.parseEther("0.000000001"));
  await vrfMock.waitForDeployment();
  const subId = await vrfMock.createSubscription();
  await vrfMock.fundSubscription(subId, ethers.parseEther("10"));

  // Deploy LootBox
  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(
    await vrfMock.getAddress(),
    "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    subId,
    ethers.parseEther("0.1")
  );
  await lootBox.waitForDeployment();
  console.log("LootBox deployed to:", await lootBox.getAddress());

  // Add consumer
  await vrfMock.addConsumer(subId, await lootBox.getAddress());

  // Deploy and transfer mocks (similar to tests, omitted for brevity)

  // Add a reward
  await lootBox.addReward(0, ZeroAddress, 100, 50); // Example ERC20
  console.log("Reward added");

  // Open box as user
  const tx = await lootBox.connect(user).openBox({ value: ethers.parseEther("0.1") });
  const receipt = await tx.wait();
  const requestId = receipt.logs.find((log: any) => log.fragment.name === "BoxOpened")?.args.requestId;
  console.log("Box opened, requestId:", requestId);

  // Fulfill (in production, Chainlink does this; here manual for local)
  await vrfMock.fulfillRandomWords(requestId, await lootBox.getAddress(), [12345]);
  console.log("Randomness fulfilled");

  // Withdraw fees
  await lootBox.withdrawFees();
  console.log("Fees withdrawn");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});