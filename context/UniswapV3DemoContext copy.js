// import React, { useState } from "react";
// import { ethers, BigNumber } from "ethers";

// //internal import

// import {
//   SwapQuoter,
//   QuoteOptions,
//   SwapRouter,
//   SwapOptions,
//   Trade,
//   tradeComparator,
//   BestTradeOptions,
//   NonfungiblePositionManager,
//   FeeAmount,
//   TICK_SPACINGS,
//   Pool,
//   encodeSqrtRatioX96,
//   Position,
//   computePoolAddress,
//   TickMath,
//   nearestUsableTick,
// } from "@uniswap/v3-sdk";

// import {
//   Percent,
//   Token,
//   NativeCurrency,
//   CurrencyAmount,
//   WETH9,
//   Ether,
// } from "@uniswap/sdk-core";

// import {
//   ERC20_ABI,
//   WETH_ABI,
//   WORLDCOIN_ABI,
//   NPM_ABI,
//   FACTORY_ABI,
//   POOL_ABI,
//   //
//   ADDRESS_FACTORY, //UniswapV3Factory
//   ADDRESS_NPM, //NonfungiblePositionManager.sol
//   ADDRESS_QuoterV2,
//   ADDRESS_SwapRouter02,
//   //
//   ADDRESS_SEPOLIA_WETH,
//   ADDRESS_WORLD_WCN,
//   ADDRESS_MONGO_MCN,
//   ADDRESS_JAPAN_JCN,
//   ADDRESS_CHINA_CCN,
//   //
//   DEPOSIT_WETH_AMOUNT,
// } from "./constants";

// export const UniswapV3DemoContext = React.createContext();

// export const UniswapV3DemoContextProvider = ({ children }) => {
//   //variable
//   const [currentAccount, setCurrentAccount] = useState("");
//   //check connect wallet
//   const checkIfWalletConnected = async () => {
//     if (!window.ethereum) {
//       console.log("Please Install Metamask");
//     }

//     await handleNetworkSwitch();

//     const accounts = await window.ethereum.request({
//       method: "eth_accounts",
//     });
//     if (accounts?.length > 0) {
//       setCurrentAccount(accounts[0]);
//       return accounts[0];
//     } else {
//       console.log("No accounts found");
//     }
//   };

//   const connectWallet = async () => {
//     if (!window.ethereum) {
//       console.log("Please Install Metamask");
//     }

//     await handleNetworkSwitch();

//     const accounts = await window.ethereum.request({
//       method: "eth_requestAccounts",
//     });
//     setCurrentAccount(accounts[0]);
//   };

//   const getContract = async (address, abi, providerOrSigner) => {
//     // const provider = new ethers.providers.Web3Provider(window.ethereum);
//     // const signer = await provider.getSigner();
//     let contract = new ethers.Contract(address, abi, providerOrSigner);
//     // contract.connect(currentAccount);
//     console.log("contract: ", contract);
//     return contract;
//   };

//   const getWethContactInfo = async (provider) => {
//     const theSigner = await provider.getSigner();
//     const wethContract = await getContract(
//       ADDRESS_SEPOLIA_WETH,
//       WETH_ABI,
//       theSigner
//     ); // token1 contract
//     const [
//       weth_name,
//       weth_symbol,
//       weth_decimals,
//       weth_balance,
//       weth_allowance_to_npm,
//     ] = await Promise.all([
//       await wethContract.name(),
//       await wethContract.symbol(),
//       await wethContract.decimals(),
//       ethers.utils.formatUnits(
//         BigNumber.from(await wethContract.balanceOf(currentAccount)).toString()
//       ),
//       ethers.utils.formatUnits(
//         BigNumber.from(
//           await wethContract.allowance(currentAccount, ADDRESS_NPM)
//         ).toString()
//       ),
//     ]);
//     return {
//       wethContract,
//       weth_name,
//       weth_symbol,
//       weth_decimals,
//       weth_balance,
//       weth_allowance_to_npm,
//     };
//   };

