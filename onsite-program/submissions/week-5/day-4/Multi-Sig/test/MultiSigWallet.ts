import { expect } from "chai";
import hre from "hardhat";

describe("MultiSigWallet", function () {
  it("should require 3 approvals before executing transfer", async function () {
    const { ethers } = hre;
    const [owner1, owner2, owner3, , recipient] = await ethers.getSigners();

    const owners = [owner1.address, owner2.address, owner3.address];

    const requiredApprovals = 3;
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(owners, requiredApprovals);
    await wallet.waitForDeployment();

    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("10"),
    });

    
    await wallet.connect(owner1).createTransfer(recipient.address, ethers.parseEther("5"));

    await wallet.connect(owner1).approveTransfer(0);
    let transfer = await wallet.getTransfer(0);
    expect(transfer.approvals).to.equal(1);
    expect(transfer.executed).to.equal(false);

   
    await wallet.connect(owner2).approveTransfer(0);
    transfer = await wallet.getTransfer(0);
    expect(transfer.approvals).to.equal(2);
    expect(transfer.executed).to.equal(false);

    const balanceBefore = await ethers.provider.getBalance(recipient.address);

    
    await wallet.connect(owner3).approveTransfer(0);
    transfer = await wallet.getTransfer(0);
    expect(transfer.approvals).to.equal(3);
    expect(transfer.executed).to.equal(true);

    const balanceAfter = await ethers.provider.getBalance(recipient.address);
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("5"));
  });

  it("should not allow non-owner to create transfer", async function () {
    const { ethers } = hre;
    const [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();

    const owners = [owner1.address, owner2.address, owner3.address];
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(owners, 3);
    await wallet.waitForDeployment();

    await expect(
      wallet.connect(nonOwner).createTransfer(recipient.address, ethers.parseEther("1"))
    ).to.be.revertedWith("Not an owner");
  });

  it("should not allow duplicate approvals", async function () {
    const { ethers } = hre;
    const [owner1, owner2, owner3, , recipient] = await ethers.getSigners();

    const owners = [owner1.address, owner2.address, owner3.address];
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(owners, 3);
    await wallet.waitForDeployment();

    await wallet.connect(owner1).createTransfer(recipient.address, ethers.parseEther("1"));
    await wallet.connect(owner1).approveTransfer(0);

    await expect(wallet.connect(owner1).approveTransfer(0))
      .to.be.revertedWith("Already approved");
  });

  it("should not execute before required approvals", async function () {
    const { ethers } = hre;
    const [owner1, owner2, owner3, , recipient] = await ethers.getSigners();

    const owners = [owner1.address, owner2.address, owner3.address];
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(owners, 3);
    await wallet.waitForDeployment();

    await wallet.connect(owner1).createTransfer(recipient.address, ethers.parseEther("2"));
    await wallet.connect(owner1).approveTransfer(0);
    await wallet.connect(owner2).approveTransfer(0);

    const transfer = await wallet.getTransfer(0);
    expect(transfer.executed).to.equal(false);
  });
});
