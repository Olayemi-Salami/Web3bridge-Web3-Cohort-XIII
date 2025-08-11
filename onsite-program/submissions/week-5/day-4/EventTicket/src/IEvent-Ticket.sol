// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transferFrom(address from, address to, uint amount) external returns (bool);
}

contract EventTicketPay {
    address public owner;
    uint public ticketPrice;
    uint public totalTickets;
    uint public ticketsSold;
    IERC20 public paymentToken;

    mapping(address => uint) public ticketsOwned;

    constructor(address _token, uint _price, uint _totalTickets) {
        owner = msg.sender;
        paymentToken = IERC20(_token);
        ticketPrice = _price;
        totalTickets = _totalTickets;
    }

    
    function buyTicket(uint _quantity) external {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(ticketsSold + _quantity <= totalTickets, "Not enough tickets left");

        uint cost = ticketPrice * _quantity;
        require(paymentToken.transferFrom(msg.sender, address(this), cost), "Token payment failed");

        ticketsOwned[msg.sender] += _quantity;
        ticketsSold += _quantity;
    }


    function transferTicket(address _to, uint _quantity) external {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(ticketsOwned[msg.sender] >= _quantity, "Not enough tickets");

        ticketsOwned[msg.sender] -= _quantity;
        ticketsOwned[_to] += _quantity;
    }

    function remainingTickets() external view returns (uint) {
        return totalTickets - ticketsSold;
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint balance = paymentTokenBalance();
        require(paymentToken.transferFrom(address(this), owner, balance), "Withdraw failed");
    }

    
    function paymentTokenBalance() public view returns (uint) {
        return paymentToken.balanceOf(address(this));
    }
}
