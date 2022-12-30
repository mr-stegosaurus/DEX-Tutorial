import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/*
    getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received 
    when the user swaps `_swapAmountWei` amount of Eth/Crypto Dev tokens.
*/
export const getAmountOfTokensReceivedFromSwap = async (
    _swapAmountWei,
    provider,
    ethSelected,
    ethBalance,
    reservedCD
) => {
    // create a new instance of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );
    let amountOfTokens;
    // If 'Eth' is selected this means our input value is 'eth' which means out input amount would be
    // '_swapAmountWei', the input resrve would be the 'ethBalance of the contract and the output reserve would be
    // the 'Crypto Dev' token reserve
    if (ethSelected) {
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            ethBalance,
            reservedCD
        );
    } else {
        // if 'eth' is not selected this means our input value is 'crypto dev' tokens which means our input amount
        // would be '_swapAmountWei, the input reserve would be the 'crypto dev' token reserve of the contract and output
        // reserve would be the 'ethBalance'
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            reservedCD,
            ethBalance
        );
    }

    return amountOfTokens;
};

/*
 swapTokens: swaps 'swapAmountWei' of ETh/Crypto Dev tokens with 'tokenToBeReceivedAfterSwap' amount of Eth/Crypto Dev tokens. 
*/
export const swapTokens = async (
    signer,
    _swapAmountWei,
    tokenToBeReceivedAfterSwap,
    ethSelected
) => {
    // create a new instance of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );
    let tx;
    // If Eth is selected call the `ethToCryptoDevToken` function else
    // call the `cryptoDevTokenToEth` function from the contract
    // As you can see you need to pass the `swapAmount` as a value to the function because
    // it is the ether we are paying to the contract, instead of a value we are passing to the function
    if (ethSelected) {
        tx = await exchangeContract.ethToCryptoDevToken(
            tokenToBeReceivedAfterSwap,
            {
                value: _swapAmountWei,
            }
        );
    } else {
        // user has to approve 'swapAmountWei' for the contract because "crypto dev" tokne
        // is an ERC20
        tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            _swapAmountWei.toString()
        );
        await tx.wait();
        // call cryptoDevTokenToEth function which would take in 'swapAmountWei' of "Crypto Dev" tokens and would
        // send back 'tokenToBeReceivedAfterSwap' amount of 'Eth' to the user
        tx = await exchangeContract.cryptoDevTokenToEth(
            swapAmountWei,
            tokenToBeReceivedAfterSwap
        );
    }
    await tx.wait();
};