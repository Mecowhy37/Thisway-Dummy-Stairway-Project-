export function useTokens() {
    const Tokens = ref([null, null])
    const selectTokenIndex = ref(0)

    const bothTokensThere = computed(() => Tokens.value.every((el) => el !== null))

    function setToken(token, reverseBalances = false) {
        if (token) {
            const sameTokenIndex = Tokens.value.findIndex((el) => el?.address === token.address)
            if (sameTokenIndex !== -1 && sameTokenIndex !== selectTokenIndex.value) {
                reverseTokens()
                if (typeof reverseBalances === "function") {
                    // reverseBalances()
                }
                return
            }
        }
        Tokens.value = Tokens.value.map((el, index) => (index === selectTokenIndex.value ? token : el))
    }
    function reverseTokens() {
        Tokens.value = Tokens.value.reverse()
    }

    return {
        Tokens,
        bothTokensThere,
        setToken,
        selectTokenIndex,
    }
}