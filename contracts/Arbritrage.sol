// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DEX.sol";

contract Arbitrage {
    function executeArbitrage(
        address dex1Addr, 
        address dex2Addr, 
        address tokenA, 
        uint256 amount
    ) external {
        DEX dex1 = DEX(dex1Addr);
        DEX dex2 = DEX(dex2Addr);
        
        // Example: Buy on DEX1, Sell on DEX2 [cite: 105]
        IERC20(tokenA).approve(dex1Addr, amount);
        uint256 tokensBought = dex1.swap(tokenA, amount);
        
        address tokenB = address(dex1.tokenB());
        IERC20(tokenB).approve(dex2Addr, tokensBought);
        uint256 finalTokens = dex2.swap(tokenB, tokensBought);
        
        require(finalTokens > amount, "Arbitrage not profitable"); // [cite: 128]
        IERC20(tokenA).transfer(msg.sender, finalTokens); // [cite: 132]
    }
}