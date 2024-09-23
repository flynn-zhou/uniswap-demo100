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
  FullMath,
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
  CREATE_POOL_INFO,
  OUR_ERC20_ABI,
  //
  ERC20_ABI,
  WETH_ABI,
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
  ADDRESS_SEPOLIA_WETH,
  //
  ADDRESS_CHINA_CCN,
  ADDRESS_JAPAN_JCN,
  ADDRESS_MONGO_MCN,
  ADDRESS_WORLD_WCN,
  //
  DEPOSIT_WETH_AMOUNT,
  ZERO_ADDRESS,
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

  const getContract = (address, abi, providerOrSigner) => {
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    // const signer = await provider.getSigner();
    let contract = new ethers.Contract(address, abi, providerOrSigner);
    // contract.connect(currentAccount);
    // console.log("contract: ", contract);
    return contract;
  };

  const getOurTokenContactInfo = async (provider, contractAddress) => {
    let weth_flag = false;
    let abi = OUR_ERC20_ABI;
    if (contractAddress == ADDRESS_SEPOLIA_WETH) {
      weth_flag = true;
      abi = WETH_ABI;
    }
    const theSigner = await provider.getSigner();
    const contract = await getContract(contractAddress, abi, theSigner); // token0 contract
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
      weth_flag,
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

  const prepareAccountBalance = async (tokenData, tokenNumberForLogFlag) => {
    console.log(
      "token",
      tokenNumberForLogFlag,
      " balance before: ",
      currentAccount,
      tokenData.balance
    );
    if (Number(tokenData.balance) < 1) {
      if (tokenData.weth_flag) {
        //weth 需要先deposit, 不要
        console.log("Your WETH balance < 1");
        console.log("WETH token", tokenNumberForLogFlag, "contract.deposit...");
        const depositTx = await tokenData.contract.deposit({
          value: DEPOSIT_WETH_AMOUNT,
        });
        await depositTx.wait();

        //重新检查余额
        const newBalance = ethers.utils.formatUnits(
          BigNumber.from(
            await tokenData.contract.balanceOf(currentAccount)
          ).toString()
        );
        console.log("wethBal after: ", newBalance);
      } else {
        console.log("token", tokenNumberForLogFlag, "contract.mint...");
        const mintTx = await tokenData.contract.mint(
          currentAccount,
          ethers.utils.parseUnits("200000")
        );

        await mintTx.wait();
        //重新检查余额
        const newBalance = ethers.utils.formatUnits(
          BigNumber.from(
            await tokenData.contract.balanceOf(currentAccount)
          ).toString()
        );
        console.log(
          "token",
          tokenNumberForLogFlag,
          " balance after: ",
          newBalance
        );
      }
    }
  };

  const prepareAccountApprove = async (
    tokenData,
    tokenNumberForLogFlag,
    approveAmount
  ) => {
    console.log(
      "token",
      tokenNumberForLogFlag,
      " allowance(npm) before: ",
      currentAccount,
      tokenData.allowance_to_npm
    );
    if (Number(tokenData.allowance_to_npm) < 1) {
      await tokenData.contract.approve(ADDRESS_NPM, approveAmount);

      const allowanceValue = await tokenData.contract.allowance(
        currentAccount,
        ADDRESS_NPM
      );

      console.log(
        "token",
        tokenNumberForLogFlag,
        " allowance(npm) after: ",
        currentAccount,
        allowanceValue
      );
    }
  };

  const checkFactoryExistsDestpool = async (signer) => {
    const factory_contract = getContract(ADDRESS_FACTORY, FACTORY_ABI, signer);
    const estimateGasValue = await factory_contract.estimateGas.getPool(
      CREATE_POOL_INFO.TOKEN_0_ADDRESS,
      CREATE_POOL_INFO.TOKEN_1_ADDRESS,
      CREATE_POOL_INFO.POOL_FEE
    );
    console.log("estimateGasValue: ", estimateGasValue.toString());

    let poolAddress = await factory_contract.getPool(
      CREATE_POOL_INFO.TOKEN_0_ADDRESS,
      CREATE_POOL_INFO.TOKEN_1_ADDRESS,
      CREATE_POOL_INFO.POOL_FEE,
      {
        gasLimit: estimateGasValue,
      }
    );

    return poolAddress;
  };

  const createPoolAndInitialPriceIfNeed = async (
    poolAddress,
    signer,
    sqrtRatioX96
  ) => {
    console.log("poolAddress: ", poolAddress);
    if (poolAddress == ZERO_ADDRESS) {
      console.log("Starting create pool");
      // create pool
      const factory_contract = getContract(
        ADDRESS_FACTORY,
        FACTORY_ABI,
        signer
      );
      const createPoolTx = await factory_contract.createPool(
        CREATE_POOL_INFO.TOKEN_0_ADDRESS.toLowerCase(),
        CREATE_POOL_INFO.TOKEN_1_ADDRESS.toLowerCase(),
        CREATE_POOL_INFO.POOL_FEE,
        {
          gasLimit: 10000000,
        }
      );
      await createPoolTx.wait();
      console.log("Create pool finished");

      const createdPoolAddress = await factory_contract.getPool(
        CREATE_POOL_INFO.TOKEN_0_ADDRESS,
        CREATE_POOL_INFO.TOKEN_1_ADDRESS,
        CREATE_POOL_INFO.POOL_FEE
      );

      console.log("New Pool address", createdPoolAddress);

      // initial pool price
      console.log(
        "Starting initial the pool",
        sqrtRatioX96,
        sqrtRatioX96.toString()
      );

      const pool_contract = getContract(createdPoolAddress, POOL_ABI, signer);
      const initialTx = await pool_contract.initialize(
        sqrtRatioX96.toString(),
        {
          gasLimit: 3000000,
        }
      );
      await initialTx.wait();
      console.log("Pool price initialized");
      return createdPoolAddress;
    } else {
      console.log("pool already exists, poolAddress= ", poolAddress);
      return poolAddress;
    }
  };

  const addLiquidityViaOptions = async (
    chainID,
    signer,
    token0Data,
    token1Data,
    poolState,
    intendToProvideAmount0,
    intendToProvideAmount1
  ) => {
    const Token0 = new Token(
      chainID,
      CREATE_POOL_INFO.TOKEN_0_ADDRESS,
      token0Data.decimals,
      token0Data.name,
      token0Data.symbol
    );

    const Token1 = new Token(
      chainID,
      CREATE_POOL_INFO.TOKEN_1_ADDRESS,
      token1Data.decimals,
      token1Data.name,
      token1Data.symbol
    );

    const configuredPool = new Pool(
      Token0,
      Token1,
      CREATE_POOL_INFO.POOL_FEE,
      poolState.sqrtPriceX96.toString(),
      poolState.liquidity.toString(),
      poolState.tick
    );

    console.log("configuredPool: ", configuredPool);

    const position = Position.fromAmounts({
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
      amount0: intendToProvideAmount0.toString(),
      amount1: intendToProvideAmount1.toString(),
      useFullPrecision: false,
    });
    console.log("position: ", position);

    const mintOptions = {
      recipient: currentAccount,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
    };

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position,
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
      gasLimit: 10000000,
    };
    console.log("send the transacting: ", transaction);
    const txRes = await signer.sendTransaction(transaction);
    await txRes.wait();
    console.log("Pool liquidity Added! response: ", txRes);
  };

  const getWei = (amountEth, decimals) => {
    return ethers.utils.parseUnits(amountEth.toString(), decimals);
  };

  //创建池
  const createPool = async (provider) => {
    console.log("CREATE_POOL_INFO: ", CREATE_POOL_INFO);
    const TOKEN_0_ADDRESS = CREATE_POOL_INFO.TOKEN_0_ADDRESS;
    const TOKEN_1_ADDRESS = CREATE_POOL_INFO.TOKEN_1_ADDRESS;
    if (TOKEN_0_ADDRESS > TOKEN_1_ADDRESS) {
      alert("token0 address must be < token1");
      return;
    }

    const theSigner = await provider.getSigner();
    const chainID = (await provider.getNetwork()).chainId;
    console.log("chainID, theSigner : ", chainID, theSigner);

    //starting var
    const sqrtRatioX96 = encodeSqrtRatioX96(1, 1); //token1 token0

    //检查余额ADDRESS,MY_ERC20_ADDRESS

    const token0Data = await getOurTokenContactInfo(provider, TOKEN_0_ADDRESS);
    console.log("------token0Data: ", token0Data);

    const token1Data = await getOurTokenContactInfo(provider, TOKEN_1_ADDRESS);
    console.log("~~~~~~token1Data: ", token1Data);

    //用户提供的注入池子的两种金额的最大值
    const intendToProvideAmount0 = getWei(
      CREATE_POOL_INFO.INTEND_TO_PROVIDE_AMOUNT_0,
      token0Data.decimals
    );
    const intendToProvideAmount1 = getWei(
      CREATE_POOL_INFO.INTEND_TO_PROVIDE_AMOUNT_1,
      token1Data.decimals
    );

    //准备普通代币token0余额1
    await prepareAccountBalance(token0Data, 0);

    //准备普通代币token1余额1
    await prepareAccountBalance(token1Data, 1);

    // token 0 approve to NonfungiblePositionManager
    await prepareAccountApprove(token0Data, 0, intendToProvideAmount0);

    // token 1 approve to NonfungiblePositionManager
    await prepareAccountApprove(token1Data, 1, intendToProvideAmount1);

    //check factory pool exists or not
    let checkedPoolAddress = await checkFactoryExistsDestpool(theSigner);

    //createPool + Initialize Price
    const poolAddress = await createPoolAndInitialPriceIfNeed(
      checkedPoolAddress,
      theSigner,
      sqrtRatioX96
    );

    // return poolAddress;
    console.log("-----------------------------------------------------");
    const pool_contract = getContract(poolAddress, POOL_ABI, theSigner);

    const poolState = await getCurrentPoolState(pool_contract);
    console.log(
      "before pool state: ",
      poolState,
      " | 价格：",
      computeReadableValueFrom(
        poolState.sqrtPriceX96,
        token0Data.decimals,
        token1Data.decimals
      ).toString(),
      " | 流动性：",
      poolState.liquidity.toString()
    );

    await addLiquidityViaOptions(
      chainID,
      theSigner,
      token0Data,
      token1Data,
      poolState,
      intendToProvideAmount0,
      intendToProvideAmount1
    );

    const pool_contract_after = getContract(poolAddress, POOL_ABI, theSigner);
    const poolState_final = await getCurrentPoolState(pool_contract_after);
    console.log(
      "after pool state: ",
      poolState_final,
      " | 价格：",
      computeReadableValueFrom(
        poolState_final.sqrtPriceX96,
        token0Data.decimals,
        token1Data.decimals
      ).toString(),
      " | 流动性：",
      poolState_final.liquidity.toString()
    );

    return poolAddress;
  };

  const computeReadableValueFrom = (sqrtPriceX96, decimals0, decimals1) => {
    return (
      (Number(sqrtPriceX96) ** 2 * (10 ** decimals1 / 10 ** decimals0)) /
      2 ** 192
    );
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
