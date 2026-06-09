import { AuthShell } from '@/src/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/src/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send you a link to reset your password"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
