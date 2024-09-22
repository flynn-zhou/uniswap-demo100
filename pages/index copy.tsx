import React, { useState, useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import Web3Modal from "web3modal";

import {
  readContract,
  createPool,
  onEvent,
  getWethBalanceOnLocalForkChain,
} from "../context";

import {
  WETH_ABI,
  ERC20_ABI,
  QUOTERV2_ABI,
  V3SWAPROUTER_ABI,
  V3FACTORY_ABI,
  V3POOL_ABI,
} from "../constants";

const NOUFUNGIBLE_POSITION_MANAGER_ADDRESS =
  process.env.NEXT_PUBLIC_NonfungiblePositionManager;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_UniswapV3Factory;
const WETH_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_WETH;
const WCN_ADDRESS = process.env.NEXT_PUBLIC_NATIVE_WCN;

const MAX_FEE_PER_GAS = 100000000000;
const MAX_PRIORITY_FEE_PER_GAS = 100000000000;

const DEPOSIT_WETH_AMOUNT = ethers.utils.parseEther("20");

const index = () => {
  // //
  // const doExe = async () => {
  //   const contractData = await readContract();
  //   console.log("````````readContract: ", contractData);

  //   await createPool();
  //   console.log("````````createPool~~~~~~~");
  // };

  // useEffect(() => {
  //   doExe();
  // }, []);

  // const doEvent = async () => {
  //   await onEvent();
  // };

  // useEffect(() => {
  //   doEvent();
  // }, []);

  ////////////////////////////////////////////////////////////
  const [activeAccount, setActiveAccount] = useState("");

  //@ts-ignore
  const getContract = async (address, abi, provider, activeAccount) => {
    let contract = new ethers.Contract(address, abi, provider);
    contract.connect(activeAccount);
    return contract;
  };

  const createPool_ = async () => {
    // const web3modal = new Web3Modal();
    // const connection = await web3modal.connect();
    // const provider = new ethers.providers.Web3Provider(connection);
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    console.log(
      "provider.network.chainId=",
      (await provider.getNetwork()).chainId
    );
    const signer = await provider.getSigner();
    console.log(
      "signergetBalance",
      ethers.utils.formatUnits(await signer.getBalance(), 18)
    );

    const npmAddress = NOUFUNGIBLE_POSITION_MANAGER_ADDRESS;

    const uniswapFactoryContract = await getContract(
      FACTORY_ADDRESS,
      V3FACTORY_ABI,
      provider,
      activeAccount
    );
    const WCN_token0_contract = await getContract(
      WCN_ADDRESS,
      ERC20_ABI,
      provider,
      activeAccount
    );
    const WETH_token1_contract = await getContract(
      WETH_ADDRESS,
      WETH_ABI,
      provider,
      activeAccount
    );
    console.log("uniswapFactoryContract: ", uniswapFactoryContract);
    console.log("WCN_token0_contract: ", WCN_token0_contract);
    console.log("WETH_token1_contract: ", WETH_token1_contract);

    const wcn_allowance = await WCN_token0_contract.allowance(
      activeAccount,
      npmAddress
    );
    const weth_allowance = await WETH_token1_contract.allowance(
      activeAccount,
      npmAddress
    );

    console.log("wcn_allowance: ", wcn_allowance);
    console.log("weth_allowance: ", weth_allowance);

    if (Number(wcn_allowance) < 1) {
      console.log("Begain to wcn approve to npm... ");
      // await WCN_token0_contract.approve (activeAccount,
      //   npmAddress, ethers.utils.parseUnits("3000", 18))
    }

    const contract = new ethers.Contract(
      "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
      WETH_ABI,
      signer
    );
    console.log("contract: ", contract);
    const wethBalance = ethers.utils.formatUnits(
      BigNumber.from(await contract.balanceOf(activeAccount)).toString()
    );
    console.log("wethBal before: ", activeAccount, wethBalance);
    if (Number(wethBalance) < 1) {
      console.log("Your WETH balance < 1");
      console.log("DEPOSIT_WETH_AMOUNT: ", DEPOSIT_WETH_AMOUNT);
      await contract.deposit({
        value: DEPOSIT_WETH_AMOUNT,
      });

      //重新检查余额
      const newWethBalance = ethers.utils.formatUnits(
        BigNumber.from(await contract.balanceOf(activeAccount)).toString()
      );
      console.log("wethBal after: ", activeAccount, newWethBalance);
    }

    const { calldata, value } = await createPool(activeAccount);

    console.log("````````````````calldata````````````````````", calldata);

    return;

    // const transaction = {
    //   data: calldata,
    //   to: NOUFUNGIBLE_POSITION_MANAGER_ADDRESS,
    // };0x1238536071E1c677A632429e3655c799b22cDA52

    // const tx = await provider.call(transaction);
    const transaction = {
      data: calldata,
      to: NOUFUNGIBLE_POSITION_MANAGER_ADDRESS,
      value: value,
      // // value: ethers.utils.parseEther("1"),
      // from: activeAccount,
      // maxFeePerGas: MAX_FEE_PER_GAS,
      // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      gasLimit: 5000000,
    };

    const signedTx = await signer.sendTransaction(transaction);

    console.log("```````````````tx`````````````````````", signedTx);
  };

  const connectWallet = async () => {
    try {
      // @ts-ignore
      if (!window.ethereum) return console.log("Install MetaMask");
      // @ts-ignore
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const firstAccount = accounts[0];
      setActiveAccount(firstAccount);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  const addToMetaMask = async () => {
    try {
      // @ts-ignore
      if (!window.ethereum) return console.log("Install MetaMask");
      // @ts-ignore
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${Number(31337).toString(16)}`,
            chainName: "local_fork_sepolia ",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["http://127.0.0.1:8545/"],
            //no explorer here
            blockExplorerUrls: ["https://sepolia.etherscan.io/"],
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <button onClick={() => connectWallet()}>Connect Wallet</button>
      <h2>{activeAccount}</h2>
      <button onClick={() => createPool_()}>Create Pool</button>
      <br />
      -----------------------分割----------------------
      <br />
      <button onClick={() => addToMetaMask()}>
        Add [local_fork_sepolia] to MetaMask
      </button>
    </div>
  );
};

export default index;
