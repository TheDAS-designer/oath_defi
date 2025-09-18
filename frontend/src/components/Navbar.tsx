'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Wallet, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { wallet, isConnecting, connectWallet, disconnectWallet, formatAddress, isConnected } = useWallet();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Explore Oaths', href: '/oaths' },
    { name: 'Vaults', href: '/vaults' },
  ];

  const createItems = [
    { name: 'Create Oath', href: '/create' },
    { name: 'Create Vault', href: '/vaults/create' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="gradient-bg p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OATH</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Create Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center space-x-1">
                <span>Create</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {createItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected && wallet ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatAddress(wallet.address)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {wallet.balance.toFixed(2)} APT
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn-secondary text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Create Items in Mobile */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                {createItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 