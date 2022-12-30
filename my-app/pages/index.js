import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  /** general state variables */
  // loading is set to true when the transaction is mining and set to false when
  // the transaction is mined
  const [loading, setLoading] = useState(false);
  // we have two tabs in this dapp, liquidity tab and swap tab. this variable
  // keeps track of which tab the user is on. if it is set to true this mans that the
  // user is on 'liquidity' tab else he is on 'swap' tab
  const [liquidityTab, setLiquidityTab] = useState(true);
  // this variable is the '0' number in form of a BigNumber
  const zero = BigNumber.from(0);
  /** Variable tok eep track of amount */
  // 'ethBalance' keeps track of the amount of Eth held by the user's account
  const [ethBalance, setEtherBalance] = useState(zero);
  // 'reservedCD' keeps track of the Crypto Dev tokens Reserve balance in the Exchange contract
  const [reservedCD, setReservedCD] = useSTate(zero);
  // keeps track of the ether balance in the contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // cdBalance is the amount of 'CD' tokens help by the users account
  const [cdBalance, setCDBalance] = useState(zero);
  // 'lpBalance' is the amount of LP tokens held by the users account
  const [lpBalance, setLPBalance] = useState(zero);
  /** variables to keep track of liquidity to be added or removed */
  // addEther is the amount of Ether that the user wants to add to the liquidty
  const [addEther, setAddEther] = useState(zero);
  // addCDTokens keeps track of the amount of CD tokens that the user wants to add to the liquidity
  // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
  // CD tokens that the user can add given a certain amount of ether
  const [addCDTokens, setAddCDTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // removeCD is the amount of `Crypto Dev` tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removeCD, setRemoveCD] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  /** Variables to keep track of swap functionality */
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // this keeps track of the number of tokens that the user would receive after a swap completes
  const [TokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] = 
    useState(zero);
  // keeps track of whether 'eth' or 'crypto dev' token is selected. if 'eth' is selected it means that the user
  // wants to swap some 'eth' for some 'crypto dev' tokens and vice versa if 'eth' is not selected
  const [ethSelected, setEthSelected] = useState(true);
  /** wallet connection */
  // create a reference to the web3 modal (used for connection metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletconnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  /**
   * getAmounts call various functions to retrieve amounts for ethBalance,
   * LP tokens etc
   */
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // get the amount of eth in teh user's account
      const _ethBalance = await getEtherBalance(provider, address);
      // get the amount of 'crypto dev' tokens held by the user
      const _cdBalance = await getCDTokensBalance(provider, address);
      // get the amount of 'crypto dev' LP tokens held by the user
      const _lpBalance = await getLPTokensBalance(provider, address);
      // gets the amout of 'cd' tokens that are present in the reserve of the exchange contract
      const _reservedCD = await getReserveOfCDTokens(provider);
      // get the ether reserves in the contract
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };

  /** SWAP FUNCTIONS */

  /**
   * swapTokens: swaps 'swapAmountWei' of Eth/Crypto Dev tokens with /tokenToBeReceivedAfterSwap' amount of Eth/Crypto
   * Dev tokens
   */
  const _swapTokens = async () => {
    try {
      // convert the amount entered by the user to a BigNumber using the 'parseEther' library from 'ethers.js'
      const swap = utils.parseEther(swapAmount);
      // check if the user entered a zero
      // we are here using the 'eq' method from BigNumber class in 'ethers.js'
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // call the swapTokens function from the 'utils' folder
        await swapTokens(
          signer,
          swapAmountWei,
          TokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        // get all the updated amount after the swap
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  /**
   * _getAmountOfTokensReceivedFromSwap: returns the number of eth/crypto Dev tokens that can be received
   * when the user swaps '_swapAmountWEI' amount of Eth/Crypto Dev tokens.
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      // convert the amount entered by the user to a BigNumber using the 'parseEther' library from 'ethers.js'
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      // check if the user entered zero
      // we are here using the 'eq' method from BigNumber class in 'ethers.js'
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        // get the amount of ether in the contract
        const _ethBalance = await getEtherBalance(provider, null, true);
        // call the 'getAmountOfTokensReceivedFromSwap' from the utils folder
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedCD
        );
        settokenToBeReceivedAfterSwap(amountOfTokens);
        } else {
          settokenToBeReceivedAfterSwap(zero);
        }
    } catch (err) {
      console.error(err);
    }
  };

  /*** END ***/

  /*** ADD LIQUIDITY FUNCTIONS ***/
  /**
   * _addLiquidity helps add liquidity to the exchange,
   * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
   * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
   * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
   * constant
   */
  const _addLiquidity = async () => {
    try {
      // Convert the ether amount entered by the user to Bignumber
      const addEtherWei = utils.parseEther(addEther.toString());
      // Check if the values are zero
      if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // call the addLiquidity function from the utils folder
        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        // Reinitialize the CD tokens
        setAddCDTokens(zero);
        // Get amounts for all values after the liquidity has been added
        await getAmounts();
      } else {
        setAddCDTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddCDTokens(zero);
    }
  };

  /**** END ****/

  /**** REMOVE LIQUIDITY FUNCTIONS ****/

  /**
   * _removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
   * liquidity and also the calculated amount of `ether` and `CD` tokens
   */
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      // Call the removeLiquidity function from the `utils` folder
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };

  /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Get the Eth reserves within the exchange contract
      const _ethBalance = await getEtherBalance(provider, null, true);
      // get the crypto dev token reserves from the contract
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      // call the getTokensAfterRemove from the utils folder
      const { _removeEther, _removeCD } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        cryptoDevTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch (err) {
      console.error(err);
    }
  };

  /**** END ****/ 

  /** 
   * connectWallet: connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      // get the provider from web3modal, whic hin our case is MetaMask
      // when used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err)
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or
   * without the signing capabilities of Metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading
   * transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction
   * needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being
   * sent. Metamask exposes a Signer API to allow your website to request
   * signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false
   * otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // connect to metamask
    // since we store web3Modal as a reference, we need to access the 'current' value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // if user is not connected to Goerli network, let them know and throw error
    const { chainId } = await web3ModalRef.current.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react ot changes in the state of the website
  // the array at the end of the function call represents what state changes will trigger this effect
  // in this case, whenever the value of 'walletConnected' changes = this effect will be called

  
}