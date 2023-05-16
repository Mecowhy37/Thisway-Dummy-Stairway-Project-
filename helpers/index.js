import { ref } from "vue"
import { BrowserProvider, Contract, parseEther, formatEther, formatUnits } from "ethers"

import { storeToRefs } from "pinia"
import { useStepStore } from "@/stores/step"
import * as Tokens from "../constants/tokenList.json"
const TokenList = Tokens.default

import * as Router from "../ABIs/DEX.json"
const RouterABI = Router.default

import * as Factory from "../ABIs/Factory.json"
const FactoryABI = Factory.default

import * as Token from "../ABIs/ERC20.json"
const TokenABI = Token.default

import * as Pool from "../ABIs/Pool.json"
const PoolABI = Pool.default

const unhandled = "0x0000000000000000000000000000000000000000"

export function getToken(symb) {
    return TokenList.find((el) => el.symbol === symb)
}

export function useBalances(providerArg) {
    // I will return object that contains
    //      {
    //          "address": balance
    //      }

    const balances = ref({})
    const stepStore = useStepStore()
    const { connectedAccount, connectedWallet } = storeToRefs(stepStore)

    function updateBalance(newVal, oldVal) {
        // console.log(
        //     "old: ",
        //     oldVal.map((el) => el?.symbol || null)
        // )
        // console.log(
        //     "new: ",
        //     newVal.map((el) => el?.symbol || null)
        // )
    }

    async function getBalance(token) {
        const provider = new BrowserProvider(providerArg)
        const tokenContract = new Contract(token.address, TokenABI, provider)
        const balance = await tokenContract.balanceOf(connectedAccount.value)
        const formatedBalance = formatUnits(balance, token.decimals)
        return formatedBalance
    }

    async function getTotalSupply(address) {
        const provider = new BrowserProvider(providerArg)
        const tokenContract = new Contract(address, TokenABI, provider)
        const totalSupply = await tokenContract.totalSupply()
        const formatedTotalSupply = formatEther(totalSupply)
        return formatedTotalSupply
    }

    return { updateBalance, getBalance, getTotalSupply }
}

