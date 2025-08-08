// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    address[] public owners;
    uint public requiredApprovals;

    struct Transfer {
        address to;
        uint amount;
        uint approvals;
        bool executed;
        mapping(address => bool) approvedBy;
    }

    Transfer[] public transfers;

    modifier onlyOwner() {
        bool isOwner = false;
        for (uint i = 0; i < owners.length; i++) {
            if (msg.sender == owners[i]) isOwner = true;
        }
        require(isOwner, "Not an owner");
        _;
    }

    constructor(address[] memory _owners, uint _requiredApprovals) {
        require(_owners.length >= _requiredApprovals, "Not enough owners");
        owners = _owners;
        requiredApprovals = _requiredApprovals;
    }

    receive() external payable {}

    function createTransfer(address to, uint amount) external onlyOwner {
        Transfer storage t = transfers.push();
        t.to = to;
        t.amount = amount;
        t.approvals = 0;
        t.executed = false;
    }

    function approveTransfer(uint index) external onlyOwner {
        Transfer storage t = transfers[index];
        require(!t.executed, "Already executed");
        require(!t.approvedBy[msg.sender], "Already approved");

        t.approvedBy[msg.sender] = true;
        t.approvals++;

        if (t.approvals >= requiredApprovals) {
            t.executed = true;
            payable(t.to).transfer(t.amount);
        }
    }

    function getTransfer(uint index) external view returns (
        address to, uint amount, uint approvals, bool executed
    ) {
        Transfer storage t = transfers[index];
        return (t.to, t.amount, t.approvals, t.executed);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransfersCount() external view returns (uint) {
        return transfers.length;
    }
}
