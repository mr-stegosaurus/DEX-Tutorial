import { Contract } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "..constants";

/**
 * getEtherBalance: retrieves the ether balance of the user or the contract
 */
export const getEtherBalance = async (provider, address, contract = false) => {
    try {
        // if the caller has set the 'contract' boolean to true, retrive the balance of
        // ether in the 'exchange contract', if it is set to false, retrieve the balance
        // of the user's address
        if (contract) {
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        } else {
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (err) {
        console.error(err);
        return 0;
    }
};

/**
 * getCDTokensBalance: retrives the Crypto Dev tokens in the account
 * of the provided 'address'
 */
export const getCDTokensBalance = async (provider, address) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
        );
        const balanceOfCryptoDevTokens = await tokenContract.balanceOf(address);
        return balanceOfCryptoDevTokens;
    } catch (err) {
        console.error(err);
    }
};

/**
 * getLPTokensBalance: retrives the amount of LP tokens in the account
 * of the provided 'address'
 */
export const getLPTokenBalance = async (provider, address) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const balanceOfLPTokens = await exchangeContract.balanceOf(address);
        return balanceOfLPTokens;
    } catch (err) {
        console.error(err);
    }
};

/**
 * getReserveOfCDTokens: Retrieves the amount of CD tokens in the excahnge contract address
 */
export const getReserveOfCDTokens = async(provider) => {
    try {
       const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
       );
       const reserve = await exchangeContract.getReserve();
       return reserve;
    } catch (err) {
        console.error(err)
    }
};

import { Contract, providers, utils, BigNumber } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
} from "../constants";

/**
 * removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
 * liquidity and also the calculated amount of `ether` and `CD` tokens
 */
export const removeLiquidity = async (signer, removeLPTokensWei) => {
    // create a new instance of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tx = await exchangeContract.removeLiquidity(removeLPTokensWei)
};

/**
 * gettokensAfterRemove: calculates the amount of 'eth' and 'cd' tokens
 * that would be returned back to user after he removes 'removeLPTokenWei' amount
 * of LP tokens from the contract
 */
export const getTokensAfterRemove = async (
    provider,
    removeLPTokenWei,
    _ethBalance,
    cryptoDevTokenReserve
) => {
    try {
        // create a new instance of the exchange contract
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        // get the total supply of 'crypto dev' LP tokens
        const _totalSupply = await exchangeContract.totalSupply();
        // Here we are using the BigNumber methods of multiplication and division
        // The amount of Eth that would be sent back to the user after he withdraws the LP token
        // is calculated based on a ratio,
        // Ratio is -> (amount of Eth that would be sent back to the user / Eth reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
        // By some maths we get -> (amount of Eth that would be sent back to the user) = (Eth Reserve * LP tokens withdrawn) / (total supply of LP tokens)
        // Similarly we also maintain a ratio for the `CD` tokens, so here in our case
        // Ratio is -> (amount of CD tokens sent back to the user / CD Token reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
        // Then (amount of CD tokens sent back to the user) = (CD token reserve * LP tokens withdrawn) / (total supply of LP tokens)
        const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
        const _removeCD = cryptoDevTokenReserve
            .mul(removeLPTokenWei)
            .div(_totalSupply);
        return {
            _removeEther,
            _removeCD,
        };
    } catch (err) {
        console.error(err);
    }
};