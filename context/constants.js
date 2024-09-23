// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's

// import { SupportedChainId, Token } from "@uniswap/sdk-core";
import { ethers } from "ethers";

import { FeeAmount } from "@uniswap/v3-sdk";

import ERC20_abi from "./abi/abi-erc20.json";
import WETH_abi from "./abi/abi-weth.json";
import WorldCoin_abi from "./abi/WorldCoin.json";
import NonfungiblePositionManager_json from "./abi/PositionManager.json";

import FACTORY_abi from "./abi/abi-v3-factory.json";
import POOL_abi from "./abi/abi-v3-pool.json";
import COMMON_MY_ERC20_abi from "./abi/common-my-erc20.json";

// ABI's

export const OUR_ERC20_ABI = COMMON_MY_ERC20_abi; //our self erc20 token abi
export const ERC20_ABI = ERC20_abi;
export const WETH_ABI = WETH_abi;
export const WORLDCOIN_ABI = WorldCoin_abi;
export const NPM_ABI = NonfungiblePositionManager_json.abi;
export const FACTORY_ABI = FACTORY_abi;
export const POOL_ABI = POOL_abi;

// Addresses

//UniswapV3Factory
export const ADDRESS_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
export const ADDRESS_Multicall2 = "0xD7F33bCdb21b359c8ee6F0251d30E94832baAd07";
export const ADDRESS_ProxyAdmin = "0x0b343475d44EC2b4b8243EBF81dc888BF0A14b36";
export const ADDRESS_NFTDescriptor =
  "0x3B5E3c5E595D85fbFBC2a42ECC091e183E76697C";
//NonfungibleTokenPositionDescriptor
export const ADDRESS_NTPD = "0x5bE4DAa6982C69aD20A57F1e68cBcA3D37de6207";
//ADDRESS_NonfungiblePositionManager
export const ADDRESS_NPM = "0x1238536071E1c677A632429e3655c799b22cDA52";
export const ADDRESS_V3Migrator = "0x729004182cF005CEC8Bd85df140094b6aCbe8b15";
export const ADDRESS_QuoterV2 = "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3";
export const ADDRESS_SwapRouter02 =
  "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
export const ADDRESS_Permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const ADDRESS_UniversalRouter =
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";

// TEST TOKENS ADDRESS
export const ADDRESS_SEPOLIA_WETH =
  "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
export const ADDRESS_SEPOLIA_DAI = "0x68194a729c2450ad26072b3d33adacbcef39d574";
export const ADDRESS_SEPOLIA_USDC =
  "0xf08A50178dfcDe18524640EA6618a1f965821715";
export const ADDRESS_SEPOLIA_UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

// DEPOLY AT LOCAL FORK SEPOLIA CHAIN
export const ADDRESS_WORLD_WCN = "0xfF648f576F6a8F6686ba1B2d12a47fD6E7876E9C";
export const ADDRESS_MONGO_MCN = "0x0316BF0634653eF9be054895Af2435B9824183ee";
export const ADDRESS_JAPAN_JCN = "0xfb27a13a86420B759f991ADA817E08457406461d";
export const ADDRESS_CHINA_CCN = "0x51f8610d4be85B12066bE20E18Fa7aa336EA4a5C";
export const ADDRESS_SPECIAL_CCN = "0x00953cAF2B6cb2D52B8d6A61EeEaFe4e321842e6";

// create pool info

export const CREATE_POOL_INFO = {
  TOKEN_0_ADDRESS: ADDRESS_MONGO_MCN,
  TOKEN_1_ADDRESS: ADDRESS_SEPOLIA_WETH,
  POOL_FEE: FeeAmount.HIGH,
  //The maximum token amounts we want to provide. BigIntish accepts number, string or JSBI
  INTEND_TO_PROVIDE_AMOUNT_0: 800,
  INTEND_TO_PROVIDE_AMOUNT_1: 500,
  // create new pool address
  POOL_ADDRESS: ["0x57D1CaBa0bFE969A726CC705E94D1aD7589211Eb"],
};

// pool create input

export const DEPOSIT_WETH_AMOUNT = ethers.utils.parseEther("1000");
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Transactions

export const MAX_FEE_PER_GAS = "100000000000";
export const MAX_PRIORITY_FEE_PER_GAS = "100000000000";
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 1000000000000;
