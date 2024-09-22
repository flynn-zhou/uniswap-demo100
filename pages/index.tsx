import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

import { UniswapV3DemoContext } from "../context/UniswapV3DemoContext";

const index = () => {
  const { currentAccount, checkIfWalletConnected, connectWallet, createPool } =
    useContext(UniswapV3DemoContext);

  const [poolAddress, setPoolAddress] = useState("Pool Not Create");
  const [chainId, setChainId] = useState(0);

  const initialPool = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const chain_id = (await provider.getNetwork()).chainId;
    console.log("chain ID: ", chain_id);
    setChainId(chain_id);
    const poolAdd = await createPool(provider);
    setPoolAddress(poolAdd);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <br />
      -----------------------分割----------------------
      <br />
      <button onClick={() => connectWallet()}>Connect Wallet</button>
      <br />
      -----------------------分割----------------------
      <br />
      <h2>Chain ID： {chainId}</h2>
      <br />
      <h2>Wallet account： {currentAccount}</h2>
      <br />
      -----------------------分割----------------------
      <br />
      <button onClick={() => initialPool()}>Create Pool</button>
      <br />
      -----------------------分割----------------------
      <br />
      <h2>New pool address： {poolAddress}</h2>
      <br />
      <button onClick={() => checkIfWalletConnected()}>
        Add [local_fork_sepolia] to MetaMask
      </button>
    </div>
  );
};

export default index;
