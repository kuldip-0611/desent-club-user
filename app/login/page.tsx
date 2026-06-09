import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthShell } from '@/src/components/auth/AuthShell';

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your email and password">
      <AuthForm action="login" />
    </AuthShell>
  );
}
