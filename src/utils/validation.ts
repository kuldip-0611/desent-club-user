import * as Yup from 'yup';

export const loginEmailPasswordSchema = Yup.object({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export const registerWithPasswordSchema = Yup.object({
  name: Yup.string().trim().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .required('Confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

export const otpSchema = Yup.object({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'OTP must be exactly 6 digits')
    .required('OTP is required'),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
});

export const resetPasswordSchema = Yup.object({
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .required('Confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .required('Confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});
