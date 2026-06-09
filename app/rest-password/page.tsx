import { redirect } from 'next/navigation';

type RestPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function RestPasswordPage({ searchParams }: RestPasswordPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  redirect(`/reset-password${query}`);
}
