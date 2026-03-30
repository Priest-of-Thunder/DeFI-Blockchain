// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPToken.sol";

contract DEX {
    IERC20 public tokenA;
    IERC20 public tokenB;
    LPToken public lpToken;

    uint256 public reserveA;
    uint256 public reserveB;

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        lpToken = new LPToken();
    }

    // 4.1.1 Liquidity Pool Logic
    function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 liquidity) {
        if (reserveA > 0 || reserveB > 0) {
            // Must preserve ratio: x/y = amountA/amountB [cite: 42]
            require(amountA * reserveB == amountB * reserveA, "Invalid ratio");
        }

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        uint256 _totalLPT = lpToken.totalSupply();
        if (_totalLPT == 0) {
            liquidity = amountA; // Initial ratio [cite: 44]
        } else {
            liquidity = (amountA * _totalLPT) / reserveA; // Proportional minting [cite: 45]
        }

        reserveA += amountA;
        reserveB += amountB;
        lpToken.mint(msg.sender, liquidity);
    }

    function removeLiquidity(uint256 lptAmount) external {
        uint256 _totalLPT = lpToken.totalSupply();
        uint256 amountA = (lptAmount * reserveA) / _totalLPT;
        uint256 amountB = (lptAmount * reserveB) / _totalLPT;

        lpToken.burn(msg.sender, lptAmount); // [cite: 46]
        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
    }

    // 4.1.2 Swapping Mechanism
    function swap(address fromToken, uint256 amountIn) external returns (uint256 amountOut) {
        require(fromToken == address(tokenA) || fromToken == address(tokenB), "Invalid token");
        
        bool isA = fromToken == address(tokenA);
        (IERC20 tIn, IERC20 tOut, uint256 rIn, uint256 rOut) = isA 
            ? (tokenA, tokenB, reserveA, reserveB) 
            : (tokenB, tokenA, reserveB, reserveA);

        tIn.transferFrom(msg.sender, address(this), amountIn);

        // Calculate amount out with 0.3% fee: (x + Δx * 0.997) * (y - Δy) = x * y [cite: 52, 55]
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * rOut;
        uint256 denominator = (rIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;

        tOut.transfer(msg.sender, amountOut);
        
        // Update internal reserves [cite: 58]
        if (isA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
    }

    // 4.1.3 Metrics [cite: 60]
    function spotPrice() public view returns (uint256) {
        return (reserveB * 1e18) / reserveA; // Price of A in terms of B [cite: 48]
    }
}