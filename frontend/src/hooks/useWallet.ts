import { useState, useEffect } from 'react';
import { AptosWalletInfo } from '@/types/aptos';

export const useWallet = () => {
  const [wallet, setWallet] = useState<AptosWalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // 检查是否有 Petra 钱包
      if (typeof window !== 'undefined' && (window as any).aptos) {
        console.log('Petra wallet detected, attempting to connect...');
        
        const response = await (window as any).aptos.connect();
        console.log('Connection response:', response);
        
        if (response.address) {
          const walletInfo: AptosWalletInfo = {
            address: response.address,
            balance: 0, // 稍后异步获取
            network: 'testnet',
            publicKey: response.publicKey || ''
          };
          
          setWallet(walletInfo);
          localStorage.setItem('wallet', JSON.stringify(walletInfo));
          console.log('Wallet connected successfully:', walletInfo);
        }
      } else {
        throw new Error('Petra wallet not detected. Please install Petra wallet.');
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).aptos) {
        await (window as any).aptos.disconnect();
      }
      setWallet(null);
      setError(null);
      localStorage.removeItem('wallet');
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

  const signAndSubmitTransaction = async (payload: any) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    if (typeof window !== 'undefined' && (window as any).aptos) {
      console.log('Submitting transaction through Petra wallet:', payload);
      
      try {
        const result = await (window as any).aptos.signAndSubmitTransaction(payload);
        console.log('Transaction result:', result);
        return result;
      } catch (err) {
        console.error('Transaction failed:', err);
        throw err;
      }
    } else {
      throw new Error('Petra wallet not available');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 检查是否已连接钱包
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).aptos) {
        try {
          const isConnected = await (window as any).aptos.isConnected();
          if (isConnected) {
            const account = await (window as any).aptos.account();
            if (account) {
              const walletInfo: AptosWalletInfo = {
                address: account.address,
                balance: 0,
                network: 'testnet',
                publicKey: account.publicKey || ''
              };
              setWallet(walletInfo);
            }
          }
        } catch (err) {
          console.warn('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    wallet,
    isConnected: !!wallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress,
    signAndSubmitTransaction,
  };
}; 