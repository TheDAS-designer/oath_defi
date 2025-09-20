import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { useAptos } from './useAptos';
import { Oath } from '@/types/oath';
import { mockOaths } from '@/lib/mockData';

export const useOathData = () => {
  const [oaths, setOaths] = useState<Oath[]>(mockOaths);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wallet, isConnected } = useWallet();
  const { getAllOaths } = useAptos();

  const fetchRealOaths = useCallback(async () => {
    if (!isConnected || !wallet?.address) {
      return mockOaths;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 获取链上真实数据
      const realOathsData = await getAllOaths(wallet.address);
      console.log("realOathsData", realOathsData);

      // 处理嵌套数组结构 - 提取实际的oath数组
      const realOaths = Array.isArray(realOathsData) && realOathsData.length > 0 && Array.isArray(realOathsData[0]) 
        ? realOathsData[0] 
        : realOathsData;

      console.log("extracted realOaths", realOaths);

      // Transform real oath data to match our frontend types  
      const transformedOaths: Oath[] = realOaths?.map((realOath: any, index: number) => {
        // 确保ID的唯一性
        const originalId = realOath.id?.toString() || realOath.oath_id?.toString();
        const uniqueId = originalId ? `${originalId}_${index}` : `real_${Math.random().toString(36).substr(2, 9)}_${index}`;
        
        console.log(`Oath ${index}: originalId=${originalId}, uniqueId=${uniqueId}`);
        
        return {
          id: uniqueId,
          creator: realOath.creator_address || realOath.creator || wallet.address,
          content: realOath.content || realOath.oath_content || 'Real oath from blockchain',
          category: realOath.category || 'On-chain',
          stableCollateral: realOath.collateral_amount || realOath.stable_collateral || 0,
          startTime: realOath.start_time ? Number(realOath.start_time) * 1000 : Date.now(),
          endTime: realOath.end_time ? Number(realOath.end_time) * 1000 : Date.now() + 86400000 * 30,
          status: typeof realOath.status === 'number' ? 
            (realOath.status === 1 ? 'Active' : 'Pending') : 
            (realOath.status || 'Active'),
          referencedNFTs: realOath.referenced_nfts || [],
          evidence: realOath.evidence || '',
          isOverCollateralized: realOath.is_over_collateralized || false,
          targetAPY: realOath.target_apy || undefined,
          currentAPY: realOath.current_apy || undefined,
          vaultAddress: realOath.vault_address || undefined,
          collateralTokens: realOath.collateral_tokens || [
            {
              symbol: 'APT',
              amount: realOath.collateral_amount || realOath.stable_collateral || 0,
              address: '0x1::aptos_coin::AptosCoin',
              usdValue: (realOath.collateral_amount || realOath.stable_collateral || 0) * 8
            }
          ]
        };
      }) || [];

      console.log("transformedOaths", transformedOaths);

      // Combine real oaths with mock oaths, real oaths first
      const combinedOaths = [...transformedOaths, ...mockOaths];
      return combinedOaths;

    } catch (err) {
      console.error('Failed to fetch real oaths:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch oaths');
      return mockOaths; // Fallback to mock data
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, wallet?.address, getAllOaths]);

  useEffect(() => {
    const loadOaths = async () => {
      const combinedOaths = await fetchRealOaths();
      setOaths(combinedOaths);
    };

    loadOaths();
  }, [fetchRealOaths]);

  const refreshOaths = useCallback(async () => {
    console.log('Refreshing oaths...');
    const combinedOaths = await fetchRealOaths();
    setOaths(combinedOaths);
    console.log('Oaths refreshed');
  }, [fetchRealOaths]);

  const getOathById = (id: string): Oath | undefined => {
    return oaths.find(oath => oath.id === id);
  };

  return {
    oaths,
    isLoading,
    error,
    refreshOaths,
    getOathById,
    hasRealData: isConnected && wallet?.address && oaths.some(oath => oath.id.startsWith('real_')),
  };
}; 