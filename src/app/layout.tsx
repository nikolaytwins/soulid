import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soul Star",
  description: "Personal pentagram by date of birth"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
