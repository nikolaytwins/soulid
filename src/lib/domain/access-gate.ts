export type EntitlementRecord = {
  sphere: string;
  source: string;
  purchase: { status: string; paidAt: Date | null } | null;
};

export function entitlementIsReadable(row: EntitlementRecord, freeSpheres: Set<string>): boolean {
  if (row.source === "admin") return true;
  if (row.source === "free") return freeSpheres.has(row.sphere);
  if (row.source === "purchase" || row.source === "bundle") {
    return row.purchase?.status === "paid" && Boolean(row.purchase.paidAt);
  }
  return false;
}
