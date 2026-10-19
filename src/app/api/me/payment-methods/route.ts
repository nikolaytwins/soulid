import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteSavedMethod, listSavedCards } from "@/lib/payments/saved";
import { cardLabel } from "@/lib/payments/card-label";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const cards = await listSavedCards(session.user.id);
  return NextResponse.json({
    cards: cards.map((c) => ({ ...c, label: cardLabel(c.brand, c.last4) }))
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ok = await deleteSavedMethod(session.user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
