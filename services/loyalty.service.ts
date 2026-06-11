import { apiClient } from '@/services/api/client';

export interface LoyaltyAccount {
  id: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS' | 'REFERRAL' | 'ADJUSTED';
  points: number;
  description: string;
  createdAt: string;
}

export interface LoyaltyRules {
  pointsPerRupee: number;
  rupeePerPoint: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  referralBonus: number;
  referredBonus: number;
}

export const getLoyaltyAccount = async (): Promise<LoyaltyAccount> => {
  const { data } = await apiClient.get<LoyaltyAccount>('/loyalty/my');
  return data;
};

export const getLoyaltyRules = async (): Promise<LoyaltyRules> => {
  const { data } = await apiClient.get<LoyaltyRules>('/loyalty/rules');
  return data;
};