//   const getWcnContactInfo = async (provider) => {
//     const theSigner = await provider.getSigner();
//     const wcnContract = await getContract(
//       ADDRESS_WORLD_WCN,
//       WORLDCOIN_ABI,
//       theSigner
//     ); // token0 contract
//     const [
//       wcn_name,
//       wcn_symbol,
//       wcn_decimals,
//       wcn_balance,
//       wcn_allowance_to_npm,
//     ] = await Promise.all([
//       await wcnContract.name(),
//       await wcnContract.symbol(),
//       await wcnContract.decimals(),
//       ethers.utils.formatUnits(
//         BigNumber.from(await wcnContract.balanceOf(currentAccount)).toString()
//       ),

//       ethers.utils.formatUnits(
//         BigNumber.from(
//           await wcnContract.allowance(currentAccount, ADDRESS_NPM)
//         ).toString()
//       ),
//     ]);
//     return {
//       wcnContract,
//       wcn_name,
//       wcn_symbol,
//       wcn_decimals,
//       wcn_balance,
//       wcn_allowance_to_npm,
//     };
//   };

//   const getCurrentPoolState = async (poolContract) => {
//     const liquidity = await poolContract.liquidity();
//     const slot = await poolContract.slot0();

//     const PoolState = {
//       liquidity,
//       sqrtPriceX96: slot[0],
//       tick: slot[1],
//       observationIndex: slot[2],
//       observationCardinality: slot[3],
//       observationCardinalityNext: slot[4],
//       feeProtocol: slot[5],
//       unlocked: slot[6],
//     };

//     return PoolState;
//   };

//   //创建池
//   const createPool = async (provider) => {
//     const theSigner = await provider.getSigner();
//     const chainID = (await provider.getNetwork()).chainId;
//     console.log("chainID, theSigner : ", chainID, theSigner);

//     //starting var
//     const fee = FeeAmount.HIGH;
//     const slippageTolerance = new Percent(20, 100);
//     const deadline = Math.floor(new Date().getTime() + 1800);
//     const recipient = currentAccount;
//     const sqrtRatioX96 = encodeSqrtRatioX96(1, 1); //token1 token0
//     const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtRatioX96);
//     //
//     // const upper_sqrtRatioX96 = encodeSqrtRatioX96(1, 1500);
//     // const lower_sqrtRatioX96 = encodeSqrtRatioX96(1, 2500);

//     // const tick_upper = TickMath.getTickAtSqrtRatio(upper_sqrtRatioX96);
//     // const tick_lower = TickMath.getTickAtSqrtRatio(lower_sqrtRatioX96);

//     //检查余额WETH_ADDRESS,MY_ERC20_ADDRESS

//     const wethData = await getWethContactInfo(provider);
//     console.log("data: ", wethData);

//     const wcnData = await getWcnContactInfo(provider);
//     console.log("data: ", wcnData);

//     //   The maximum token amounts we want to provide. BigIntish accepts number, string or JSBI
//     const amount0_wcn = ethers.utils.parseUnits("20000", 18);
//     const amount1_weth = ethers.utils.parseUnits("20000", 18);

//     //Give approval to the contract(NonfungiblePositionManager.sol) to transfer tokens
//     // console.log("in put .....", ethers.utils.parseUnits("2000000"));

//     //准备普通代币余额1
//     console.log("wcnBal before: ", currentAccount, wcnData.wcn_balance);
//     if (Number(wcnData.wcn_balance) < 1) {
//       console.log("wcnContract.mint...");
//       const trxRes = await wcnData.wcnContract.mint(
//         currentAccount,
//         ethers.utils.parseUnits("2000000")
//       );

//       await trxRes.wait();
//       //重新检查余额
//       const newWcnBalance = ethers.utils.formatUnits(
//         BigNumber.from(
//           await wcnData.wcnContract.balanceOf(currentAccount)
//         ).toString()
//       );
//       console.log("wcnBal after: ", currentAccount, newWcnBalance);
//     }

