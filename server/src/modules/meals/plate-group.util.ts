import type { PlateGroup } from "./balanced-plate";

/** TFCT food_group codes → Balanced Plate shares. */
const TFCT_GROUP: Record<string, PlateGroup> = {
  F1: "vf",
  F2: "vf",
  F3: "vf",
  F4: "vf",
  C1: "pr",
  C2: "pr",
  D1: "pr",
  D2: "pr",
  D3: "pr",
  A1: "st",
  A2: "st",
  B1: "st",
  B2: "st",
  E: "other",
  G1: "other",
  G2: "other",
  H: "other",
};

/** Legacy seed / catalog categories. */
const LEGACY_CATEGORY: Record<string, PlateGroup> = {
  fruits: "vf",
  fruit: "vf",
  vegetables: "vf",
  vegetable: "vf",
  greens: "vf",
  protein: "pr",
  proteins: "pr",
  dairy: "pr",
  meat: "pr",
  fish: "pr",
  legumes: "pr",
  pulses: "pr",
  staples: "st",
  staple: "st",
  breads: "st",
  bread: "st",
  grains: "st",
  grain: "st",
  starches: "st",
  starch: "st",
  cereals: "st",
  beverages: "other",
  snacks: "other",
  condiments: "other",
  packaged: "other",
  oils: "other",
  fats: "other",
};

const LABEL_HINTS: Array<{ re: RegExp; group: PlateGroup }> = [
  { re: /\b(isombe|dodo|spinach|cabbage|carrot|tomato|avocado|banana|fruit|salad|veg|imboga|amaranth)\b/i, group: "vf" },
  { re: /\b(sambaza|tilapia|fish|chicken|beef|egg|beans|bean|groundnut|peanut|meat|fish|protein|inyama|inkoko)\b/i, group: "pr" },
  { re: /\b(ugali|rice|potato|sweet\s*potato|igikoma|matoke|cassava|bread|pasta|chapati|ibijumba|umuceri)\b/i, group: "st" },
];

function normalizeKey(raw: string | null | undefined) {
  return (raw ?? "").trim().toLowerCase();
}

export function plateGroupFromFoodMeta(opts: {
  foodGroup?: string | null;
  foodGroupName?: string | null;
  category?: string | null;
  label?: string | null;
}): PlateGroup {
  const code = (opts.foodGroup ?? "").trim().toUpperCase();
  if (code && TFCT_GROUP[code]) return TFCT_GROUP[code];

  const category = normalizeKey(opts.category);
  if (category && LEGACY_CATEGORY[category]) return LEGACY_CATEGORY[category];

  const groupName = normalizeKey(opts.foodGroupName);
  if (groupName) {
    if (/fruit|veg|green|leaf/.test(groupName)) return "vf";
    if (/meat|fish|milk|dairy|pulse|legume|nut|egg|poultry/.test(groupName)) return "pr";
    if (/cereal|grain|root|tuber|starch|banana|plantain|bread/.test(groupName)) return "st";
  }

  const label = opts.label ?? "";
  for (const hint of LABEL_HINTS) {
    if (hint.re.test(label)) return hint.group;
  }

  return "other";
}

export function ensurePlateGroup(
  item: { plateGroup?: PlateGroup | null; label?: string | null },
  meta?: { foodGroup?: string | null; foodGroupName?: string | null; category?: string | null },
): PlateGroup {
  if (item.plateGroup === "vf" || item.plateGroup === "pr" || item.plateGroup === "st" || item.plateGroup === "other") {
    return item.plateGroup;
  }
  return plateGroupFromFoodMeta({
    foodGroup: meta?.foodGroup,
    foodGroupName: meta?.foodGroupName,
    category: meta?.category,
    label: item.label,
  });
}
