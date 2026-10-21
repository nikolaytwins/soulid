import { auth } from "@/lib/auth";
import { listNavStars } from "@/lib/domain/nav-stars";
import { V3Header } from "@/components/v3/Header";
import { V3Footer } from "@/components/v3/Footer";
import { V3_BOOK_BG, V3_FONT_BODY, V3_INK } from "@/lib/v3";

export default async function V3Layout({
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
    <div
      className="v3-root min-h-screen max-w-full overflow-x-clip"
      style={{
        background: `#F6F3F3 url(${V3_BOOK_BG}) center/cover fixed`,
        color: V3_INK,
        fontFamily: V3_FONT_BODY,
        fontWeight: 300
      }}
    >
      <V3Header
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
      <V3Footer />
    </div>
  );
}
