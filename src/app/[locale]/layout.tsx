import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRtl, type AppLocale } from "@/i18n/routing";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { ClientAnalytics } from "@/components/analytics/ClientAnalytics";
import { AuthSessionProvider } from "@/components/layout/AuthSessionProvider";
import { auth } from "@/lib/auth";
import { claimGuestProfiles } from "@/lib/domain/claim-guest";
import { Footer } from "@/components/layout/Footer";
import { HideOnAccount } from "@/components/layout/HideOnAccount";
import { listNavStars } from "@/lib/domain/nav-stars";

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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream font-sans text-ink">
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>
          <ClientAnalytics />
          <MetaPixel />
          <Header
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
          <HideOnAccount>
            <Footer />
          </HideOnAccount>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
