import { apiClient } from '@/services/api/client';

export interface ReferralCode {
  id: string;
  code: string;
  timesUsed: number;
  createdAt: string;
}

export interface ReferralStats {
  id: string;
  code: string;
  timesUsed: number;
  referrals: {
    id: string;
    rewardGiven: boolean;
    referredUser: { name: string; createdAt: string };
  }[];
}

export const getMyReferralCode = async (): Promise<ReferralCode> => {
  const { data } = await apiClient.get<ReferralCode>('/referral/my');
  return data;
};

export const getReferralStats = async (): Promise<ReferralStats> => {
  const { data } = await apiClient.get<ReferralStats>('/referral/my/stats');
  return data;
};

export const applyReferralCode = async (code: string): Promise<void> => {
  await apiClient.post('/referral/apply', { code });
};
