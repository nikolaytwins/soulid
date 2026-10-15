"use client";

import { useEffect, useState, useTransition } from "react";
import { reorderUnlocksAction } from "../actions";

export type UnlockOrderItem = { id: string; name: string; free: boolean };

export function UnlockOrder({ items }: { items: UnlockOrderItem[] }) {
  const [list, setList] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => setList(items), [items]);

  function commit(next: UnlockOrderItem[]) {
    setList(next);
    start(() => reorderUnlocksAction(next.map((i) => i.id)));
  }

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = list.findIndex((i) => i.id === fromId);
    const to = list.findIndex((i) => i.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...list];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    commit(next);
  }

  function nudge(id: string, dir: -1 | 1) {
    const i = list.findIndex((row) => row.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    const [row] = next.splice(i, 1);
    next.splice(j, 0, row);
    commit(next);
  }

  return (
    <ol className={`flex flex-col gap-2 ${pending ? "opacity-70" : ""}`}>
      {list.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverId(item.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId) move(dragId, item.id);
            setDragId(null);
            setOverId(null);
          }}
          className={`flex cursor-grab items-center gap-3 rounded-2xl border bg-card px-4 py-3 active:cursor-grabbing ${
            dragId === item.id ? "border-gold opacity-60" : overId === item.id ? "border-gold" : "border-line"
          }`}
        >
          <span className="select-none text-faint" aria-hidden>
            ⋮⋮
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1EBE4] text-sm font-semibold">
            {index + 1}
          </span>
          <span className="flex-1 font-semibold">{item.name}</span>
          {item.free ? (
            <span className="rounded-full bg-open-bg px-2.5 py-1 text-xs font-semibold text-open-text">Бесплатно</span>
          ) : null}
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded-lg border border-line px-2 py-1 text-xs text-muted disabled:opacity-30"
              disabled={index === 0}
              onClick={() => nudge(item.id, -1)}
              aria-label="Выше"
            >
              ↑
            </button>
            <button
              type="button"
              className="rounded-lg border border-line px-2 py-1 text-xs text-muted disabled:opacity-30"
              disabled={index === list.length - 1}
              onClick={() => nudge(item.id, 1)}
              aria-label="Ниже"
            >
              ↓
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
