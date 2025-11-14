
import React from 'react';
import { CHAINS } from '../config/networks';

interface WalletContextType {
    account:string | null;
    chainId:number | null;
    connectWallet:()=>Promise<void>;
    disconnectWallet:()=>void;
    switchNetwork:(network:keyof typeof CHAINS)=>Promise<void>;
}

const WalletContext = React.createContext<WalletContextType | undefined>(undefined);
         

export default function WalletProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const {account,setAccount} = React.useState<string | null>(null);
  const {chainId,setChainId} = React.useState<number | null>(null);
  const {provider,setProvider} = React.useState<any>(null);

  const connectWallet = async () => {
    if(!window.ethereum){
      alert("Please install MetaMask to use this feature.");
      return;
    }
    try{
      const account = await window.ethereum.request({method:"eth_requsestAccounts"});
      setAccount(account[0]);
      const chain= await window.ethereum.request({method:"eth_chainId"});
      setChainId(parseInt(chain,16));
    }catch(error){
      console.error("Error connecting wallet:",error);
    }
  }

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
  }

  const switchNetwork = async (network:keyof typeof CHAINS) => {
    if(!window.ethereum) return;

    const params = CHAINS[network];

    if(!CHAINS[network]) {
      alert("Network not supported");
      return;
    }
    try{
      window.ethereum.request({method:"wallet_switchEthereumChain",params:[params]});
      setChainId(params.chainId);
    }catch(error){
      console.error("Error switching network:",error);
    }
  } 

  const walletContextValue:WalletContextType ={account,chainId,connectWallet,disconnectWallet,switchNetwork}

  return (
    <WalletContext.Provider value={walletContextValue}>
      {children}
    </WalletContext.Provider>
  );
}