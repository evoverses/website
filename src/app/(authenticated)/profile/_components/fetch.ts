import { LpTokenABI } from "@/assets/abi/lp-token";
import { asSimpleContract, cEvoContract, evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { fetchPairDataOf } from "@/lib/dexscreener";
import { client } from "@/lib/viem";
import { poolInfo } from "@/thirdweb/43114/0xd782cf9f04e24cae4953679ebf45ba34509f105c";
import { Pool } from "@/types/core";
import { cache } from "react";
import { Address } from "thirdweb";
import { erc20Abi, formatEther } from "viem";

export const findWithdrawFee = (timeDelta: bigint | number): [ number, number, number ] => {
  timeDelta = Number(timeDelta);
  let [ withdrawFee, nextFee, secondsRemaining ] = [ 0, 0, 0 ];
  if (timeDelta === 0) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 25, 8, 1 ];
  } else if (timeDelta >= 1 && timeDelta < 3600) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 8, 4, 3600 - timeDelta ];
  } else if (timeDelta >= 3600 && timeDelta < 86400) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 4, 2, 86400 - timeDelta ];
  } else if (timeDelta >= 86400 && timeDelta < 259200) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 2, 1, 259200 - timeDelta ];
  } else if (timeDelta >= 259200 && timeDelta < 432000) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 1, 0.5, 432000 - timeDelta ];
  } else if (timeDelta >= 432000 && timeDelta < 1209600) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 0.5, 0.25, 1209600 - timeDelta ];
  } else if (timeDelta >= 1209600 && timeDelta < 2419200) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 0.25, 0.1, 2419200 - timeDelta ];
  } else if (timeDelta >= 2419200) {
    [ withdrawFee, nextFee, secondsRemaining ] = [ 0.1, 0, 0 ];
  }
  return [ withdrawFee, nextFee, secondsRemaining ];
};

export const getPoolData = cache(async (address: Address): Promise<Pool[]> => {
  const pair = await fetchPairDataOf("0x42006Ab57701251B580bDFc24778C43c9ff589A1");
  const now = BigInt(Math.floor(Date.now() / 1000));
  const [ poolLength ] = await client.multicall({
    contracts: [
      { ...asSimpleContract(investorContract), functionName: "poolLength" },
    ],
    allowFailure: false,
  });

  const gas = await client.getBalance({ address })
  const poolIds = Array.from({ length: Number(poolLength) }, (_, i) => BigInt(i));
  return Promise.all(
    poolIds.filter(id => id !== 1n).map(async poolId => {
      // noinspection JSUnusedLocalSymbols
      const [ lpToken, allocPoint, lastRewardTime, accGovTokenPerShare ] = await poolInfo({
        contract: investorContract,
        poolId,
      });
      // noinspection JSUnusedLocalSymbols
      const [
        [ amount, rewardDebt, rewardDebtAtTime, lastWithdrawTime, firstDepositTime, userTimeDelta, lastDepositTime ],
        emissionRate, totalSupply, contBalance, timeDelta, remainBalance, pendingRewards, depFee, token0,
        token1, [ _reserve0, _reserve1, _blockTimestampLast ],
      ] = await client.multicall(
        {
          contracts: [
            { ...asSimpleContract(investorContract), functionName: "userInfo", args: [ poolId, address ] },
            { ...asSimpleContract(investorContract), functionName: "getNewRewardPerSecond", args: [ poolId ] },
            { address: lpToken, abi: LpTokenABI, functionName: "totalSupply" },
            { address: lpToken, abi: LpTokenABI, functionName: "balanceOf", args: [ investorContract.address ] },
            { ...asSimpleContract(investorContract), functionName: "userDelta", args: [ poolId ] },
            { address: lpToken, abi: LpTokenABI, functionName: "balanceOf", args: [ address ] },
            { ...asSimpleContract(investorContract), functionName: "pendingReward", args: [ poolId, address ] },
            { ...asSimpleContract(investorContract), functionName: "USER_DEP_FEE" },
            { address: lpToken, abi: LpTokenABI, functionName: "token0" },
            { address: lpToken, abi: LpTokenABI, functionName: "token1" },
            { address: lpToken, abi: LpTokenABI, functionName: "getReserves" },
          ],
          allowFailure: false,
        });

      const [ t0Symbol, t0Decimals, t0WalletBalance, t1Symbol, t1Decimals, t1WalletBalance ] = await client.multicall(
        {
          contracts: [
            { address: token0, abi: erc20Abi, functionName: "symbol" },
            { address: token0, abi: erc20Abi, functionName: "decimals" },
            { address: token0, abi: erc20Abi, functionName: "balanceOf", args: [ address ] },
            { address: token1, abi: erc20Abi, functionName: "symbol" },
            { address: token1, abi: erc20Abi, functionName: "decimals" },
            { address: token1, abi: erc20Abi, functionName: "balanceOf", args: [ address ] },
          ],
          allowFailure: false,
        });
      const name = `${t0Symbol} / ${t1Symbol}`;
      const lastTime = address ? lastWithdrawTime > firstDepositTime ? lastWithdrawTime : firstDepositTime : 0;
      const [ withdrawFee, nextWithdrawFee, nextSecondsRemaining ] = findWithdrawFee(now - timeDelta);
      const aprEmissionRate = Number(emissionRate) / 1e18 * 86_400 * 365;
      const apr = aprEmissionRate * Number(pair.priceUsd) / Number(pair.liquidity.usd) * 100;
      const ratio = Number(remainBalance) / Number(totalSupply);
      const divRatio = Number(amount) / Number(totalSupply);
      const token0Balance = Number(_reserve0) * ratio;
      const token1Balance = Number(_reserve1) * ratio;
      const token0BalanceUSD = token0Balance / (10**t0Decimals) * Number(pair.priceUsd);
      const token1BalanceUSD = token1Balance / (10**t1Decimals) * Number(pair.priceUsd) / Number(pair.priceNative);
      const token0DivBalance = Number(_reserve0) * divRatio;
      const token1DivBalance = Number(_reserve1) * divRatio;
      const token0DivBalanceUSD = token0DivBalance / (10**t0Decimals) * Number(pair.priceUsd);
      const token1DivBalanceUSD = token1DivBalance / (10**t1Decimals) * Number(pair.priceUsd) / Number(pair.priceNative);
      return {
        name,
        earned: pendingRewards,
        earnedUSD: Number(pendingRewards) / 1e18 * Number(pair.priceUsd),
        apr: Math.round(apr * 100) / 100,
        liquidity: Number(pair.liquidity.usd),
        emissionRate,
        level: allocPoint,
        totalBalance: contBalance,
        totalBalanceUsd: pair.liquidity.usd,
        balance: amount,
        balanceUsd: Number(amount) / 1e18 * Number(pair.priceUsd),
        remainBalance,
        remainBalanceUsd: Number(remainBalance) / 1e18 * Number(pair.priceUsd),
        token0,
        token1,
        t0Symbol,
        t1Symbol,
        t0WalletBalance,
        t1WalletBalance,
        token0Balance,
        token1Balance,
        token0BalanceUSD,
        token1BalanceUSD,
        token0DivBalance,
        token1DivBalance,
        token0DivBalanceUSD,
        token1DivBalanceUSD,
        token: lpToken as Address,
        lastTime: BigInt(lastTime),
        depFee,
        withdrawFee,
        nextWithdrawFee,
        nextSecondsRemaining,
        value: Number(pair.priceUsd),
        pid: poolId,
        gas,
      };
    }));
});

