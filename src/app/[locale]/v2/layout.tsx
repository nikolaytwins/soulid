import { auth } from "@/lib/auth";
import { listNavStars } from "@/lib/domain/nav-stars";
import { V2Header } from "@/components/v2/Header";
import { V2Footer } from "@/components/v2/Footer";

export default async function V2Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const stars = session?.user?.id ? await listNavStars(session.user.id, locale) : [];
  return (
    <div className="v2-root min-h-screen max-w-full overflow-x-clip font-sans" style={{ background: "#F8F1E9", color: "#2B1A33" }}>
      <V2Header
        locale={locale}
        stars={stars}
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                role: session.user.role
              }
            : null
        }
      />
      {children}
      <V2Footer />
    </div>
  );
}
