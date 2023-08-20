import { ref } from "vue"
import { BrowserProvider, Contract, parseUnits, formatUnits, formatEther, parseEther } from "ethers"
import Web3 from "web3"

import router from "@/ABIs/IDEX.json"
const RouterABI = router.abi

import token from "@/ABIs/IERC20.json"
const TokenABI = token.abi

import poolmanager from "@/ABIs/IPoolManager.json"
const PoolManagerABI = poolmanager.abi

const unhandled = "0x0000000000000000000000000000000000000000"

export const tkEnum = {
    QUOTE: 0,
    BASE: 1,
}

export const precision = BigInt(10) ** BigInt(18)

export function getToken(symb) {
    return TokenList.find((el) => el.symbol === symb)
}

export function getUrl(endpoint) {
    const api = "https://api.stairway.fi"
    return api + endpoint
}
export function basicRound(amt) {
    let amount = Number(amt)
    amount = amount >= 1 ? amount.toFixed(2) : amount.toPrecision(2)
    return String(parseFloat(amount))
}

export function isSupportedChain(id) {
    return id === 31337 || id === 80001 || id === 137
}

export function listenForTransactionMine(txRes, provider, callback = null) {
    console.log(`Mining ${txRes.hash}...`)
    return new Promise((resolve, reject) => {
        provider.once(txRes.hash, async (txReciept) => {
            if (typeof callback === "function") {
                callback()
            }
            resolve()
            console.log("Done!")
        })
    })
}

