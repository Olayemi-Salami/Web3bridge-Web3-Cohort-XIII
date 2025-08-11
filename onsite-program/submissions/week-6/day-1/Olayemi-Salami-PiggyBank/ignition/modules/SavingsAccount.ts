import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SavingsAccountModule = buildModule("SavingsAccountModule", (m) => {
  const token = "0x0000000000000000000000000000000000000000";
  const lockPeriod = 60 * 60 * 24 * 30;
  const owner = "0x0fEc8E39CA6F2F4D37C98aB76363C2f415958fc2";
  const factoryAdmin = "0x0fEc8E39CA6F2F4D37C98aB76363C2f415958fc2";

  const savingsaccount = m.contract("SavingsAccount", [
    owner,
    token,
    lockPeriod,
    factoryAdmin
  ]);

  return { savingsaccount };
});

export default SavingsAccountModule;
