
import { CHAINS } from '../config/networks';

interface WalletContextType {
    account:string | null;
    chainId:number | null;
    connectWallet:()=>Promise<void>;
    disconnectWallet:()=>void;
    switchNetwork:(network:keyof typeof CHAINS)=>Promise<void>;
}