export function usePools(routerAddress, Tokens, connectedAccount, connectedChainId) {
    const {
        data: pool,
        error: poolError,
        status: poolStatus,
        pending: poolPending,
        refresh: refreshPool,
    } = useAsyncData(
        "pool",
        () => {
            const bothThere = Tokens.value.every((el) => el !== null)

            if (bothThere && connectedAccount.value && isSupportedChain(connectedChainId.value)) {
                console.log("usePools - fetchingPool()")
                return $fetch(
                    getUrl(
                        `/chain/${connectedChainId.value}/pool/${Tokens.value[0].address}/${Tokens.value[1].address}`
                    )
                )
            }
        },
        {
            watch: [connectedChainId],
        }
    )

    // watch: [Tokens, connectedChainId],

    const poolRatio = computed(() => {
        if (!pool.value) {
            return null
        }

        return (BigInt(pool.value.base_reserves) * precision) / BigInt(pool.value.quote_reserves)
    })
    const price = computed(() => {
        if (!pool.value) {
            return null
        }
        return pool.value.price
    })
    const depth = computed(() => {
        if (!pool.value) {
            return null
        }
        return pool.value.depth
    })

    async function addLiquidity(
        tokenQuote,
        tokenBase,
        amountQuote,
        amountBase,
        slippage,
        deadline,
        recipient,
        providerArg
    ) {
        const provider = new BrowserProvider(providerArg)
        const signer = await provider.getSigner()
        const router = new Contract(routerAddress.value, RouterABI, signer)

        const parsedSlippage = (parseUnits(slippage.toString(), 18) / BigInt(100)).toString()
        const blockTimestamp = (await provider.getBlock("latest")).timestamp
        const deadlineStamp = blockTimestamp + deadline * 60

        try {
            const allowanceQuote = await checkAllowance(
                tokenQuote.address,
                signer.address,
                routerAddress.value,
                providerArg
            )
            const quoteNeedsApproval = allowanceQuote < amountQuote

            const allowanceBase = await checkAllowance(
                tokenBase.address,
                signer.address,
                routerAddress.value,
                providerArg
            )
            const baseNeedsApproval = allowanceBase < amountBase

            if (quoteNeedsApproval || baseNeedsApproval) {
                const approvalPromises = []

                if (quoteNeedsApproval) {
                    approvalPromises.unshift(approveSpending(tokenQuote.address, providerArg, 0))
                    // approvalPromises.unshift(approveSpending(addressA, providerArg, parsedAmountQuote))
                }

                if (baseNeedsApproval) {
                    approvalPromises.unshift(approveSpending(tokenBase.address, providerArg, 0))
                    // approvalPromises.unshift(approveSpending(addressB, providerArg, parsedAmountBase))
                }

                await Promise.all(approvalPromises)
            }
        } catch (error) {
            console.log("Failed to get approvals:", error)
        }
        try {
            console.log("VALUES")
            console.log("---------------------------------")
            console.log("tokenQuote.address:", Web3.utils.toChecksumAddress(tokenQuote.address))
            console.log("tokenBase.address:", Web3.utils.toChecksumAddress(tokenBase.address))
            console.log("amountQuote:", amountQuote.toString())
            console.log("amountBase:", amountBase.toString())
            console.log("parsedSlippage:", parsedSlippage)
            console.log("recipient:", recipient)
            console.log("deadlineStamp:", deadlineStamp)
            await router.addLiquidity(
                Web3.utils.toChecksumAddress(tokenQuote.address),
                Web3.utils.toChecksumAddress(tokenBase.address),
                amountQuote.toString(),
                amountBase.toString(),
                parsedSlippage,
                Web3.utils.toChecksumAddress(recipient),
                deadlineStamp
            )
        } catch (error) {
            console.log("Failed to add lq:", error)
        }
    }

    async function redeemLiquidity(
        tokenA,
        tokenB,
        pooledA,
        pooledB,
        redeemPercent,
        lpToken,
        lpAmount,
        deadline,
        providerArg
    ) {
        try {
            const provider = new BrowserProvider(providerArg)
            const signer = await provider.getSigner()
            const router = new Contract(routerAddress.value, RouterABI, signer)

            const tokenList = [tokenA, tokenB].map((el) => el.address)

            const amount0 = calcPercentage(pooledA)
            const amount1 = calcPercentage(pooledB)
            const lpAmountParsed = calcPercentage(lpAmount)

            function calcPercentage(amount) {
                // temporary fix - bad browser support
                return String((BigInt(amount) * BigInt(redeemPercent)) / BigInt(100))
            }

            const blockTimestamp = (await provider.getBlock("latest")).timestamp
            const deadlineStamp = blockTimestamp + deadline * 60

            const allowance = await checkAllowance(lpToken.address, signer.address, routerAddress.value, providerArg)
            const needApproval = allowance < lpAmountParsed
            if (needApproval) {
                await approveSpending(lpToken.address, providerArg, lpAmountParsed)
            }

            console.log("REDEEMING")
            console.log(tokenList)
            console.log(amount0)
            console.log(amount1)
            console.log(lpAmountParsed)
            console.log(connectedAccount.value)
            console.log(deadlineStamp)
            await router.redeemLiquidity(
                Web3.utils.toChecksumAddress(tokenList[0]),
                Web3.utils.toChecksumAddress(tokenList[1]),
                amount0,
                amount1,
                lpAmountParsed,
                Web3.utils.toChecksumAddress(connectedAccount.value),
                deadlineStamp,
                "100000000000000000"
            )
        } catch (err) {
            console.log("failed to redeem liquidity: ", err)
        }
    }

    async function swap(tokenA, tokenB, amounts, maxPrice, account, deadline, providerArg) {
        const provider = new BrowserProvider(providerArg)
        const signer = await provider.getSigner()
        const router = new Contract(routerAddress.value, RouterABI, signer)

        const tokenList = [tokenA, tokenB].map((el) => el.address).reverse()

        const blockTimestamp = (await provider.getBlock("latest")).timestamp
        const deadlineStamp = blockTimestamp + deadline * 60

        const allowance = await checkAllowance(tokenA.address, signer.address, routerAddress.value, providerArg)
        const needApproval = allowance < amounts[0]
        if (needApproval) {
            await approveSpending(tokenA.address, providerArg, amounts[0])
        }

        console.log(" - - - - -s w a p- - - - - - ")
        console.log("base token:", tokenList[0])
        console.log("qoute token:", tokenList[1])
        console.log("desired_base_amount:", amounts[1].toString())
        console.log("bid:", maxPrice)
        console.log("account:", account)
        console.log("deadlineStamp:", deadlineStamp)
        await router.buy(...tokenList, amounts[1].toString(), maxPrice, account, deadlineStamp)

        // "inputs": [
        //     {
        //         "internalType": "contract IERC20",
        //         "name": "baseToken",
        //         "type": "address"
        //     },
        //     {
        //         "internalType": "contract IERC20",
        //         "name": "quoteToken",
        //         "type": "address"
        //     },
        //     {
        //         "internalType": "uint256",
        //         "name": "desiredAmount",
        //         "type": "uint256"
        //     },
        //     {
        //         "internalType": "uint256",
        //         "name": "maxPrice",
        //         "type": "uint256"
        //     },
        //     {
        //         "internalType": "address",
        //         "name": "recipient",
        //         "type": "address"
        //     },
        //     {
        //         "internalType": "uint256",
        //         "name": "deadline",
        //         "type": "uint256"
        //     }
        // ]
    }

    async function approveSpending(tokenAddress, providerArg, amount, callback = false) {
        const provider = new BrowserProvider(providerArg)
        const signer = await provider.getSigner()
        const erc20 = new Contract(tokenAddress, TokenABI, signer)
        const maxUint = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        const quantity = amount === 0 ? maxUint : amount
        const tx = await erc20.approve(routerAddress.value, quantity)
        await tx.wait(1)
        return await listenForTransactionMine(tx, provider, callback)
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

    return {
        pool,
        poolError,
        poolStatus,
        poolPending,
        poolRatio,
        refreshPool,
        price,
        depth,
        addLiquidity,
        redeemLiquidity,
        swap,

        // approveSpending,
        // listenForTransactionMine,
        // checkAllowance,
    }
}

export function useTokens() {
    const tokenA = ref(null)
    const tokenB = ref(null)
    const selectTokenIndex = ref(0)

    const Tokens = computed({
        get() {
            return [tokenA.value, tokenB.value]
        },
        set(newValue) {
            tokenA.value = newValue[0]
            tokenB.value = newValue[1]
        },
    })

    const bothTokensThere = computed(() => Tokens.value.every((el) => el !== null))

    function setToken(token) {
        if (token) {
            const sameTokenIndex = Tokens.value.findIndex((el) => el?.address === token.address)
            if (sameTokenIndex !== -1 && sameTokenIndex !== selectTokenIndex.value) {
                Tokens.value = Tokens.value.reverse()
                return
            }
        }
        Tokens.value = Tokens.value.map((el, index) => (index === selectTokenIndex.value ? token : el))
    }

    return {
        tokenA,
        tokenB,
        Tokens,
        bothTokensThere,
        setToken,
        selectTokenIndex,
    }
}

export function useBalances() {
    async function getTokenBalance(token, account, connectedChainId) {
        if (token === null) {
            return ""
        }
        const { data: balance, error } = await useFetch(
            getUrl(`/chain/${connectedChainId}/user/${account}/balance/${token.address}`)
        )
        if (balance.value) {
            return formatUnits(balance.value, token.decimals)
        }
        if (error.value) {
            console.error("failed to fetch balance", error.value)
            return ""
        }
    }

    return { getTokenBalance }
}

export function useInputs(Tokens) {
    function cleanInput(value, oldValue) {
        // Remove spaces from the input value
        value = value.replace(/\s/g, "")

        // Replace any non-digit, non-dot, non-comma characters with an empty string
        value = value.replace(/[^\d.,]/g, "")

        // Replace commas with dots to handle decimal numbers
        value = value.replace(/,/g, ".")

        let dotCount = value.split(".").length - 1
        // if (dotCount === 2) {

        //bounds for ethers library not to over/under-flow, 2**53 its max uit53 value that JS accepts
        if (dotCount === 2 || value >= 2 ** 53 || (value > 0 && value < 1e-18)) {
            value = oldValue
        }
        // const decimalParts = value.split(".")
        // if (decimalParts.length === 2 && decimalParts[1].length > 18) {
        //     value = oldValue // revert to old value if it has more than 18 decimal points
        // }
        return value
    }
    function isCleanInput(value) {
        // Match any character that's not a digit, dot, or comma, or more than one dot
        if (value.match(/[^\d.,]/) || (value.match(/\./g) || []).length > 1 || value === ".") {
            return false
        }
        return true
    }
    function prettyPrint(amount, tkIndex) {
        if (Tokens.value[tkIndex] === null) {
            return amount
        }
        if (amount === "") {
            return ""
        }
        const decimals =
            tkIndex === tkEnum.BASE ? Tokens.value[tkEnum.BASE].decimals : Tokens.value[tkEnum.QUOTE].decimals

        const fullResult = formatUnits(amount.toString(), decimals)

        if (tkIndex === tkEnum.QUOTE) {
            return roundCeiling(fullResult)
        } else if (tkIndex === tkEnum.BASE) {
            return roundFloor(fullResult)
        }
    }
    function roundCeiling(stringAmount) {
        return parseFloat(parseFloat(stringAmount).toPrecision(5)).toString()
    }
    function roundFloor(stringAmount) {
        return parseFloat(toFixedFloor(stringAmount, 4)).toString()
    }
    function toFixedFloor(stringAmount, fixed) {
        let re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?")
        return stringAmount.match(re)[0]
    }
    return {
        cleanInput,
        isCleanInput,
        prettyPrint,
        roundCeiling,
        roundFloor,
    }
}
