// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    address public governance;

    event FundsDeposited(address indexed sender, uint256 amount);
    event FundsReleased(address indexed recipient, uint256 amount);
    event GovernanceSet(address indexed governance);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Vault: caller is not governance");
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "Vault: zero address");
        governance = _governance;
        emit GovernanceSet(_governance);
    }

    function releaseETH(address payable recipient, uint256 amount) external onlyGovernance {
        require(recipient != address(0), "Vault: zero recipient");
        require(address(this).balance >= amount, "Vault: insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Vault: ETH transfer failed");
        emit FundsReleased(recipient, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
