export const STAR_RELATIONS = ["self", "partner", "child", "parent", "friend", "other"] as const;
export type StarRelation = (typeof STAR_RELATIONS)[number];

export function parseRelation(raw: string | null | undefined): StarRelation {
  return STAR_RELATIONS.includes(raw as StarRelation) ? (raw as StarRelation) : "self";
}