//     //准备WETH代币余额2
//     console.log("wethBal before: ", currentAccount, wethData.weth_balance);
//     if (Number(wethData.weth_balance) < 1) {
//       console.log("Your WETH balance < 1");
//       console.log("DEPOSIT_WETH_AMOUNT: ", DEPOSIT_WETH_AMOUNT);
//       const trxRes = await wethData.wethContract.deposit({
//         value: DEPOSIT_WETH_AMOUNT,
//       });
//       await trxRes.wait();

//       //重新检查余额
//       const newWethBalance = ethers.utils.formatUnits(
//         BigNumber.from(
//           await wethData.wethContract.balanceOf(currentAccount)
//         ).toString()
//       );
//       console.log("wethBal after: ", currentAccount, newWethBalance);
//     }

//     console.log(
//       "wcn allowance(npm) before: ",
//       currentAccount,
//       wcnData.wcn_allowance_to_npm
//     );
//     if (Number(wcnData.wcn_allowance_to_npm) < 1) {
//       await wcnData.wcnContract.approve(ADDRESS_NPM, amount0_wcn);
//       const allowanceValue = await wcnData.wcnContract.allowance(
//         currentAccount,
//         ADDRESS_NPM
//       );

//       console.log("wcn allowance(npm) after: ", currentAccount, allowanceValue);
//     }

//     console.log(
//       "weth allowance(npm) before: ",
//       currentAccount,
//       wethData.weth_allowance_to_npm
//     );
//     if (Number(wethData.weth_allowance_to_npm) < 1) {
//       await wethData.wethContract.approve(ADDRESS_NPM, amount1_weth);

//       const allowanceValue = await wethData.wethContract.allowance(
//         currentAccount,
//         ADDRESS_NPM
//       );

//       console.log(
//         "weth allowance(npm) after: ",
//         currentAccount,
//         allowanceValue
//       );
//     }

//     //check factory pool exists or not
//     const factory_contract = new ethers.Contract(
//       ADDRESS_FACTORY,
//       FACTORY_ABI,
//       theSigner
//     );
//     const estimateGasValue = await factory_contract.estimateGas.getPool(
//       ADDRESS_WORLD_WCN,
//       ADDRESS_SEPOLIA_WETH,
//       fee
//     );
//     console.log("estimateGasValue: ", estimateGasValue.toString());

//     let poolAddress = await factory_contract.getPool(
//       ADDRESS_WORLD_WCN,
//       ADDRESS_SEPOLIA_WETH,
//       fee,
//       {
//         gasLimit: estimateGasValue,
//       }
//     );

//     const pool_contract = new ethers.Contract(poolAddress, POOL_ABI, theSigner);
//     console.log("poolAddress: ", poolAddress);
//     if (poolAddress == "0x0000000000000000000000000000000000000000") {
//       console.log("Starting create pool");
//       // create pool
//       let txsRes = await factory_contract.createPool(
//         ADDRESS_WORLD_WCN.toLowerCase(),
//         ADDRESS_SEPOLIA_WETH.toLowerCase(),
//         fee,
//         {
//           gasLimit: 10000000,
//         }
//       );
//       await txsRes.wait();

//       console.log("Create pool finished");
//       poolAddress = await factory_contract.getPool(
//         ADDRESS_WORLD_WCN,
//         ADDRESS_SEPOLIA_WETH,
//         fee,
//         {
//           gasLimit: estimateGasValue,
//         }
//       );

//       console.log("New Pool address", poolAddress);

//       // initial pool price
//       console.log("Starting initial the pool");
//       txsRes = await pool_contract.initialize(sqrtRatioX96.toString(), {
//         gasLimit: 3000000,
//       });
//       await txsRes.wait();
//       console.log("Pool price initialized");
//     } else {
//       console.log("pool already exists, poolAddress= ", poolAddress);
//     }

//     console.log("-----------------------------------------------------");

