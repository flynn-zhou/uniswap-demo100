import React, { useState } from "react";
import { ethers, BigNumber } from "ethers";

//internal import

import {
  SwapQuoter,
  QuoteOptions,
  SwapRouter,
  SwapOptions,
  Trade,
  tradeComparator,
  BestTradeOptions,
  NonfungiblePositionManager,
  FeeAmount,
  TICK_SPACINGS,
  Pool,
  encodeSqrtRatioX96,
  Position,
  computePoolAddress,
  TickMath,
  nearestUsableTick,
} from "@uniswap/v3-sdk";

import {
  Percent,
  Token,
  NativeCurrency,
  CurrencyAmount,
  WETH9,
  Ether,
} from "@uniswap/sdk-core";

import {
  TOKEN_0_ADDRESS,
  TOKEN_1_ADDRESS,
  OUR_ERC20_ABI,
  //
  ERC20_ABI,
  ABI,
  WORLDCOIN_ABI,
  NPM_ABI,
  FACTORY_ABI,
  POOL_ABI,
  //
  ADDRESS_FACTORY, //UniswapV3Factory
  ADDRESS_NPM, //NonfungiblePositionManager.sol
  ADDRESS_QuoterV2,
  ADDRESS_SwapRouter02,
  //
  ADDRESS_CHINA_CCN,
  ADDRESS_JAPAN_JCN,
  ADDRESS_MONGO_MCN,
  ADDRESS_WORLD_WCN,
  //
  DEPOSIT_AMOUNT,
} from "./constants";

export const UniswapV3DemoContext = React.createContext();

