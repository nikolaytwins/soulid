export function V2AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-[clamp(16px,3vw,40px)] py-12">
      <div className="flex flex-col gap-6 rounded-[36px] bg-white p-8">{children}</div>
    </main>
  );
}
