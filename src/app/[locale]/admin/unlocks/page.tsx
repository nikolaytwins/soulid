import { redirect } from "next/navigation";

export default async function AdminUnlocksRedirect({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const { locale } = await params;
  const { userId } = await searchParams;
  if (userId) redirect(`/${locale}/admin/users/${userId}`);
  redirect(`/${locale}/admin/users`);
}
