// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract SpecialCoin is ERC20, Ownable, ERC20Permit {
    constructor(address initialOwner)
        ERC20("special coin", "SCN")
        Ownable(initialOwner)
        ERC20Permit("special coin")
    {
         _mint(msg.sender, 9000000 * 10 ** 6);
    }

     function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}