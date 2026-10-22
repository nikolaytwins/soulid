import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRtl, type AppLocale } from "@/i18n/routing";
import "../globals.css";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { ClientAnalytics } from "@/components/analytics/ClientAnalytics";
import { AuthSessionProvider } from "@/components/layout/AuthSessionProvider";
import { auth } from "@/lib/auth";
import { claimGuestProfiles } from "@/lib/domain/claim-guest";
import { listNavStars } from "@/lib/domain/nav-stars";
import { V3Header } from "@/components/v3/Header";
import { V3Footer } from "@/components/v3/Footer";
import { V3_BOOK_BG, V3_FONT_BODY, V3_INK } from "@/lib/v3";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  const messages = await getMessages();
  const session = await auth();
  if (session?.user?.id) {
    await claimGuestProfiles(session.user.id);
  }
  const stars = session?.user?.id ? await listNavStars(session.user.id, locale) : [];
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Forum&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="v3-root min-h-screen max-w-full overflow-x-clip"
        style={{
          background: `#F6F3F3 url(${V3_BOOK_BG}) center/cover fixed`,
          color: V3_INK,
          fontFamily: V3_FONT_BODY,
          fontWeight: 300
        }}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>
            <ClientAnalytics />
            <MetaPixel />
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
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