//     console.log("pool_contract 1: ", pool_contract);
//     let poolState = await getCurrentPoolState(pool_contract);

//     console.log("before pool state: ", currentAccount);

//     const Token0 = new Token(
//       chainID,
//       ADDRESS_WORLD_WCN,
//       wcnData.wcn_decimals,
//       wcnData.wcn_name,
//       wcnData.wcn_symbol
//     );

//     const Token1 = new Token(
//       chainID,
//       ADDRESS_SEPOLIA_WETH,
//       wethData.weth_decimals,
//       wethData.weth_name,
//       wethData.weth_symbol
//     );

//     const configuredPool = new Pool(
//       Token0,
//       Token1,
//       fee,
//       poolState.sqrtPriceX96.toString(),
//       poolState.liquidity.toString(),
//       poolState.tick
//     );

//     console.log("configuredPool: ", configuredPool);

//     const position1 = Position.fromAmounts({
//       pool: configuredPool,
//       tickLower:
//         nearestUsableTick(
//           configuredPool.tickCurrent,
//           configuredPool.tickSpacing
//         ) -
//         configuredPool.tickSpacing * 2,
//       tickUpper:
//         nearestUsableTick(
//           configuredPool.tickCurrent,
//           configuredPool.tickSpacing
//         ) +
//         configuredPool.tickSpacing * 2,
//       amount0: amount0_wcn.toString(),
//       amount1: amount1_weth.toString(),
//       useFullPrecision: false,
//     });
//     console.log("position1: ", position1);
//     console.log("position1 liquidity: ", position1.liquidity);

//     // chainId: number, decimals: number, symbol?: string, name?: string
//     const nativeCurrency = new NativeCurrency(
//       chainID,
//       18,
//       "WETH",
//       "Wrapped Ether"
//     );

//     const mintOptions = {
//       recipient: currentAccount,
//       deadline: deadline,
//       slippageTolerance: slippageTolerance,
//       //   useNative: nativeCurrency,
//       //   token0Permit: false,
//       //   token1Permit: true,
//       //   amount: amount0_wcn > amount1_weth ? amount0_wcn : amount1_weth,
//     };

//     // return poolAddress;

//     const { calldata, value } = NonfungiblePositionManager.addCallParameters(
//       position1,
//       mintOptions
//     );

//     console.log(
//       "NonfungiblePositionManager.addCallParameters: ",
//       value,
//       calldata
//     );

//     const transaction = {
//       data: calldata,
//       to: ADDRESS_NPM,
//       value: value,
//       from: currentAccount,
//       gasLimit: 5000000,
//     };
//     console.log("send the transacting: ", transaction);
//     const txRes = await theSigner.sendTransaction(transaction);
//     await txRes.wait();
//     console.log("Pool liquidity Added.");

//     poolState = await getCurrentPoolState(pool_contract);

//     console.log("after pool state: ", currentAccount);

//     return poolAddress;
//   };

//   const handleNetworkSwitch = async () => {
//     try {
//       // @ts-ignore
//       if (!window.ethereum) return console.log("Install MetaMask");
//       // @ts-ignore
//       await window.ethereum.request({
//         method: "wallet_addEthereumChain",
//         params: [
//           {
//             chainId: `0x${Number(31337).toString(16)}`,
//             chainName: "local_fork_sepolia ",
//             nativeCurrency: {
//               name: "ETH",
//               symbol: "ETH",
//               decimals: 18,
//             },
//             rpcUrls: ["http://127.0.0.1:8545/"],
//             //no explorer here
//             blockExplorerUrls: ["https://sepolia.etherscan.io/"],
//           },
//         ],
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   return (
//     <UniswapV3DemoContext.Provider
//       value={{
//         currentAccount,
//         // provider,
//         // deployer,
//         checkIfWalletConnected,
//         connectWallet,
//         createPool,
//       }}
//     >
//       {children}
//     </UniswapV3DemoContext.Provider>
//   );
// };
