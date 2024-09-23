// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ChinaCoin is ERC20, Ownable, ERC20Permit {
    constructor(address initialOwner)
        ERC20("china coin", "CCN")
        Ownable(initialOwner)
        ERC20Permit("china coin")
    {
         _mint(msg.sender, 3000000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}