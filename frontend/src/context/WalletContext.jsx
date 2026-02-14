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