export const getxEVOData = cache(async (address: Address = "0x0000000000000000000000000000000000000000") => {
  const [ xEvoTotalSupply, xEvoEvoBalance, xEvoUserBalance, evoUserBalance ] = await client.multicall({
    contracts: [
      { ...asSimpleContract(xEvoContract), functionName: "totalSupply" },
      { ...asSimpleContract(evoContract), functionName: "balanceOf", args: [ xEvoContract.address ] },
      { ...asSimpleContract(xEvoContract), functionName: "balanceOf", args: [ address ] },
      { ...asSimpleContract(evoContract), functionName: "balanceOf", args: [ address ] },
    ],
    allowFailure: false,
  });
  const pair = await fetchPairDataOf(evoContract.address);
  return {
    xEvoTotalSupply,
    xEvoEvoBalance,
    xEvoUserBalance,
    evoUserBalance,
    multiplier: Number(xEvoEvoBalance * 100_000n / xEvoTotalSupply) / 100_000,
    tvl: Number(formatEther(xEvoEvoBalance)) * Number(pair.priceUsd)
  }
});

export const getcEVOData = cache(async (address: Address = "0x0000000000000000000000000000000000000000") => {
  const [ disbursements, balance, pending, selfDisbursementArray ] = await client.multicall({
    contracts: [
      { ...asSimpleContract(cEvoContract), functionName: "disbursementsOf", args: [ address ] },
      { ...asSimpleContract(cEvoContract), functionName: "balanceOf", args: [ address ] },
      { ...asSimpleContract(cEvoContract), functionName: "pendingOf", args: [ address ] },
      { ...asSimpleContract(cEvoContract), functionName: "selfDisbursement", args: [ address ] },
    ],
    allowFailure: false,
  });
  const selfDisbursement = {
    startTime: selfDisbursementArray[0],
    duration: selfDisbursementArray[1],
    amount: selfDisbursementArray[2],
    balance: selfDisbursementArray[3],
  };

  // const pair = await fetchPairDataOf(evoContract.address);
  return {
    disbursements: [ ...disbursements, selfDisbursement ].filter((d) => d.startTime > 0n && d.balance > 0n),
    balance,
    pending,
  };
});

export const getEVOData = cache(async (address: Address = "0x0000000000000000000000000000000000000000") => {
  const [ totalSupply, balance, locked, burned, cap ] = await client.multicall({
    contracts: [
      { ...asSimpleContract(evoContract), functionName: "totalSupply" },
      { ...asSimpleContract(evoContract), functionName: "balanceOf", args: [ address ] },
      { ...asSimpleContract(evoContract), functionName: "balanceOf", args: [ cEvoContract.address ] },
      { ...asSimpleContract(evoContract), functionName: "totalBurned" },
      { ...asSimpleContract(evoContract), functionName: "cap" },
    ],
    allowFailure: false,
  });

  // const pair = await fetchPairDataOf(evoContract.address);
  return {
    cap,
    totalSupply,
    burned,
    locked,
    circulating: totalSupply - burned - locked,
    balance,
  };
});
