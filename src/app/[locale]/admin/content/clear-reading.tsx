"use client";

export function ClearReadingButton({ label }: { label: string }) {
  function clear(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    if (!form) return;
    for (const el of form.querySelectorAll("input, textarea")) {
      if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) continue;
      const name = el.name;
      if (!name) continue;
      if (el instanceof HTMLInputElement && (el.type === "hidden" || el.type === "submit")) continue;
      if (name.startsWith("blockMark") || name.startsWith("blockLabel")) continue;
      el.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={clear}
      className="text-[11px] text-faint/80 underline decoration-transparent underline-offset-2 hover:text-muted hover:decoration-faint"
    >
      {label}
    </button>
  );
}
