import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { AdminNav } from "./nav";
import { SHOW_COMBINATIONS } from "@/lib/domain/features";
import { au } from "@/lib/admin-ui";

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login?next=/${locale}/admin`);
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, blockedAt: true }
  });
  if (!me || me.role !== "admin" || me.blockedAt) {
    redirect(`/${locale}/login?next=/${locale}/admin`);
  }
  const t = await getTranslations("admin");
  const items = [
    { href: "/admin", label: t("overview") },
    { href: "/admin/analytics", label: t("analytics") },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/purchases", label: t("purchases") },
    { href: "/admin/content", label: t("content") },
    ...(SHOW_COMBINATIONS ? [{ href: "/admin/patterns", label: t("patterns") }] : []),
    { href: "/admin/products", label: t("products") },
    { href: "/admin/formula", label: t("formula") }
  ];
  return (
    <div className={au.shell}>
      <AdminNav items={items} />
      {children}
    </div>
  );
}
