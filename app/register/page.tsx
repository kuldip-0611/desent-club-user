import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthShell } from '@/src/components/auth/AuthShell';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Choose a password, then verify your email with the code we send"
    >
      <AuthForm action="register" />
    </AuthShell>
  );
}
