import { ethers, BigNumber } from "ethers";
import {
  Percent,
  Token,
  CurrencyAmount,
  WETH9,
  Ether,
} from "@uniswap/sdk-core";

import {
  JSON_RPC_URL,
  //
  QUOTERV2_ABI,
  V3SWAPROUTER_ABI,
  V3FACTORY_ABI,
  V3POOL_ABI,
  //tokens
  ERC20_ABI,
  WETH_ABI,
  WORLDCOIN_ABI,
  //quoter
  SwapQuoter,
  QuoteOptions,
  //swapRouter
  SwapRouter,
  SwapOptions,
  //trade
  Trade,
  tradeComparator,
  BestTradeOptions,
  //
  NonfungiblePositionManagerABI,
  //utils
  computePoolAddress,
  NonfungiblePositionManager,
  FeeAmount,
  TICK_SPACINGS,
  Pool,
  encodeSqrtRatioX96,
  Position,
  TickMath,
} from "../constants";

const MAX_FEE_PER_GAS = 100000000000;
const MAX_PRIORITY_FEE_PER_GAS = 100000000000;

const QUOTERV2_ADDRESS = process.env.NEXT_PUBLIC_QuoterV2;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_UniswapV3Factory;
const WETH_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_WETH;
const ERC20_ADDRESS = process.env.NEXT_PUBLIC_QuoterV2;
const MY_ERC20_ADDRESS = process.env.NEXT_PUBLIC_NATIVE_WCN;

const NOUFUNGIBLE_POSITION_MANAGER_ADDRESS =
  process.env.NEXT_PUBLIC_NonfungiblePositionManager;

//
const provider = new ethers.providers.JsonRpcProvider(JSON_RPC_URL);
const signer0 = provider.getSigner();
console.log("signer0: ", signer0);

const local_account_0 = process.env.NEXT_PUBLIC_LOCALHOST_ACCOUNT_0;
const local_account_0_secret_key = process.env.NEXT_PUBLIC_PRIVATE_KET;

export const createPool = async (recipient) => {
  console.log("createPool recipient", recipient);
  const slippageTolerance = new Percent(20, 100);
  const deadline = Math.floor(new Date().getTime() + 1800);

  const token_wcn = new Token(31337, MY_ERC20_ADDRESS, 18, "world coin", "WCN");
  const token_weth = new Token(
    31337,
    WETH_ADDRESS,
    18,
    "Wrapped Ether",
    "WETH"
  );
  const amount0_WCN = ethers.utils.parseUnits("3000", 18);
  const amount1_WETH = ethers.utils.parseUnits("2", 18);

  console.log("amount0_WCN: ", BigNumber.from(amount0_WCN));

  const fee = FeeAmount.LOW_300;
  const sqrtRatioX96 = encodeSqrtRatioX96(1, 2000);
  console.log("sqrtRatioX96: ", sqrtRatioX96);

  const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtRatioX96);
  console.log("tickCurrent: ", tickCurrent);
  // const tickCurrent = 0;

  const liquidity = 100;

  //constructor(tokenA: Token, tokenB: Token, fee: FeeAmount, sqrtRatioX96: BigintIsh, liquidity: BigintIsh, tickCurrent: number, ticks?: TickDataProvider | (Tick | TickConstructorArgs)[]);
  // createPool :      address token0, address token1,uint24 fee,uint160 sqrtPriceX96
  const pool_weth_wcn = new Pool(
    token_wcn,
    token_weth,
    fee,
    sqrtRatioX96, //weth=10,wcn=100
    0, //liquidity: BigintIsh
    tickCurrent, //tickCurrent: number
    [] //TickDataProvider
  );
  console.log("pool_weth_wcn-token0Price", pool_weth_wcn.token0Price());
  console.log("pool_weth_wcn-token0Price", pool_weth_wcn.token0Price());
  console.log("pool_weth_wcn-liquidity", pool_weth_wcn.liquidity());
  console.log("pool_weth_wcn-tickSpacing", pool_weth_wcn.tickSpacing());
  //  return;
  let token0Permit = false;
  let token1Permit = false;
  let createPool = true;

  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    new Position({
      pool: pool_weth_wcn,
      tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
      tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
      liquidity: liquidity,
    }),
    {
      recipient,
      slippageTolerance,
      deadline,
      createPool,
      token0Permit,
      token1Permit,
    }
  );

  const factoryContract = new ethers.Contract(
    FACTORY_ADDRESS,
    V3FACTORY_ABI,
    provider
  );
  console.log("factoryContract: ", factoryContract);

  const myCreatePool = await factoryContract.getPool(
    WETH_ADDRESS,
    MY_ERC20_ADDRESS,
    fee
  );
  console.log("myCreatePool: ", myCreatePool);

  return { calldata, value };
};

