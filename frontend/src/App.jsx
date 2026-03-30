import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import { DEX_ADDRESS, DEX2_ADDRESS, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, ARBITRAGE_ADDRESS } from "./config";
import DEX_ABI from "./abis/DEX.json";
import TOKEN_ABI from "./abis/Token.json"; 
import LP_TOKEN_ABI from "./abis/LPToken.json";
import ARBITRAGE_ABI from "./abis/Arbitrage.json";

function App() {
  // State: Wallet & Network
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");

  // State: DEX Metrics
  const [reserveA, setReserveA] = useState("0");
  const [reserveB, setReserveB] = useState("0");
  const [spotPrice, setSpotPrice] = useState("0");

  // State: User Balances
  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");
  const [balanceLP, setBalanceLP] = useState("0");

  // State: Form Inputs
  const [swapAmount, setSwapAmount] = useState("");
  const [addLiqA, setAddLiqA] = useState("");
  const [addLiqB, setAddLiqB] = useState("");
  const [removeLpAmount, setRemoveLpAmount] = useState("");
  const [arbAmount, setArbAmount] = useState("");

  // ==========================================
  // NEW STATE: TRANSACTION HASHES
  // ==========================================
  const [txAddLiq, setTxAddLiq] = useState("");
  const [txRemoveLiq, setTxRemoveLiq] = useState("");
  const [txSwapAtoB, setTxSwapAtoB] = useState("");
  const [txSwapBtoA, setTxSwapBtoA] = useState("");
  const [txArbSuccess, setTxArbSuccess] = useState("");
  const [txArbFailed, setTxArbFailed] = useState("");

  // ==========================================
  // INITIALIZATION & CONNECTION
  // ==========================================
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        await _provider.send("eth_requestAccounts", []);
        const _signer = await _provider.getSigner();
        const _account = await _signer.getAddress();
        
        setProvider(_provider);
        setSigner(_signer);
        setAccount(_account);
        
        fetchData(_provider, _signer, _account);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchData = async (_provider, _signer, _account) => {
    try {
      const rawEthBalance = await _provider.getBalance(_account);
      setEthBalance(parseFloat(ethers.formatEther(rawEthBalance)).toFixed(4));

      const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI.abi, _signer);
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_ABI.abi, _signer);
      const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, TOKEN_ABI.abi, _signer);
      
      const lpTokenAddress = await dexContract.lpToken();
      const lpContract = new ethers.Contract(lpTokenAddress, LP_TOKEN_ABI.abi, _signer);

      const resA = await dexContract.reserveA();
      const resB = await dexContract.reserveB();
      
      if (resA > 0) {
        const price = await dexContract.spotPrice();
        setSpotPrice(parseFloat(ethers.formatEther(price)).toFixed(4));
      } else {
        setSpotPrice("0.0000");
      }
      
      setReserveA(parseFloat(ethers.formatEther(resA)).toFixed(2));
      setReserveB(parseFloat(ethers.formatEther(resB)).toFixed(2));

      const balA = await tokenAContract.balanceOf(_account);
      const balB = await tokenBContract.balanceOf(_account);
      const balLP = await lpContract.balanceOf(_account);

      setBalanceA(parseFloat(ethers.formatEther(balA)).toFixed(2));
      setBalanceB(parseFloat(ethers.formatEther(balB)).toFixed(2));
      setBalanceLP(parseFloat(ethers.formatEther(balLP)).toFixed(2));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const checkGas = () => {
    if (parseFloat(ethBalance) === 0) {
      alert("Insufficient Sepolia ETH for gas!");
      return false;
    }
    return true;
  };

  // ==========================================
  // DEX OPERATIONS (WITH HASH CAPTURE)
  // ==========================================
  const handleSwap = async (isAtoB) => {
    if (!swapAmount || !checkGas()) return;
    try {
      const tokenAddress = isAtoB ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI.abi, signer);
      const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI.abi, signer);

      const amountWei = ethers.parseEther(swapAmount);
      
      await (await tokenContract.approve(DEX_ADDRESS, amountWei)).wait();

      const txSwap = await dexContract.swap(tokenAddress, amountWei);
      
      // Capture the specific swap hash
      if (isAtoB) setTxSwapAtoB(txSwap.hash);
      else setTxSwapBtoA(txSwap.hash);
      
      await txSwap.wait();
      alert("Swap Successful!");
      fetchData(provider, signer, account); 
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  const handleAddLiquidity = async () => {
    if (!addLiqA || !addLiqB || !checkGas()) return;
    try {
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_ABI.abi, signer);
      const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, TOKEN_ABI.abi, signer);
      const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI.abi, signer);

      const amtAWei = ethers.parseEther(addLiqA);
      const amtBWei = ethers.parseEther(addLiqB);

      await (await tokenAContract.approve(DEX_ADDRESS, amtAWei)).wait();
      await (await tokenBContract.approve(DEX_ADDRESS, amtBWei)).wait();

      const tx = await dexContract.addLiquidity(amtAWei, amtBWei);
      setTxAddLiq(tx.hash); // Capture hash

      await tx.wait();
      alert("Liquidity Added Successfully!");
      fetchData(provider, signer, account);
    } catch (error) {
      console.error("Add Liquidity failed:", error);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeLpAmount || !checkGas()) return;
    try {
      const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI.abi, signer);
      const lpTokenAddress = await dexContract.lpToken();
      const lpContract = new ethers.Contract(lpTokenAddress, LP_TOKEN_ABI.abi, signer);

      const amountWei = ethers.parseEther(removeLpAmount);

      await (await lpContract.approve(DEX_ADDRESS, amountWei)).wait();

      const tx = await dexContract.removeLiquidity(amountWei);
      setTxRemoveLiq(tx.hash); // Capture hash

      await tx.wait();
      alert("Liquidity Removed Successfully!");
      fetchData(provider, signer, account);
    } catch (error) {
      console.error("Remove Liquidity failed:", error);
    }
  };

  const handleArbitrage = async () => {
    if (!arbAmount || !checkGas()) return;
    try {
      const arbContract = new ethers.Contract(ARBITRAGE_ADDRESS, ARBITRAGE_ABI.abi, signer);
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_ABI.abi, signer);
      const amountWei = ethers.parseEther(arbAmount);

      await (await tokenAContract.approve(ARBITRAGE_ADDRESS, amountWei)).wait();

      const tx = await arbContract.executeArbitrage(DEX_ADDRESS, DEX2_ADDRESS, TOKEN_A_ADDRESS, amountWei);
      setTxArbSuccess(tx.hash); // Capture successful hash

      await tx.wait();
      alert("Arbitrage Executed Successfully!");
      fetchData(provider, signer, account);
    } catch (error) {
      console.error("Arbitrage failed:", error);
      alert("Arbitrage Reverted: Not enough profit to cover the DEX fees.");
    }
  };

  // Bypass MetaMask gas estimation to force a failed transaction on-chain
  const forceFailedArbitrage = async () => {
    if (!arbAmount || !checkGas()) return;
    try {
      const arbContract = new ethers.Contract(ARBITRAGE_ADDRESS, ARBITRAGE_ABI.abi, signer);
      const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_ABI.abi, signer);
      const amountWei = ethers.parseEther(arbAmount);

      await (await tokenAContract.approve(ARBITRAGE_ADDRESS, amountWei)).wait();

      // Forcing the transaction with a manual gas limit
      const tx = await arbContract.executeArbitrage(DEX_ADDRESS, DEX2_ADDRESS, TOKEN_A_ADDRESS, amountWei, { gasLimit: 500000 });
      setTxArbFailed(tx.hash); // Capture failed hash

      await tx.wait(); 
    } catch (error) {
      console.log("Expected failure captured:", error);
      alert("Arbitrage intentionally failed on-chain to generate hash!");
    }
  };

  // Helper to render Etherscan links
  const renderTxLink = (hash) => {
    if (!hash) return <span>Pending execution...</span>;
    return <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff" }}>{hash.substring(0, 15)}...</a>;
  };

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>DeFi AMM DEX</h1>
      
      {!account ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <button onClick={connectWallet} style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#f6851b", color: "white", border: "none", borderRadius: "5px" }}>
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div>
          {/* WALLET INFO */}
          <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <p><strong>Connected Account:</strong> {account}</p>
            <p style={{ color: "#28a745", fontSize: "18px" }}><strong>Available Gas (ETH):</strong> {ethBalance} ETH</p>
            <button onClick={() => fetchData(provider, signer, account)} style={{ padding: "5px 10px", cursor: "pointer" }}>🔄 Refresh Balances</button>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            {/* DEX METRICS */}
            <div style={{ flex: 1, border: "1px solid #ddd", padding: "15px", borderRadius: "8px" }}>
              <h3>📈 DEX Pool Reserves</h3>
              <p><strong>Token A:</strong> {reserveA} TKNA</p>
              <p><strong>Token B:</strong> {reserveB} TKNB</p>
              <p><strong>Spot Price:</strong> {spotPrice} (A in terms of B)</p>
            </div>

            {/* USER BALANCES */}
            <div style={{ flex: 1, border: "1px solid #ddd", padding: "15px", borderRadius: "8px" }}>
              <h3>👛 Your Wallet Balances</h3>
              <p><strong>Token A:</strong> {balanceA}</p>
              <p><strong>Token B:</strong> {balanceB}</p>
              <p><strong>LP Tokens:</strong> {balanceLP}</p>
            </div>
          </div>

          <hr style={{ margin: "30px 0" }} />

          {/* ACTIONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* 1. LIQUIDITY */}
            <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px" }}>
              <h2>💧 1. Manage Liquidity</h2>
              <div style={{ marginBottom: "15px" }}>
                <input type="number" placeholder="Token A Amount" value={addLiqA} onChange={(e) => setAddLiqA(e.target.value)} style={{ marginRight: "10px", padding: "5px" }} />
                <input type="number" placeholder="Token B Amount" value={addLiqB} onChange={(e) => setAddLiqB(e.target.value)} style={{ marginRight: "10px", padding: "5px" }} />
                <button onClick={handleAddLiquidity} style={{ padding: "5px 15px", cursor: "pointer" }}>Add Liquidity</button>
              </div>
              <div>
                <input type="number" placeholder="LP Tokens to Burn" value={removeLpAmount} onChange={(e) => setRemoveLpAmount(e.target.value)} style={{ marginRight: "10px", padding: "5px" }} />
                <button onClick={handleRemoveLiquidity} style={{ padding: "5px 15px", cursor: "pointer" }}>Remove Liquidity</button>
              </div>
            </div>

            {/* 2. SWAP */}
            <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px" }}>
              <h2>🔄 2. Token Swap</h2>
              <input type="number" placeholder="Amount to Swap" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} style={{ marginRight: "10px", padding: "5px" }} />
              <button onClick={() => handleSwap(true)} style={{ padding: "5px 15px", cursor: "pointer", marginRight: "10px" }}>Swap A → B</button>
              <button onClick={() => handleSwap(false)} style={{ padding: "5px 15px", cursor: "pointer" }}>Swap B → A</button>
            </div>

            {/* 3. ARBITRAGE */}
            <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", backgroundColor: "#fff8e1" }}>
              <h2>⚡ 3. Arbitrage Execution</h2>
              <input type="number" placeholder="Initial Capital (Token A)" value={arbAmount} onChange={(e) => setArbAmount(e.target.value)} style={{ marginRight: "10px", padding: "5px" }} />
              <button onClick={handleArbitrage} style={{ padding: "5px 15px", cursor: "pointer", backgroundColor: "#ffb300", border: "none", borderRadius: "3px", marginRight: "10px" }}>Execute Arbitrage</button>
              <button onClick={forceFailedArbitrage} style={{ padding: "5px 15px", cursor: "pointer", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "3px" }}>Force Failed Arbitrage</button>
            </div>

            {/* 4. ASSIGNMENT TRANSACTION LOGS */}
            <div style={{ border: "2px solid #28a745", padding: "15px", borderRadius: "8px", backgroundColor: "#e9f7ef" }}>
              <h2>📋 Assignment Submission Hashes</h2>
              <ul style={{ listStyleType: "none", padding: 0, lineHeight: "1.8" }}>
                <li><strong>Add Liquidity:</strong> {renderTxLink(txAddLiq)}</li>
                <li><strong>Remove Liquidity:</strong> {renderTxLink(txRemoveLiq)}</li>
                <li><strong>Swap TokenA → TokenB:</strong> {renderTxLink(txSwapAtoB)}</li>
                <li><strong>Swap TokenB → TokenA:</strong> {renderTxLink(txSwapBtoA)}</li>
                <li><strong>Profitable Arbitrage:</strong> {renderTxLink(txArbSuccess)}</li>
                <li><strong>Failed Arbitrage:</strong> {renderTxLink(txArbFailed)}</li>
              </ul>
              <p style={{ fontSize: "12px", color: "#555" }}>* Click the links to view the transactions on Sepolia Etherscan.</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;