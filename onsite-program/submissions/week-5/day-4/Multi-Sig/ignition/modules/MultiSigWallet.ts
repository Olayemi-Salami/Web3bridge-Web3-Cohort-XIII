import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigWalletModule = buildModule("MultiSigWalletModule", (m) => {
  const owners = [
    "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
    "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  ];
  const requiredConfirmations = 2;

  const multiSig = m.contract("MultiSigWallet", [owners, requiredConfirmations]);

  return { multiSig };
});

export default MultiSigWalletModule;
