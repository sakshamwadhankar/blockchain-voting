import { createContext, useContext, useState, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import { GOVERNANCE_ADDRESS, GOVERNANCE_ABI } from "../config/contracts";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [governance, setGovernance] = useState(null);
    const [chainId, setChainId] = useState(null);

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }
        try {
            const bp = new BrowserProvider(window.ethereum);
            const accounts = await bp.send("eth_requestAccounts", []);
            const s = await bp.getSigner();
            const network = await bp.getNetwork();
            console.log("Detected Chain ID:", network.chainId);
            // Allow 31337 (Hardhat default) or 1337 (Ganache/Common Localhost) or 80002 (Amoy)
            if (network.chainId !== 31337n && network.chainId !== 1337n && network.chainId !== 80002n) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7a69' }], // 31337
                    });
                    // Retry verify after switch (or let user click again if page reloads)
                    return;
                } catch (switchError) {
                    // If chain not found (4902), try adding it
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x7a69',
                                    chainName: 'Localhost 8545',
                                    rpcUrls: ['http://127.0.0.1:8545'],
                                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
                                }],
                            });
                            return;
                        } catch (addError) {
                            console.error(addError);
                        }
                    }
                    alert(`Wrong Network! Chain ID: ${network.chainId}. Please switch to Localhost 8545 (31337).`);
                    return;
                }
            }
            const gov = new Contract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, s);
            setAccount(accounts[0]);
            setProvider(bp);
            setSigner(s);
            setGovernance(gov);
            setChainId(Number(network.chainId));
        } catch (err) {
            console.error("Wallet connect failed:", err);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setGovernance(null);
        setChainId(null);
    }, []);

    return (
        <WalletContext.Provider
            value={{ account, provider, signer, governance, chainId, connect, disconnect }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);