export const UniswapV3DemoContextProvider = ({ children }) => {
  //variable
  const [currentAccount, setCurrentAccount] = useState("");
  //check connect wallet
  const checkIfWalletConnected = async () => {
    if (!window.ethereum) {
      console.log("Please Install Metamask");
    }

    await handleNetworkSwitch();

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    if (accounts?.length > 0) {
      setCurrentAccount(accounts[0]);
      return accounts[0];
    } else {
      console.log("No accounts found");
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      console.log("Please Install Metamask");
    }

    await handleNetworkSwitch();

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setCurrentAccount(accounts[0]);
  };

  const getContract = async (address, abi, providerOrSigner) => {
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    // const signer = await provider.getSigner();
    let contract = new ethers.Contract(address, abi, providerOrSigner);
    // contract.connect(currentAccount);
    // console.log("contract: ", contract);
    return contract;
  };

  const getOurTokenContactInfo = async (provider, contractAddress) => {
    const theSigner = await provider.getSigner();
    const contract = await getContract(
      contractAddress,
      OUR_ERC20_ABI,
      theSigner
    ); // token0 contract
    const [name, symbol, decimals, balance, allowance_to_npm] =
      await Promise.all([
        await contract.name(),
        await contract.symbol(),
        await contract.decimals(),
        ethers.utils.formatUnits(
          BigNumber.from(await contract.balanceOf(currentAccount)).toString()
        ),

        ethers.utils.formatUnits(
          BigNumber.from(
            await contract.allowance(currentAccount, ADDRESS_NPM)
          ).toString()
        ),
      ]);
    console.log(
      "contract origin data: ",
      name,
      symbol,
      decimals,
      balance,
      allowance_to_npm
    );
    return {
      contract,
      name,
      symbol,
      decimals,
      balance,
      allowance_to_npm,
    };
  };

  const getCurrentPoolState = async (poolContract) => {
    const token0 = await poolContract.token0();
    const token1 = await poolContract.token1();
    console.log("22222222222222222", token0, token0);
    const liquidity = await poolContract.liquidity();
    const slot = await poolContract.slot0();

    const PoolState = {
      token0,
      token1,
      liquidity,
      sqrtPriceX96: slot[0],
      tick: slot[1],
      observationIndex: slot[2],
      observationCardinality: slot[3],
      observationCardinalityNext: slot[4],
      feeProtocol: slot[5],
      unlocked: slot[6],
    };

    return PoolState;
  };

  //创建池
  const createPool = async (provider) => {
    if (TOKEN_0_ADDRESS > TOKEN_1_ADDRESS) {
      alert("token0 address must be < token1");
      return;
    }

    const theSigner = await provider.getSigner();
    const chainID = (await provider.getNetwork()).chainId;
    console.log("chainID, theSigner : ", chainID, theSigner);

    //starting var
    const fee = FeeAmount.HIGH;
    const slippageTolerance = new Percent(20, 100);
    const deadline = Math.floor(new Date().getTime() + 1800);
    const recipient = currentAccount;
    const sqrtRatioX96 = encodeSqrtRatioX96(1, 1); //token1 token0
    const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtRatioX96);
    //
    // const upper_sqrtRatioX96 = encodeSqrtRatioX96(1, 1500);
    // const lower_sqrtRatioX96 = encodeSqrtRatioX96(1, 2500);

    // const tick_upper = TickMath.getTickAtSqrtRatio(upper_sqrtRatioX96);
    // const tick_lower = TickMath.getTickAtSqrtRatio(lower_sqrtRatioX96);

    //检查余额ADDRESS,MY_ERC20_ADDRESS

    const token0Data = await getOurTokenContactInfo(provider, TOKEN_0_ADDRESS);
    console.log("------token0Data: ", token0Data);

    const token1Data = await getOurTokenContactInfo(provider, TOKEN_1_ADDRESS);
    console.log("~~~~~~token1Data: ", token1Data);

    //   The maximum token amounts we want to provide. BigIntish accepts number, string or JSBI
    const amount0 = ethers.utils.parseUnits("20000", 18);
    const amount1 = ethers.utils.parseUnits("20000", 18);

    //Give approval to the contract(NonfungiblePositionManager.sol) to transfer tokens

    //准备普通代币token0余额1
    console.log("token0 balance before: ", currentAccount, token0Data.balance);
    if (Number(token0Data.balance) < 1) {
      console.log("contract.mint...");
      const trxRes = await token0Data.contract.mint(
        currentAccount,
        ethers.utils.parseUnits("200000")
      );

      await trxRes.wait();
      //重新检查余额
      const newBalance = ethers.utils.formatUnits(
        BigNumber.from(
          await token0Data.contract.balanceOf(currentAccount)
        ).toString()
      );
      console.log("token0 balance after: ", currentAccount, newBalance);
    }

    //准备普通代币token1余额1
    console.log("token1 balance before: ", currentAccount, token1Data.balance);
    if (Number(token1Data.balance) < 1) {
      console.log("contract.mint...");
      const trxRes = await token1Data.contract.mint(
        currentAccount,
        ethers.utils.parseUnits("200000")
      );

      await trxRes.wait();
      //重新检查余额
      const newBalance = ethers.utils.formatUnits(
        BigNumber.from(
          await token1Data.contract.balanceOf(currentAccount)
        ).toString()
      );
      console.log("token1 balance after: ", currentAccount, newBalance);
    }

    // token 0 approve
    console.log(
      "token 0 allowance(npm) before: ",
      currentAccount,
      token0Data.allowance_to_npm
    );
    if (Number(token0Data.allowance_to_npm) < 1) {
      await token0Data.contract.approve(ADDRESS_NPM, amount1);

      const allowanceValue = await token0Data.contract.allowance(
        currentAccount,
        ADDRESS_NPM
      );

      console.log(
        "token 0 allowance(npm) after: ",
        currentAccount,
        allowanceValue
      );
    }

    // token 1 approve
    console.log(
      "token 1 allowance(npm) before: ",
      currentAccount,
      token1Data.allowance_to_npm
    );

    if (Number(token1Data.allowance_to_npm) < 1) {
      await token1Data.contract.approve(ADDRESS_NPM, amount0);
      const allowanceValue = await token1Data.contract.allowance(
        currentAccount,
        ADDRESS_NPM
      );

      console.log(
        "token 1 allowance(npm) after: ",
        currentAccount,
        allowanceValue
      );
    }

    //check factory pool exists or not
    const factory_contract = new ethers.Contract(
      ADDRESS_FACTORY,
      FACTORY_ABI,
      theSigner
    );
    const estimateGasValue = await factory_contract.estimateGas.getPool(
      TOKEN_0_ADDRESS,
      TOKEN_1_ADDRESS,
      fee
    );
    console.log("estimateGasValue: ", estimateGasValue.toString());

    let poolAddress = await factory_contract.getPool(
      TOKEN_0_ADDRESS,
      TOKEN_1_ADDRESS,
      fee,
      {
        gasLimit: estimateGasValue,
      }
    );

    console.log("poolAddress: ", poolAddress);
    if (poolAddress == "0x0000000000000000000000000000000000000000") {
      console.log("Starting create pool");
      // create pool
      const txsRes = await factory_contract.createPool(
        TOKEN_0_ADDRESS.toLowerCase(),
        TOKEN_1_ADDRESS.toLowerCase(),
        fee,
        {
          gasLimit: 10000000,
        }
      );
      await txsRes.wait();
      console.log("Create pool finished");

      poolAddress = await factory_contract.getPool(
        TOKEN_0_ADDRESS,
        TOKEN_1_ADDRESS,
        fee,
        {
          gasLimit: estimateGasValue,
        }
      );

      console.log("New Pool address", poolAddress);

      // initial pool price
      console.log(
        "Starting initial the pool",
        sqrtRatioX96,
        sqrtRatioX96.toString()
      );

      const pool_contract = new ethers.Contract(
        poolAddress,
        POOL_ABI,
        theSigner
      );
      const tx_initial = await pool_contract.initialize(
        sqrtRatioX96.toString(),
        {
          gasLimit: 3000000,
        }
      );
      await tx_initial.wait();
      console.log("Pool price initialized");
    } else {
      console.log("pool already exists, poolAddress= ", poolAddress);
    }

    // return poolAddress;
    console.log("-----------------------------------------------------");
    const pool_contract = new ethers.Contract(poolAddress, POOL_ABI, theSigner);
    console.log("pool_contract 1: ", pool_contract);
    const poolState = await getCurrentPoolState(pool_contract);

    console.log("before pool state: ", poolState);

    const Token0 = new Token(
      chainID,
      TOKEN_0_ADDRESS,
      token0Data.decimals,
      token0Data.name,
      token0Data.symbol
    );

    const Token1 = new Token(
      chainID,
      TOKEN_1_ADDRESS,
      token1Data.decimals,
      token1Data.name,
      token1Data.symbol
    );

    const configuredPool = new Pool(
      Token0,
      Token1,
      fee,
      poolState.sqrtPriceX96.toString(),
      poolState.liquidity.toString(),
      poolState.tick
    );

    console.log("configuredPool: ", configuredPool);

    const position1 = Position.fromAmounts({
      pool: configuredPool,
      tickLower:
        nearestUsableTick(
          configuredPool.tickCurrent,
          configuredPool.tickSpacing
        ) -
        configuredPool.tickSpacing * 2,
      tickUpper:
        nearestUsableTick(
          configuredPool.tickCurrent,
          configuredPool.tickSpacing
        ) +
        configuredPool.tickSpacing * 2,
      amount0: amount0.toString(),
      amount1: amount1.toString(),
      useFullPrecision: false,
    });
    console.log("position1: ", position1);
    console.log("position1 liquidity: ", position1.liquidity);

    const mintOptions = {
      recipient: currentAccount,
      deadline: deadline,
      slippageTolerance: slippageTolerance,
    };

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position1,
      mintOptions
    );

    console.log(
      "NonfungiblePositionManager.addCallParameters: ",
      value,
      calldata
    );

    const transaction = {
      data: calldata,
      to: ADDRESS_NPM,
      value: value,
      from: currentAccount,
      gasLimit: 5000000,
    };
    console.log("send the transacting: ", transaction);
    const txRes = await theSigner.sendTransaction(transaction);
    await txRes.wait();
    console.log("Pool liquidity Added.");

    const poolState_final = await getCurrentPoolState(pool_contract);

    console.log("after pool state: ", poolState_final);

    return poolAddress;
  };

  const handleNetworkSwitch = async () => {
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
    <UniswapV3DemoContext.Provider
      value={{
        currentAccount,
        // provider,
        // deployer,
        checkIfWalletConnected,
        connectWallet,
        createPool,
      }}
    >
      {children}
    </UniswapV3DemoContext.Provider>
  );
};
