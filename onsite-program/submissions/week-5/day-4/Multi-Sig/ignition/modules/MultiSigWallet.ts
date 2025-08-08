// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigWallet = buildModule("MultiSigWalletModule", (m) => {
  
  const multisigwallet = m.contract("MultiSigWallet")

  return { multisigwallet };
});

export default MultiSigWallet;



