import { useWallet } from "../context/WalletContext";

export default function WalletConnect() {
    const { account, chainId, connect, disconnect } = useWallet();

    if (!account) {
        return (
            <button
                onClick={connect}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                   bg-gradient-to-r from-indigo-500 to-cyan-500 text-white
                   hover:from-indigo-400 hover:to-cyan-400 transition-all duration-300
                   shadow-lg shadow-indigo-500/25 cursor-pointer text-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                </svg>
                Connect Wallet
            </button>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                {chainId && (
                    <span className="text-xs text-slate-500">#{chainId}</span>
                )}
            </div>
            <button
                onClick={disconnect}
                className="px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10
                   border border-red-500/20 transition-colors cursor-pointer"
            >
                ✕
            </button>
        </div>
    );
}
