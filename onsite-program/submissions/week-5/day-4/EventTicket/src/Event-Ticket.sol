// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract EventTicket {
    address public owner;
    uint public ticketPrice;
    uint public totalTickets;
    uint public ticketsSold;

    mapping(address => uint) public ticketsOwned;

    constructor(uint _price, uint _totalTickets) {
        owner = msg.sender;
        ticketPrice = _price;
        totalTickets = _totalTickets;
    }

    
    function buyTicket(uint _quantity) external payable {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(ticketsSold + _quantity <= totalTickets, "Not enough tickets left");
        require(msg.value == ticketPrice * _quantity, "Incorrect Ether sent");

        ticketsOwned[msg.sender] += _quantity;
        ticketsSold += _quantity;
    }

    
    function transferTicket(address _to, uint _quantity) external {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(ticketsOwned[msg.sender] >= _quantity, "Not enough tickets to transfer");

        ticketsOwned[msg.sender] -= _quantity;
        ticketsOwned[_to] += _quantity;
    }

    function remainingTickets() external view returns (uint) {
        return totalTickets - ticketsSold;
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
