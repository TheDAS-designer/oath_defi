import { useState, useEffect } from 'react';
import { OathContract } from '@/lib/aptos';
import { CreateOathArgs, StakeCollateralArgs } from '@/types/aptos';
import { Account } from '@aptos-labs/ts-sdk';

export const useAptos = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const createOath = async (account: Account, args: CreateOathArgs) => {
    setIsLoading(true);
    setError(null);
    setTransactionHash(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.createOath(account, args);
      setTransactionHash(result.hash);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const stakeCollateral = async (account: any, args: StakeCollateralArgs) => {
    setIsLoading(true);
    setError(null);
    setTransactionHash(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.stakeCollateral(account, args);
      setTransactionHash(result.hash);
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

  // getAllOaths
  const getAllOaths = async (ownerAddress: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.getAllOaths(ownerAddress);
      return result;
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }



  const completeOath = async (account: any, oathId: number, completionTime: number) => {
    setIsLoading(true);
    setError(null);
    setTransactionHash(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const result = await oathContract.completeOathAndMintSBT(account, oathId, completionTime);
      setTransactionHash(result.hash);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountBalance = async (address: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const oathContract = OathContract.getInstance();
      const balance = await oathContract.getAccountBalance(address);
      return balance;
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
    transactionHash,
    createOath,
    stakeCollateral,
    getOath,
    getAllOaths,
    completeOath,
    getAccountBalance,
    clearError: () => setError(null),
    clearTransactionHash: () => setTransactionHash(null)
  };
}; 