export function usePools(routerAddress) {
    const bidAsk = ref(null)
    const poolAddress = ref("")
    const baseTokenAddress = ref(null)
    const thisReserve = ref(null)
    const thatReserve = ref(null)
    const poolRatio = ref(null)
    const lpTokenAddress = ref(null)
    const liquidityTokenBalance = ref(null)
    const lpTotalSupply = ref(null)
    const interval = ref()
    const iterations = ref(0)
    const waitingForAdding = ref(false)
    const waitingBidAsk = ref(false)

    const bidAskFormat = computed(() => {
        return bidAsk.value !== null ? bidAsk.value.map((el) => formatEther(el)) : []
    })

    async function findPool(addressA, addressB, providerArg) {
        console.log("findPool")
        const provider = new BrowserProvider(providerArg)
        const router = new Contract(routerAddress, RouterABI, provider)
        const factoryAdd = await router.factory()
        const factory = new Contract(factoryAdd, FactoryABI, provider)
        const poolAdd = await factory.getPool(addressA, addressB)

        poolAddress.value = poolAdd
        return poolAdd
    }

    async function setupPool(poolAdd, tokenAddresses, providerArg) {
        console.log("setup")

        const provider = new BrowserProvider(providerArg)
        const router = new Contract(routerAddress, RouterABI, provider)

        const factoryAddress = await router.factory()
        const factory = new Contract(factoryAddress, FactoryABI, provider)

        const pool = new Contract(poolAdd, PoolABI, provider)

        // BID_ASK
        const bidAskVar = await router.getBidAsk(...tokenAddresses)
        bidAsk.value = bidAskVar

        // BASE TOKEN
        const thisToken = await pool.thisToken()
        baseTokenAddress.value = thisToken

        // RESERVES & RATIO
        const thisAmount = formatEther(await pool.thisRegisteredBalance())
        const thatAmount = formatEther(await pool.thatRegisteredBalance())

        thisReserve.value = Number(thisAmount)
        thatReserve.value = Number(thatAmount)

        poolRatio.value = Number(thatAmount) / Number(thisAmount)

        // LIQUIDITY TOKEN
        const lpToken = await pool.lpToken()
        lpTokenAddress.value = lpToken

        // LQ TOKEN BALANCE
        const { getBalance, getTotalSupply } = useBalances(providerArg)
        const bal = await getBalance({ address: lpToken, decimals: 18 })
        liquidityTokenBalance.value = bal

        // LQ TOKEN SUPPLY
        lpTotalSupply.value = await getTotalSupply(lpToken)
    }

    const poolShare = computed(() => {
        return liquidityTokenBalance.value && lpTotalSupply.value
            ? (Number(liquidityTokenBalance.value) / Number(lpTotalSupply.value)) * 100
            : null
    })

    async function getBidAsk(addressA, addressB, providerArg) {
        const provider = new BrowserProvider(providerArg)
        const router = new Contract(routerAddress, RouterABI, provider)
        await router
            .getBidAsk(addressA, addressB)
            .then((res) => {
                // console.log("found!", res)
                console.log("found!")
                bidAsk.value = [res[0], res[1]]
                findPool(addressA, addressB, providerArg)
                return res
            })
            .catch((err) => {
                // console.log("err is here ", err)

                resetPool()

                if (err.reason === "DEX__PoolNotFound()") {
                    console.log("not found", err)
                    return null
                }
            })
    }

    async function addLiquidity(addressA, addressB, amountA, amountB, slippage, deadline, recipient, providerArg) {
        const provider = new BrowserProvider(providerArg)
        const signer = await provider.getSigner()
        const router = new Contract(routerAddress, RouterABI, signer)
        // check allowance if its enought
        // do
        const parsedAmountA = parseEther(amountA)
        const parsedAmountB = parseEther(amountB)
        const parsedMinAmountA = parseEther(String(amountA - (amountA * slippage) / 100))
        const parsedMinAmountB = parseEther(String(amountB - (amountB * slippage) / 100))

        const blockTimestamp = (await provider.getBlock("latest")).timestamp
        const deadlineStamp = blockTimestamp + deadline * 60

        await router
            .addLiquidity(
                addressA,
                addressB,
                parsedMinAmountA,
                parsedAmountA,
                parsedMinAmountB,
                parsedAmountB,
                recipient,
                deadlineStamp
            )
            .then(async (res) => {
                //listen for liquidity change
                // setPoolCreationListener(addressA, addressB, providerArg)
            })
            .catch((err) => {
                console.log(" - pool - couldnt create pool - ")
                console.log(err)
            })
    }

    let currentFactoryContract = null
    async function setPoolCreationListener(providerArg) {
        if (providerArg === false) {
            if (currentFactoryContract) {
                console.log("FACTORY - turn off 'poolCreated'")
                currentFactoryContract.off("PoolCreated")
                currentFactoryContract = null
            }
            return
        }
        const provider = new BrowserProvider(providerArg)
        const router = new Contract(routerAddress, RouterABI, provider)
        const factoryAdd = await router.factory()
        const newFactoryContract = new Contract(factoryAdd, FactoryABI, provider)
        return new Promise((resolve, reject) => {
            if (currentFactoryContract) {
                console.log("FACTORY - removing 'poolCreated'")
                currentFactoryContract.off("PoolCreated", creationHandler)
            }

            console.log("FACTORY - listening for 'poolCreated'")
            newFactoryContract.on("PoolCreated", creationHandler)

            function creationHandler(thisToken, thatToken, newPoolAddress) {
                console.log("FACTORY - pool created:", newPoolAddress)

                newFactoryContract.off("PoolCreated", creationHandler)
                currentFactoryContract = null

                resolve([thisToken, thatToken, newPoolAddress])
            }
            currentFactoryContract = newFactoryContract
        })
    }

    let currentPoolContracts = []
    function setLiquidityChangeListener(providerArg, poolAdd = false) {
        if (providerArg === false) {
            console.log("POOL - turn off all listeners")
            currentPoolContracts.forEach((el) => el.off("LiquidityChange"))
            currentPoolContracts = []
            return
        }
        const provider = new BrowserProvider(providerArg)
        const addressToContract = !poolAdd ? poolAddress.value : poolAdd
        const newPoolContract = new Contract(addressToContract, PoolABI, provider)
        const currentPoolMap = currentPoolContracts.map((el) => el && el.target)

        return new Promise((resolve, reject) => {
            if (currentPoolMap.includes(newPoolContract.target)) {
                console.log("POOL - pool already listening")
                return
            }

            console.log("POOL - listening for 'liquidityChange'")
            newPoolContract.on("LiquidityChange", liquidityHandler)
            currentPoolContracts.push(newPoolContract)

            function liquidityHandler(beneficiary, thisIn, thatIn, thisOut, thatOut, contract) {
                const poolAdd = contract.emitter.target
                console.log("POOL - liqudity changed in: ", poolAdd)

                newPoolContract.off("LiquidityChange", liquidityHandler)
                currentPoolContracts = currentPoolContracts.filter((el) => el.target !== newPoolContract.target)

                resolve([beneficiary, thisIn, thatIn, thisOut, thatOut, poolAdd])
            }
        })
    }

    async function checkAllowance(tokenAddress, owner, spender, providerArg) {
        try {
            const provider = new BrowserProvider(providerArg)
            const token = new Contract(tokenAddress, TokenABI, provider)
            const allowance = await token.allowance(owner, spender)
            return allowance
        } catch (err) {
            return err
        }
    }

    function resetPool() {
        bidAsk.value = null
        baseTokenAddress.value = ""
        thisReserve.value = null
        thatReserve.value = null
        poolRatio.value = null
        lpTokenAddress.value = null
        liquidityTokenBalance.value = null
        lpTotalSupply.value = null
    }

    async function redeemLiquidity(tokenA, tokenB, redeemPercent, connectedAccount, providerArg) {
        await setupPool(poolAddress.value, [tokenA, tokenB], providerArg)
        if (poolShare.value) {
            try {
                const provider = new BrowserProvider(providerArg)
                const signer = await provider.getSigner()
                const router = new Contract(routerAddress, RouterABI, signer)

                const tokenList = [tokenA, tokenB]
                const orderedTokens = tokenA === baseTokenAddress.value ? tokenList : tokenList.reverse()

                const amount0 = parseEther(String((thisReserve.value * poolShare.value * redeemPercent) / 10000))
                const amount1 = parseEther(String((thatReserve.value * poolShare.value * redeemPercent) / 10000))
                const lqAmount = parseEther(String((liquidityTokenBalance.value * redeemPercent) / 100))
                const blockTimestamp = (await provider.getBlock("latest")).timestamp
                const deadline = blockTimestamp + 360

                await approveSpending(lpTokenAddress.value, providerArg, lqAmount).then(() => {
                    router.redeemLiquidity(...orderedTokens, amount0, amount1, lqAmount, connectedAccount, deadline)
                })
            } catch (err) {
                console.log("failed to redeem liquidity: ", err)
            }
        }
    }

    // async function approveSpending(tokenAddress, provider) {
    async function approveSpending(tokenAddress, providerArg, amount, callback = false) {
        const provider = new BrowserProvider(providerArg)
        const signer = await provider.getSigner()
        const erc20 = new Contract(tokenAddress, TokenABI, signer)
        const maxUint = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        const quantity = amount === 0 ? maxUint : amount
        const tx = await erc20.approve(routerAddress, quantity)
        await tx.wait(1)
        return await listenForTransactionMine(tx, provider, callback)
    }
    function listenForTransactionMine(txRes, provider, callback = false) {
        console.log(`Mining ${txRes.hash}...`)
        return new Promise((resolve, reject) => {
            provider.once(txRes.hash, async (txReciept) => {
                if (callback !== false) {
                    callback()
                }
                resolve()
                console.log("Done!")
            })
        })
    }

    return {
        bidAsk,
        getBidAsk,
        poolAddress,
        thisReserve,
        thatReserve,
        baseTokenAddress,
        poolRatio,
        findPool,
        poolShare,
        setupPool,
        checkAllowance,
        lpTotalSupply,
        liquidityTokenBalance,
        redeemLiquidity,
        bidAskFormat,
        addLiquidity,
        waitingForAdding,
        approveSpending,
        iterations,
        resetPool,
        redeemLiquidity,
        setPoolCreationListener,
        setLiquidityChangeListener,
    }
}
