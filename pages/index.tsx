import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

import { UniswapV3DemoContext } from "../context/UniswapV3DemoContext";
import { CREATE_POOL_INFO } from "../context/constants";

const index = () => {
  const { currentAccount, checkIfWalletConnected, connectWallet, createPool } =
    useContext(UniswapV3DemoContext);

  const [poolAddress, setPoolAddress] = useState(
    "Pool Not Create, click to create..."
  );
  const [chainId, setChainId] = useState(0);

  const initialPool = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const chain_id = (await provider.getNetwork()).chainId;
    console.log("chain ID: ", chain_id);
    setChainId(chain_id);
    const poolAdd = await createPool(provider);
    setPoolAddress(poolAdd);
  };

  const currentCreatedPools = CREATE_POOL_INFO.POOL_ADDRESS;

  // useEffect(() => {
  //   connectWallet();
  // }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <br />
      <button onClick={() => connectWallet()}>Step 1: Connect Wallet</button>
      <br />
      -----------------------分割----------------------
      <br />
      <h2>Chain ID： {chainId}</h2>
      <br />
      <h2>Wallet account： {currentAccount}</h2>
      <br />
      -----------------------分割----------------------
      <br />
      <h3>
        New pool address： <span>{poolAddress}</span>
      </h3>
      <button onClick={() => initialPool()}>
        &nbsp; &nbsp;Step 2: Create Pool&nbsp; &nbsp;{" "}
      </button>
      <br />
      <br />
      <ul>
        <br />
        <button>
          Step 3: Paste [New pool address] to constants.js.POOL_ADDRESS
        </button>

        <br />
        <br />
        <li>
          <h2> Created Pool list</h2>
        </li>
        <br />
        {currentCreatedPools.map((pool, index) => (
          <li key={index + 1}>
            <span>{pool}</span>
          </li>
        ))}
      </ul>
      <br />
      <br />
      <br />
      <h3>添加本地网络</h3>
      <br />
      <button onClick={() => checkIfWalletConnected()}>
        Add [local_fork_sepolia] to MetaMask
      </button>
      <br />
      <br />
      <br />
    </div>
  );
};

export default index;
