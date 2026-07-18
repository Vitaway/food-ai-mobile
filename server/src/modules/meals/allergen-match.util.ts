/**
 * Match patient-declared allergies against meal item labels / allergen tags.
 * Prefer nutrition-DB allergen tags when present; fall back to label keywords.
 */

const ALLERGEN_ALIASES: Record<string, string[]> = {
  peanut: ["peanut", "peanuts", "groundnut", "groundnuts", "arachis"],
  treenut: ["tree nut", "tree nuts", "almond", "cashew", "walnut", "hazelnut", "pistachio", "pecan", "macadamia", "brazil nut"],
  milk: ["milk", "dairy", "lactose", "whey", "casein", "cream", "butter", "cheese", "yogurt", "yoghurt"],
  egg: ["egg", "eggs", "albumin", "mayonnaise"],
  soy: ["soy", "soya", "soybean", "soybeans", "edamame", "tofu", "tempeh"],
  wheat: ["wheat", "gluten", "flour", "bread", "pasta", "barley", "rye", "semolina"],
  fish: ["fish", "salmon", "tuna", "cod", "tilapia", "sardine", "anchovy", "mackerel"],
  shellfish: ["shellfish", "shrimp", "prawn", "crab", "lobster", "crawfish", "crayfish", "mussel", "oyster", "clam", "scallop"],
  sesame: ["sesame", "tahini"],
  mustard: ["mustard"],
  celery: ["celery", "celeriac"],
  lupin: ["lupin", "lupine"],
  sulphite: ["sulphite", "sulfite", "sulphites", "sulfites"],
};

export type AllergenMatchItem = {
  id?: string;
  label?: string;
  name?: string;
  allergens?: string[];
  mayContainAllergens?: string[];
};

export type AllergenAssessment = {
  clientHasAllergies: boolean;
  allergenMatch: boolean;
  possibleAllergenMatch: boolean;
  matchedAllergens: string[];
  possibleAllergens: string[];
  matchedItemIds: string[];
  possibleItemIds: string[];
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeAllergy(raw: string): string {
  const n = normalizeToken(raw);
  if (!n) return "";
  for (const [canonical, aliases] of Object.entries(ALLERGEN_ALIASES)) {
    if (n === canonical || aliases.some((a) => n === a || n.includes(a))) {
      return canonical;
    }
  }
  return n;
}

function expandSearchTerms(canonical: string): string[] {
  const aliases = ALLERGEN_ALIASES[canonical];
  return aliases ? [canonical, ...aliases] : [canonical];
}

function itemText(item: AllergenMatchItem): string {
  return normalizeToken([item.label, item.name].filter(Boolean).join(" "));
}

function tagsContain(tags: string[] | undefined, terms: string[]): boolean {
  if (!tags?.length) return false;
  const normalized = tags.map(normalizeToken);
  return terms.some((term) => normalized.some((tag) => tag === term || tag.includes(term)));
}

export function assessMealAllergens(
  profileAllergies: unknown,
  items: AllergenMatchItem[] | undefined | null,
): AllergenAssessment {
  const rawAllergies = Array.isArray(profileAllergies)
    ? profileAllergies.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    : [];
  const canonicalAllergies = [...new Set(rawAllergies.map(canonicalizeAllergy).filter(Boolean))];

  const empty: AllergenAssessment = {
    clientHasAllergies: canonicalAllergies.length > 0,
    allergenMatch: false,
    possibleAllergenMatch: false,
    matchedAllergens: [],
    possibleAllergens: [],
    matchedItemIds: [],
    possibleItemIds: [],
  };

  if (!canonicalAllergies.length || !items?.length) {
    return empty;
  }

  const matchedAllergens = new Set<string>();
  const possibleAllergens = new Set<string>();
  const matchedItemIds = new Set<string>();
  const possibleItemIds = new Set<string>();

  for (const item of items) {
    const id = typeof item.id === "string" ? item.id : undefined;
    const text = itemText(item);

    for (const allergy of canonicalAllergies) {
      const terms = expandSearchTerms(allergy);
      const confirmed =
        tagsContain(item.allergens, terms) || terms.some((term) => text.includes(term));
      const possible = !confirmed && tagsContain(item.mayContainAllergens, terms);

      if (confirmed) {
        matchedAllergens.add(allergy);
        if (id) matchedItemIds.add(id);
      } else if (possible) {
        possibleAllergens.add(allergy);
        if (id) possibleItemIds.add(id);
      }
    }
  }

  return {
    clientHasAllergies: true,
    allergenMatch: matchedAllergens.size > 0,
    possibleAllergenMatch: possibleAllergens.size > 0,
    matchedAllergens: [...matchedAllergens],
    possibleAllergens: [...possibleAllergens],
    matchedItemIds: [...matchedItemIds],
    possibleItemIds: [...possibleItemIds],
  };
}
