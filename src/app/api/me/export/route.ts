import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportUserData } from "@/lib/privacy";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const data = await exportUserData(session.user.id);
  if (!data) return NextResponse.json({ error: "missing" }, { status: 404 });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="soul-star-data.json"`
    }
  });
}
