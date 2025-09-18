import { useState, useEffect } from 'react';
import { AptosWalletInfo } from '@/types/aptos';
import { OathContract } from '@/lib/aptos';

export const useWallet = () => {
  const [wallet, setWallet] = useState<AptosWalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // For demo purposes, we'll simulate wallet connection
      // In real implementation, you would use @aptos-labs/wallet-adapter-react
      if (typeof window !== 'undefined' && (window as any).aptos) {
        const response = await (window as any).aptos.connect();
        
        if (response.address) {
          const oathContract = OathContract.getInstance();
          const balance = await oathContract.getAccountBalance(response.address);
          
          const walletInfo: AptosWalletInfo = {
            address: response.address,
            balance,
            network: 'testnet',
            publicKey: response.publicKey || ''
          };
          
          setWallet(walletInfo);
          localStorage.setItem('wallet', JSON.stringify(walletInfo));
        }
      } else {
        // Simulate wallet connection for demo
        const mockWallet: AptosWalletInfo = {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          balance: 156.78,
          network: 'testnet',
          publicKey: '0xpublickey123'
        };
        setWallet(mockWallet);
        localStorage.setItem('wallet', JSON.stringify(mockWallet));
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem('wallet');
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Try to restore wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet);
        setWallet(parsedWallet);
      } catch (err) {
        console.error('Failed to parse saved wallet:', err);
        localStorage.removeItem('wallet');
      }
    }
  }, []);

  return {
    wallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isConnected: !!wallet
  };
}; 