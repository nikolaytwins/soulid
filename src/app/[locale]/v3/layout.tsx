export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="v3-root min-h-screen max-w-full overflow-x-clip"
      style={{
        background: "#F6F3F3",
        color: "#1A1A1A",
        fontFamily: "'Noto Sans', system-ui, sans-serif",
        fontWeight: 300
      }}
    >
      {children}
    </div>
  );
}
