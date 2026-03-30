# 🦄 DeFi Automated Market Maker (AMM) DEX & Arbitrage

This repository contains the smart contracts and frontend UI for a Decentralized Exchange (DEX) implementing the $x \times y = k$ constant product formula, alongside an Arbitrage execution contract.

**Live Vercel UI:** https://de-fi-blockchain.vercel.app/
**Video Demonstration:** https://drive.google.com/file/d/1eSNhV7WtF-JpOG4OCDsZkcONBEyzxlkx/view?usp=sharing

---

## 🌐 Network Information
* **Testnet Used:** Ethereum Sepolia Testnet

---

## 📜 Deployed & Verified Contracts
All contracts are verified on Sepolia Etherscan. Click the links below to view the source code and interact with them directly.

| Contract | Address | Etherscan Link |
|----------|---------|----------------|
| **Token A** | `0xd1f147a34d9C8ccdb123aC2DD56B021ac8454B70` | [View on Etherscan](https://sepolia.etherscan.io/address/0xd1f147a34d9C8ccdb123aC2DD56B021ac8454B70#code) |
| **Token B** | `0x0Dd71284821f77d1d56D8Bf7e46B332e55A25B2E` | [View on Etherscan](https://sepolia.etherscan.io/address/0x0Dd71284821f77d1d56D8Bf7e46B332e55A25B2E#code) |
| **DEX Instance 1** | `0x9E20D9C3EAC5250D3d434dE7eD701696fc096aBF` | [View on Etherscan](https://sepolia.etherscan.io/address/0x9E20D9C3EAC5250D3d434dE7eD701696fc096aBF#code) |
| **DEX Instance 2** | `0x190a17c71174D6684d61Aa3c8cc63855a6Cdec2B` | [View on Etherscan](https://sepolia.etherscan.io/address/0x190a17c71174D6684d61Aa3c8cc63855a6Cdec2B#code) |
| **LP Token** | `0x8699290d293b48edF0D930afBFbe158678A724cC` | [View on Etherscan](https://sepolia.etherscan.io/address/0x8699290d293b48edF0D930afBFbe158678A724cC#code) |
| **Arbitrage** | `0x4B5fE7720D072C26f89f68C84C539E5f778f41BB` | [View on Etherscan](https://sepolia.etherscan.io/address/0x4B5fE7720D072C26f89f68C84C539E5f778f41BB#code) |

---

## 🔗 Required Transaction Hashes
Below are the transaction hashes demonstrating the core functionalities of the DEX, as required by the assignment rubric.

* **Liquidity Addition & LP Minting:** [View Tx](https://sepolia.etherscan.io/tx/0x1f9496a43dabdbe042ebf3362434d7b3081d5fbcb7c1e93c4ed1d329d7d7b729)
* **Liquidity Removal & LP Burning:** [View Tx](https://sepolia.etherscan.io/tx/0x25e4d183876387977d860491750137ce9f46bb774e70e1872430c1e89fe3fcae)
* **Swap Token A to Token B:** [View Tx](https://sepolia.etherscan.io/tx/0x863911f9b5909f151ae52445be69e0fbece4d0a2e0abb6bd2fa943e7396fba1e)
* **Swap Token B to Token A:** [View Tx](https://sepolia.etherscan.io/tx/0xce1b283d55e59dcbf5ab14e5cedac41d4792173b563533a3e8fa3278ede5ae70)
* **Profitable Arbitrage Execution:** [View Tx](https://sepolia.etherscan.io/tx/)
* **Failed Arbitrage Execution (Insufficient Profit):** [View Tx ](https://sepolia.etherscan.io/tx/0x3a7d89ea0fd7c7dae5858144fb331d55d7a9629c1b6558f246e041c9fb9025cd)

---

## 🛠️ User Instructions

### 1. Accessing the UI
Simply navigate to the deployed Vercel link at the top of this document.

### 2. Connecting & Setup
1. Ensure you have the [MetaMask](https://metamask.io/) extension installed.
2. Switch your MetaMask network to **Sepolia**.
3. Obtain Sepolia ETH for gas from a public faucet (e.g., [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)).
4. Click **Connect MetaMask** in the UI.

### 3. Obtaining Test Tokens (A & B)
Because the token contracts use OpenZeppelin's standard ERC20 implementation, the initial supply was minted to the deployer. To get tokens to test with:
1. Go to the **Token A** or **Token B** Etherscan links above.
2. Click **Contract** -> **Write Contract**.
3. Connect your Web3 wallet and use the `transfer` function to send tokens to your testing address.

### 4. Interacting with the DEX
* **Adding Liquidity:** Enter amounts for Token A and Token B that match the current pool ratio. The UI will prompt two approval transactions, followed by the supply transaction. You will receive LP tokens representing your share.
* **Swapping:** Enter an amount to swap and select the direction (A → B or B → A). The UI dynamically calculates the expected output minus the 0.3% fee.
* **Arbitrage:** Input a starting capital amount of Token A and click Execute. The contract will attempt to buy low on DEX 1 and sell high on DEX 2. If it is not profitable, the transaction will revert to protect your funds.
