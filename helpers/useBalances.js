import { formatUnits } from "ethers"
import { isSupportedChain, tkEnum, getUrl, roundFloor } from "~/helpers/index"

export function useBalances(Tokens, connectedAccount, connectedChainId) {
    const balanceState = reactive({
        quote: 0n,
        base: 0n,
    })
    const Balances = computed({
        get() {
            return [balanceState.quote, balanceState.base]
        },
        set(newVal) {
            balanceState.quote = newVal[0]
            balanceState.base = newVal[1]
        },
    })
    const formatedBalances = computed(() => {
        return Balances.value.map((bal, idx) => {
            const token = Tokens.value[idx]
            // if (!token || !connectedAccount.value) {
            if (!token) {
                return ""
            } else {
                return roundFloor(formatUnits(bal, token.decimals))
            }
        })
    })

    async function getTokenBalance(tokenIndex, clearOld, isCalledOver = false) {
        const stateKey = Object.keys(balanceState)[tokenIndex]

        // if (!connectedAccount.value || !isSupportedChain(connectedChainId.value)) {
        //     balanceState[stateKey] = 0n
        //     return
        // }

        const token = Tokens.value[tokenIndex]
        if (token === null) {
            // balanceState[stateKey] = 0n
            // setTimeout(() => {
            //     if (!isCalledOver) {
            //         getTokenBalance(tokenIndex, clearOld, true)
            //     }
            // }, 2000)
            return
        }
        if (clearOld) {
            balanceState[stateKey] = 0n
        }

        // if (balance.value) {
        //     // console.log("got", stateKey, "balance", balance.value)
        //     balanceState[stateKey] = BigInt(balance.value)
        //     return
        // }
        // if (error.value) {
        //     // console.error("failed to fetch", stateKey, "balance", error.value)
        //     balanceState[stateKey] = 0n
        //     return
        // }
        // console.log("nothing returned")

        if (token.symbol === "Green Cash") {
            balanceState[stateKey] = 235899125000000000000n
        } else if (token.symbol === "Silver Change") {
            balanceState[stateKey] = 78923643000000000000n
        } else {
            balanceState[stateKey] = 37502770000000000000000n
        }
    }

    async function getBothBalances(tokenIndex = false, clearOld = true) {
        // console.log("- - - - - - - - - - -")
        // console.log("getBothBalances(), tokenIndex", tokenIndex)

        if (tokenIndex === false || tokenIndex === tkEnum.QUOTE) {
            getTokenBalance(tkEnum.QUOTE, clearOld)
        }
        if (tokenIndex === false || tokenIndex === tkEnum.BASE) {
            getTokenBalance(tkEnum.BASE, clearOld)
        }
    }

    function findNewIndexes(oldTokens, newTokens) {
        const oldSet = new Set(oldTokens)
        const newIndexes = []

        newTokens.forEach((token, index) => {
            if (token !== null && !oldSet.has(token)) {
                newIndexes.push(index)
            }
        })

        return newIndexes
    }
    function reverseBalances() {
        Balances.value = Balances.value.reverse()
    }

    watch(
        [connectedAccount, connectedChainId],
        ([wallet, chain]) => {
            if (wallet && isSupportedChain(chain)) {
                getBothBalances(false, false)
            } else {
                // console.log("reset balances")
                Balances.value = [0n, 0n]
            }
        },
        {
            immediate: true,
        }
    )

    watchEffect(() => {
        getBothBalances(Tokens.value.indexOf(Tokens.value[tkEnum.QUOTE]), false)
    })
    watchEffect(() => {
        getBothBalances(Tokens.value.indexOf(Tokens.value[tkEnum.BASE]), false)
    })
    watch(
        Tokens,
        (newTokens, oldValues) => {
            // // console.log("newTokens:", newTokens)
            const oldTokens = oldValues ? oldValues : [null, null]

            const newIndexes = findNewIndexes(oldTokens, newTokens)
            // // console.log("newIndexes:", newIndexes)
            newIndexes.forEach((index) => {
                getBothBalances(index, true)
            })
        },
        {
            immediate: true,
        }
    )

    return { Balances, formatedBalances, getTokenBalance, getBothBalances, reverseBalances }
}
