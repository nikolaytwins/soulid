import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { deletePatternAction, savePatternAction } from "../actions";
import { SHOW_COMBINATIONS } from "@/lib/domain/features";

export default async function AdminPatterns({ params }: { params: Promise<{ locale: string }> }) {
  if (!SHOW_COMBINATIONS) {
    const { locale } = await params;
    redirect(`/${locale}/admin/content`);
  }
  const rows = await prisma.patternRule.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <div>
      <h1 className="font-[Forum,serif] text-3xl font-normal tracking-[0.02em]">Комбинации и повторы</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Движок сам находит повторяющиеся числа и комбинации на звезде. Здесь только тексты. Новые типы: repeating
        (одно число ≥ N раз) или combination (все числа есть на звезде).
      </p>

      <form action={savePatternAction} className="mt-6 grid gap-3 rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-4 md:grid-cols-2">
        <h2 className="font-[Forum,serif] text-xl font-normal md:col-span-2">Новое правило</h2>
        <label className="text-xs text-faint">
          Тип
          <select name="kind" className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2">
            <option value="repeating">repeating — одно число ≥ N раз</option>
            <option value="combination">combination — все числа присутствуют</option>
          </select>
        </label>
        <label className="text-xs text-faint">
          Значения (14 или 5,3)
          <input name="values" placeholder="14" className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
        </label>
        <label className="text-xs text-faint">
          Мин. повторов
          <input name="minCount" type="number" defaultValue={2} className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
        </label>
        <label className="text-xs text-faint">
          Область
          <select name="scope" className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2">
            <option value="star">вся звезда</option>
            <option value="sphere">одна сфера</option>
          </select>
        </label>
        <label className="text-xs text-faint">
          Сфера (если область = sphere)
          <input name="sphere" placeholder="personality" className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
        </label>
        <label className="text-xs text-faint">
          Locale
          <select name="locale" className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2">
            <option>ru</option>
            <option>en</option>
            <option>ar</option>
          </select>
        </label>
        <label className="text-xs text-faint md:col-span-2">
          Заголовок
          <input name="title" className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
        </label>
        <label className="text-xs text-faint md:col-span-2">
          Текст (JSON {"{ paragraphs: [...] }"} или простой текст)
          <textarea name="body" rows={4} className="mt-1 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2 font-mono text-xs" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked />
          Активно
        </label>
        <button className="v3-btn-red rounded-none px-4 py-2 text-sm font-semibold md:col-span-2">Создать</button>
      </form>

      <div className="mt-8 flex flex-col gap-4">
        {rows.map((r) => (
          <form key={r.id} action={savePatternAction} className="rounded-none border border-[rgba(26,26,26,.10)] bg-[rgba(255,255,255,.55)] p-4">
            <input type="hidden" name="id" value={r.id} />
            <div className="mb-2 font-sans text-xs text-faint">
              {r.kind} · {r.matchKey} · {r.locale} {r.isActive ? "" : "· off"}
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <select name="kind" defaultValue={r.kind} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2">
                <option value="repeating">repeating</option>
                <option value="combination">combination</option>
              </select>
              <input name="values" defaultValue={(JSON.parse(r.valuesJson) as number[]).join(",")} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
              <input name="minCount" type="number" defaultValue={r.minCount} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
              <select name="locale" defaultValue={r.locale} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2">
                <option>ru</option>
                <option>en</option>
                <option>ar</option>
              </select>
              <select name="scope" defaultValue={r.scope} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2">
                <option value="star">star</option>
                <option value="sphere">sphere</option>
              </select>
              <input name="sphere" defaultValue={r.sphere ?? ""} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
              <input name="sortOrder" type="number" defaultValue={r.sortOrder} className="rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
            </div>
            <input name="title" defaultValue={r.title} className="mt-2 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2" />
            <textarea name="body" defaultValue={r.body} rows={5} className="mt-2 w-full rounded-none border border-[rgba(26,26,26,.15)] px-3 py-2 font-mono text-xs" />
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={r.isActive} />
                Активно
              </label>
              <button className="v3-btn-red rounded-none px-4 py-2 text-sm font-semibold">Сохранить</button>
            </div>
          </form>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {rows.map((r) => (
          <form key={`del-${r.id}`} action={deletePatternAction} className="flex items-center justify-between text-sm text-muted">
            <input type="hidden" name="id" value={r.id} />
            <span className="font-sans">
              Удалить {r.kind} {r.matchKey} ({r.locale})
            </span>
            <button className="text-red-700">Удалить</button>
          </form>
        ))}
      </div>
    </div>
  );
}
