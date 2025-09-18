import { useState, useEffect } from 'react';
import { OathContract } from '@/lib/aptos';
import { CreateOathArgs } from '@/types/aptos';

export const useAptos = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOath = async (account: any, args: CreateOathArgs) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.createOath(account, args);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getOath = async (creatorAddress: string, oathId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.getOath({ creator_address: creatorAddress, oath_id: oathId });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOath = async (account: any, oathId: number, completionTime: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.completeOathAndMintSBT(account, oathId, completionTime);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createOath,
    getOath,
    completeOath,
    clearError: () => setError(null)
  };
}; 