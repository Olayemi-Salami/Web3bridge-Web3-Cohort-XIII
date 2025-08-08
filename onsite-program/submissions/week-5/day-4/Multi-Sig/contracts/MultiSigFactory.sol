// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MultiSigWallet.sol";

contract MultiSigFactory {
    address[] public deployedWallets;

    event WalletCreated(address walletAddress);

    function createWallet(address[] memory _owners, uint _requiredApprovals) external {
        MultiSigWallet wallet = new MultiSigWallet(_owners, _requiredApprovals);
        deployedWallets.push(address(wallet));
        emit WalletCreated(address(wallet));
    }

    function getWallets() external view returns (address[] memory) {
        return deployedWallets;
    }
}