export const readContract = async () => {
  const worldCoinContract = new ethers.Contract(
    MY_ERC20_ADDRESS,
    WORLDCOIN_ABI,
    provider
  );
  console.log("worldCoinContract: ", worldCoinContract);
  const [my_name, my_symbol, my_decimals, my_balance] = await Promise.all([
    await worldCoinContract.name(),
    await worldCoinContract.symbol(),
    await worldCoinContract.decimals(),
    ethers.utils.formatUnits(
      BigNumber.from(
        await worldCoinContract.balanceOf(local_account_0)
      ).toString()
    ),
  ]);

  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);
  console.log("wethContract: ", wethContract);
  const [weth_name, weth_symbol, weth_decimals, weth_balance] =
    await Promise.all([
      await wethContract.name(),
      await wethContract.symbol(),
      await wethContract.decimals(),
      ethers.utils.formatUnits(
        BigNumber.from(await wethContract.balanceOf(local_account_0)).toString()
      ),
    ]);

  const positionManagerContract = new ethers.Contract(
    NOUFUNGIBLE_POSITION_MANAGER_ADDRESS,
    NonfungiblePositionManagerABI,
    provider
  );
  console.log("positionManagerContract: ", positionManagerContract);

  const [position_name, position_symbol, my_position_nft_id] =
    await Promise.all([
      await positionManagerContract.name(),
      await positionManagerContract.symbol(),
      BigNumber.from(
        await positionManagerContract.tokenOfOwnerByIndex(local_account_0, 1)
      ).toString(),
    ]);

  const factoryContract = new ethers.Contract(
    FACTORY_ADDRESS,
    V3FACTORY_ABI,
    provider
  );
  console.log("factoryContract: ", factoryContract);

  const myCreatePool = await factoryContract.getPool(
    WETH_ADDRESS,
    MY_ERC20_ADDRESS,
    FeeAmount.LOW_300
  );
  console.log("myCreatePool: ", myCreatePool);

  return {
    weth_name,
    weth_symbol,
    weth_decimals,
    weth_balance,
    my_name,
    my_symbol,
    my_decimals,
    my_balance,
    position_name,
    position_symbol,
    my_position_nft_id,
  };
};

export const getWethBalanceOnLocalForkChain = async (recipient) => {
  const contract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);

  const wethBalance = ethers.utils.formatUnits(
    BigNumber.from(await contract.balanceOf(recipient)).toString()
  );
  return { contract, wethBalance };
};

export const onEvent = async () => {
  const factoryContract = new ethers.Contract(
    FACTORY_ADDRESS,
    V3FACTORY_ABI,
    provider
  );
  console.log("······on``PoolCreated``event`````` ");

  factoryContract.on(
    "PoolCreated",
    (token0, token1, fee, tickSpacing, pool, event) => {
      let info = {
        token0: token0,
        token1: token1,
        fee: fee,
        tickSpacing: tickSpacing,
        pool: pool,
        data: event,
      };
      console.log("PoolCreated: ", JSON.stringify(info, null, 4));
    }
  );

  console.log("······on``PoolCreated``event end?`````` ");
};
