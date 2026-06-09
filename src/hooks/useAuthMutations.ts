'use client';

import { useMutation } from '@tanstack/react-query';
import {
  registerAccount,
  resendEmailOtp,
  sendEmailOtp,
  userLogin,
  verifyEmailOtp,
} from '@/src/services/auth';

export const useRegisterMutation = () => useMutation({ mutationFn: registerAccount });

export const useUserLoginMutation = () => useMutation({ mutationFn: userLogin });

export const useSendEmailOtpMutation = () => useMutation({ mutationFn: sendEmailOtp });

export const useResendEmailOtpMutation = () => useMutation({ mutationFn: resendEmailOtp });

export const useVerifyEmailOtpMutation = () => useMutation({ mutationFn: verifyEmailOtp });
