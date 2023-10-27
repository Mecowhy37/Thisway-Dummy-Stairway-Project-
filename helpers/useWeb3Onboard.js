import { init, useOnboard } from "@web3-onboard/vue"

import injectedModule, { ProviderLabel } from "@web3-onboard/injected-wallets"
import ledgerModule from "@web3-onboard/ledger"
// import walletConnectModule from '@web3-onboard/walletconnect'
import gnosisModule from "@web3-onboard/gnosis"
const gnosis = gnosisModule()
// const gnosis = gnosisModule({
//     whitelistedDomains: [regex, localhostRegex]
// })

// const walletConnect = walletConnectModule({
//     projectId: 'Stairway',
//     requiredChains: [137, 80001],
//     dappUrl: 'https://app.stairway.fi/'
// })

const ledger = ledgerModule({
    projectId: "Stairway",
    requiredChains: [137, 80001],
    walletConnectVersion: 2,
})

export async function useWeb3Onboard(initOptions) {
    const injected = injectedModule({
        displayUnavailable: [ProviderLabel.MetaMask, ProviderLabel.Coinbase],
    })

    init({
        wallets: [injected, ledger, gnosis],
        // wallets: [injected, ledger, walletConnect, gnosis],
        chains: initOptions.value,
        accountCenter: {
            desktop: {
                enabled: false,
            },
            mobile: {
                enabled: false,
            },
        },
        connect: {
            autoConnectLastWallet: true,
        },
    })

    const {
        wallets,
        connectWallet,
        connectedChain,
        setChain,
        disconnectConnectedWallet,
        connectedWallet,
        alreadyConnectedWallets,
    } = useOnboard()

    return {
        onboard: {
            wallets,
            connectWallet,
            connectedChain,
            setChain,
            disconnectConnectedWallet,
            connectedWallet,
            alreadyConnectedWallets,
        },
    }
}