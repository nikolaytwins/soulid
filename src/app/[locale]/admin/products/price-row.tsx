"use client";

import { useRef, useTransition } from "react";
import { saveProductPriceAction } from "../actions";

export function PriceRow({
  id,
  name,
  hint,
  amount,
  isFree
}: {
  id: string;
  name: string;
  hint?: string;
  amount: number;
  isFree: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  function submit() {
    const form = formRef.current;
    if (!form) return;
    start(() => saveProductPriceAction(new FormData(form)));
  }

  return (
    <form
      ref={formRef}
      className={`flex flex-wrap items-center gap-3 rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] px-4 py-3 ${pending ? "opacity-70" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <div className="min-w-[160px] flex-1">
        <p className="font-semibold">{name}</p>
        {hint ? <p className="text-xs text-faint">{hint}</p> : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isFree"
          value="1"
          defaultChecked={isFree}
          onChange={submit}
        />
        Бесплатно
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <span className="text-muted">$</span>
        <input
          name="amount"
          type="number"
          min={0}
          step={1}
          defaultValue={amount}
          onBlur={submit}
          className="w-24 rounded-none border border-[rgba(26,26,26,.15)] bg-[rgba(255,255,255,.72)] px-3 py-2 text-right"
        />
      </label>
    </form>
  );
}
