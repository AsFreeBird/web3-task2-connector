# 📘 任务 2：DIY 钱包连接组件（Next.js 版）

## 🎯 任务目标

封装一个可复用的钱包连接组件，实现多钱包、多网络的连接与切换功能。

### 主要目标：
1. 掌握 React / Next.js 中 Web3 交互模式  
2. 实现多网络配置切换功能  
3. 支持主流钱包（MetaMask、WalletConnect 等）  
4. 封装 Context，全局管理钱包状态  
5. 实现响应式监听账户与网络变化  

---

## 🧩 一、项目初始化

### 1. 创建 Next.js 项目

```bash
npx create-next-app@latest diy-wallet-connector
cd diy-wallet-connector
```

### 2. 安装必要依赖

```bash
npm install ethers wagmi viem @rainbow-me/rainbowkit
```

> 💡 **wagmi + RainbowKit** 可快速集成多钱包支持，内部实现了 EIP-1193 标准。

### 3. 清理项目结构

保留主要文件：
```
my-app/
├─ app/                  # App Router 根目录（Next.js 13+ 默认）
│   ├─ layout.tsx        # 全局布局文件
│   ├─ page.tsx          # 首页路由
│   └─ api/              # API 路由目录 (可选)
├─ components/           # React 组件
│   └─ WalletConnector.tsx
├─ context/              # Context 或 Provider
│   └─ WalletContext.tsx
├─ config/               # 配置文件
│   └─ networks.ts
├─ public/               # 公共静态资源（图片、favicon 等）
├─ styles/               # 全局样式文件
│   └─ globals.css
├─ node_modules/
├─ package.json
├─ next.config.js        # Next.js 配置文件
└─ tsconfig.json

```

---

## ⚙️ 二、网络配置设计

### 1. config/networks.ts

```ts
export const CHAINS = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com/'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://polygonscan.com/'],
  },
};
```

---

## 🧠 三、Context 封装（WalletContext）

> 使用 React Context 管理钱包全局状态，方便在各页面共享。

### context/WalletContext.tsx

```tsx
'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { CHAINS } from '@/config/networks';

interface WalletContextType {
  account: string | null;
  chainId: string | null;
  connectWallet: () => Promise<void>;
  switchNetwork: (network: keyof typeof CHAINS) => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      const chain = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(chain);
      setProvider(new ethers.BrowserProvider(window.ethereum));
    } catch (err) {
      console.error(err);
    }
  };

  const switchNetwork = async (network: keyof typeof CHAINS) => {
    const params = CHAINS[network];
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      });
      setChainId(params.chainId);
    } catch (error) {
      console.error('切换网络失败', error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
  };

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on('accountsChanged', (accounts: string[]) => setAccount(accounts[0] || null));
    window.ethereum.on('chainChanged', (id: string) => setChainId(id));
  }, []);

  return (
    <WalletContext.Provider value={{ account, chainId, connectWallet, switchNetwork, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet 必须在 WalletProvider 中使用');
  return ctx;
};
```

---

## 🧩 四、组件封装（WalletConnector）

### components/WalletConnector.tsx

```tsx
'use client';
import React from 'react';
import { useWallet } from '@/context/WalletContext';

const WalletConnector = () => {
  const { account, connectWallet, switchNetwork, disconnectWallet } = useWallet();

  return (
    <div className="p-4 border rounded-xl shadow-md w-fit">
      {account ? (
        <>
          <p className="text-sm mb-2">当前账户：{account}</p>
          <div className="flex gap-2">
            <button
              onClick={() => switchNetwork('sepolia')}
              className="px-3 py-1 rounded bg-blue-500 text-white"
            >
              切换到 Sepolia
            </button>
            <button
              onClick={() => switchNetwork('polygon')}
              className="px-3 py-1 rounded bg-purple-500 text-white"
            >
              切换到 Polygon
            </button>
            <button
              onClick={disconnectWallet}
              className="px-3 py-1 rounded bg-red-500 text-white"
            >
              断开连接
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 rounded bg-green-600 text-white"
        >
          连接钱包
        </button>
      )}
    </div>
  );
};

export default WalletConnector;
```

---

## 🧭 五、在 Next.js 中使用 Context

### app/layout.tsx

```tsx
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
```

### app/page.tsx

```tsx
'use client';
import WalletConnector from '@/components/WalletConnector';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <WalletConnector />
    </main>
  );
}
```

---

## 📎 附录

### 参考文档

- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [wagmi.sh 官方文档](https://wagmi.sh/)
- [RainbowKit 官方文档](https://www.rainbowkit.com/)
- [MetaMask API 参考](https://docs.metamask.io/)
- [Next.js 官方文档](https://nextjs.org/docs)

---
📅 **输出版本**：v1.0  
🧑‍💻 作者：吴姓项目开发计划  
🕐 更新时间：2025-11-13
