// Shared pure utilities — safe to import from both server and client code

export type ShoppingItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
  note?: string;
  checked: boolean;
};

export type ShoppingCategory = {
  name: string;
  icon: string;
  items: ShoppingItem[];
};

// ─── Diacritics stripping ─────────────────────────────────────────────────────
// Romanian diacritics → ASCII equivalents. Applied early so all downstream
// maps, regexes, and comparisons work on plain ASCII strings.

function stripDiacritics(s: string): string {
  return s
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");
}

// ─── Unit normalisation ───────────────────────────────────────────────────────

const UNIT_MAP: Record<string, string> = {
  cloves: "clove", cups: "cup",
  tablespoons: "tbsp", tablespoon: "tbsp",
  teaspoons: "tsp", teaspoon: "tsp",
  pounds: "lb", pound: "lb",
  ounces: "oz", ounce: "oz",
  liters: "l", litres: "l", liter: "l", litre: "l",
  milliliters: "ml", millilitres: "ml", milliliter: "ml", millilitre: "ml",
  grams: "g", gram: "g",
  kilograms: "kg", kilogram: "kg",
  pieces: "piece", slices: "slice",
  stalks: "stalk", sprigs: "sprig",
  heads: "head", bunches: "bunch",
  cans: "can", tins: "tin",
  // Romanian units (diacritic-free)
  "linguri": "lingura", "lingurite": "lingurita", "lingurita": "lingurita",
  "felii": "felie",
  "conserve": "conserva", "conserva": "conserva",
  "cutii": "cutie",
  "catei": "catel", "catel": "catel",
  "bucati": "bucata", "bucata": "bucata",
  "pahare": "pahar",
  "cani": "cana", "cana": "cana",
  // ── Pseudo-units → discard (treated as no unit) ──────────────────────────
  // These appear in recipes as qualifiers, not real units.
  "dupa gust": "", "optional": "", "optionale": "",
  "cateva": "", "cateva buchete": "", "cateva felii": "",
  "pumn": "", "bila": "", "tulpina": "",
  "medii": "", "mediu": "", "mica": "", "mic": "", "mare": "", "mari": "",
  "portie": "", "portii": "", "ceasca": "", "cupa": "",
};

// Numeric ranges like "5-6" used as units → discard
const NUMERIC_RANGE_RE = /^\d+[-–]\d+\w*$/;

export function normalizeUnit(unit: string | null): string {
  if (!unit) return "";
  const u = stripDiacritics(unit.toLowerCase().trim());
  if (NUMERIC_RANGE_RE.test(u)) return "";
  return UNIT_MAP[u] ?? u;
}

// ─── Ingredient name normalisation ───────────────────────────────────────────
// Pipeline (all steps applied to the lowercased, diacritic-free string):
//  1. Lowercase + strip diacritics
//  2. Strip parenthetical notes: "(pentru servire)", "(fara zahar)", etc.
//  3. Strip leading qualifiers: "optional", "cca", "dupa gust", "putin", etc.
//  4. Strip leading quantity-words: "un pumn de", "o mana de", etc.
//  5. Strip trailing prep-modifier phrases: "tocat", "ras", "fiert", etc.
//  6. Collapse multiple spaces
//  7. Canonical name map lookup

// Trailing ", <prep-adjective>" or " <prep-adjective>" at end of name
const TRAILING_PREP_RE =
  /[,\s]+(tocat[a]?|ras[a]?|feliat[ae]?|fiert[a]?|copt[a]?|pisat[a]?|crud[a]?|taiat[a]?(\s+\S+)?|racit[a]?|proaspat[a]?)\s*$/i;

const NAME_NORMALIZE_MAP: Record<string, string> = {
  // ── Eggs ────────────────────────────────────────────────────────────────────
  "oua": "ou", "ou fiert tare": "ou", "ou crud": "ou", "oua fierte": "ou",

  // ── Dairy & cheese ──────────────────────────────────────────────────────────
  "branzeturi": "branza",
  "branza telemea de capra": "telemea de capra",
  "branza telemea de capra sau oaie": "telemea de capra",
  "telemea de capra sau oaie": "telemea de capra",
  "branza feta sau telemea": "branza feta",
  "iaurt 10% grasime": "iaurt",
  "iaurt 4.5% grasime": "iaurt",
  "iaurt grecesc 10% grasime": "iaurt grecesc",
  "iaurt grecesc 10% grasime sau lapte vegetal": "iaurt grecesc",
  "iaurt sau smantana": "iaurt",
  "iaurt skyr": "iaurt",
  "mozzarella light": "mozzarella",
  "cottage cheese 2% grasime": "cottage cheese",
  "crema de branza light": "crema de branza",
  "parmezan ras": "parmezan",

  // ── Vegetables ──────────────────────────────────────────────────────────────
  "rosii": "rosie", "rosie": "rosie",
  "rosii cherry": "rosii cherry",
  "cartofi": "cartof",
  "cartofi fierti in coaja si raciti": "cartof",
  "cartof copt in coaja si racit": "cartof",
  "cartof mediu": "cartof",
  "cartof dulce copt": "cartof dulce",
  "morcovi": "morcov",
  "morcov crud": "morcov",
  "morcov pentru salata": "morcov",
  "cepe": "ceapa", "ceapa": "ceapa",
  "ceapa tocata": "ceapa",
  "ceapa verde tocata": "ceapa verde",
  "ceapa rosie": "ceapa rosie",
  "ardei grasi": "ardei gras",
  "ciuperci": "ciuperca", "ciuperca": "ciuperca",
  "ciuperci feliate": "ciuperca",
  "castraveti": "castravete", "castravete": "castravete",
  "castravete murat fara zahar": "castravete murat",
  "castraveti murati fara zahar": "castravete murat",
  "castraveti murati": "castravete murat",
  "dovlecei": "dovlecel",
  "cepe rosii": "ceapa rosie",
  "telina apio": "telina",
  "radacina de telina": "telina",
  "telina": "telina",
  "usturoi pisat": "usturoi",
  "ceapa verde": "ceapa verde",
  "patrunjel": "patrunjel",
  "marar": "marar",
  "frunze de baby spanac": "spanac",
  "spanac proaspat": "spanac",
  // salată / frunze — all loose-leaf / mixed-greens variants
  "frunze de salata verde": "salata verde",
  "frunze salata verde": "salata verde",
  "frunze verzi": "salata verde",
  "mix frunze verzi": "salata verde",
  "salata verde": "salata verde",
  "frunze": "frunza", "frunza": "frunza",
  // varza
  "varza alba": "varza",
  "varza rosie": "varza",
  "varza pentru salata": "varza",
  "varza alba sau rosie": "varza",
  "varza alba taiata marunt": "varza",
  // broccoli / conopida
  "broccoli sau conopida": "broccoli",
  "conopida sau broccoli": "conopida",
  // sfecla
  "sfecla rosie": "sfecla rosie",
  "sfecla fiarta": "sfecla rosie",
  // patrunjel / marar
  "patrunjel proaspat tocat": "patrunjel",
  "patrunjel proaspat": "patrunjel",
  "patrunjel sau verdeata": "patrunjel",
  "marar proaspat": "marar",
  "marar proaspat ridichi": "marar",
  "verdeata patrunjel marar": "verdeata",
  "verdeata": "verdeata",
  // vanata
  "vanata": "vanata",

  // ── Fruits ──────────────────────────────────────────────────────────────────
  "portocale": "portocala", "portocala": "portocala",
  "lamai": "lamaie", "lamaie": "lamaie",
  "lamaie stoarsa": "lamaie",
  "lamaie sau otet": "lamaie",
  "lamaie sau otet pentru salata": "lamaie",
  "lamaie sare piper": "lamaie",
  "lamaie sucul": "lamaie",
  "lamaie zeama": "lamaie",
  "zeama de lamaie": "lamaie",
  "suc de lamaie": "lamaie",
  "suc de lamaie sau otet": "lamaie",
  // rosii variants
  "rosii sau 1 conserva de rosii": "rosie",
  "rosii coapte sau crude": "rosie",

  // ── Grains & legumes ────────────────────────────────────────────────────────
  "quinoa fiarta pentru salata": "quinoa",
  "quinoa fiarta pentru servire": "quinoa",
  "quinoa fiarta": "quinoa",
  "naut fiert": "naut",
  "linte verde fiarta": "linte verde",
  "fasole boabe conserva sau uscata fiarta": "fasole boabe",
  "fasole boabe fara zahar": "fasole boabe",
  "fasole alba fara zahar": "fasole alba",
  "fasole rosie fiarta": "fasole rosie",
  "paste integrale cantarite crude": "paste integrale",
  "orez basmati": "orez",
  "paine cu maia": "paine cu maia",
  "lipie libaneza": "lipie libaneza",
  "lipie libaneza sau wrap integral": "lipie libaneza",

  // ── Oils, condiments & sauces ───────────────────────────────────────────────
  "ulei de masline pentru salata": "ulei de masline",
  "ulei de masline": "ulei de masline",
  "masline": "maslina", "maslina": "maslina",
  "pasta de susan tahini": "pasta de susan",
  "pasta de susan": "pasta de susan",
  "pasta de tomate": "bulion",
  "pasta de rosii": "bulion",
  "sos de rosii": "bulion",
  "mustar dijon fara zahar": "mustar",
  "mustar": "mustar",
  "mayo light": "maioneza light",

  // ── Meat ────────────────────────────────────────────────────────────────────
  "piept de pui la gratar taiat cubulete": "piept de pui la gratar",
  "piept de pui la gratar": "piept de pui la gratar",
  "pulpe de pui fara piele": "pulpe de pui",
  "pulpe de pui superioare": "pulpe de pui",
  "pulpe superioare de pui": "pulpe de pui",
  "muschi de porc la gratar": "muschi de porc",
  "carnat maestro sau cotlet de porc": "cotlet de porc",
  "muschi sau cotlet de porc": "cotlet de porc",
  "carne de pasare pui": "piept de pui la gratar",
  "carne de pui tocata": "carne tocata de pui",
  "carne tocata de pui sau vita": "carne tocata de pui",

  // ── Other ───────────────────────────────────────────────────────────────────
  "felii de paine": "felie de paine",
  "unt de arahide cremos": "unt de arahide",
  "unt de arahide natural": "unt de arahide",
  "unt sau 1 lingura ulei de masline": "unt",
  "pudra proteica vanilie sau ciocolata": "pudra proteica",
  "pudra proteica wpi": "pudra proteica",
  "pudra proteica": "pudra proteica",
  "colagen optional": "colagen",
  "lapte vegetal sau lapte 1.5% grasime": "lapte",
};

// Maps canonical singular → plural for display
const ROMANIAN_PLURALS: Record<string, string> = {
  // ingredient names
  "ou": "oua",
  "rosie": "rosii",
  "cartof": "cartofi",
  "morcov": "morcovi",
  "ceapa": "cepe",
  "ardei gras": "ardei grasi",
  "ciuperca": "ciuperci",
  "castravete": "castraveti",
  "castravete murat": "castraveti murati",
  "dovlecel": "dovlecei",
  "ceapa rosie": "cepe rosii",
  "portocala": "portocale",
  "lamaie": "lamai",
  "branza": "branzeturi",
  "frunza": "frunze",
  "maslina": "masline",
  "felie de paine": "felii de paine",
  // units
  "lingura": "linguri",
  "lingurita": "lingurite",
  "felie": "felii",
  "conserva": "conserve",
  "cutie": "cutii",
  "catel": "catei",
  "bucata": "bucati",
  "cana": "cani",
  "pahar": "pahare",
};

// Leading qualifiers to strip before map lookup (diacritic-free regex)
const LEADING_QUALIFIER_RE =
  /^(optional[ae]?|aproximativ|cateva|cca|circa|dupa\s+gust[,\s]*|putin[a]?\s+de\s+|putin[a]?\s+)\s*/i;
// Leading quantity-words embedded in ingredient names
const LEADING_QUANTITY_WORD_RE = /^(pumn|mana|un pumn de|o mana de)\s+/i;

// Standalone prep-instruction words that should be dropped from the shopping list.
const DISCARD_PREP_RE =
  /^(ras[a]?|tocat[a]?|tocat[a]?\s+\S+|feliat[ae]?|fiert[a]?|copt[a]?|pisat[a]?|crud[a]?|taiat[a]?(\s+\S+)?|fierbinte|racit[a]?|marunt|cubulete|cuburi|condiment[e]?(\s+.*)?)$/i;

function normalizeName(name: string): string {
  // 1. Lowercase and trim
  let s = name.toLowerCase().trim();
  // 2. Strip diacritics (solves duplicate-key issues like "marar" vs "mărar")
  s = stripDiacritics(s);
  // 3. Strip parenthetical qualifiers: "(pentru servire)", "(fara zahar)", etc.
  s = s.replace(/\s*\([^)]*\)/g, "").trim();
  // 4. Strip leading qualifiers: "optional", "cca", "dupa gust", etc.
  s = s.replace(LEADING_QUALIFIER_RE, "").trim();
  // 5. Strip leading quantity-words: "pumn", "mana", etc.
  s = s.replace(LEADING_QUANTITY_WORD_RE, "").trim();
  // 6. Strip trailing ", <prep-modifier>" e.g. ", tocat" / ", ras"
  s = s.replace(TRAILING_PREP_RE, "").trim();
  // 7. Collapse multiple spaces
  s = s.replace(/\s{2,}/g, " ").trim();
  return NAME_NORMALIZE_MAP[s] ?? s;
}

function pluralize(word: string, quantity: number | null): string {
  if (quantity === null || quantity <= 1) return word;
  return ROMANIAN_PLURALS[word] ?? word;
}

export function makeKey(name: string, unit: string | null): string {
  return `${normalizeName(name)}||${normalizeUnit(unit)}`;
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

export type AddableItem = Omit<ShoppingItem, "checked">;

export function aggregateInto(list: ShoppingItem[], incoming: AddableItem): ShoppingItem[] {
  const key = makeKey(incoming.name, incoming.unit);
  const idx = list.findIndex((i) => makeKey(i.name, i.unit) === key);
  if (idx >= 0) {
    const next = [...list];
    const cur = next[idx];
    next[idx] = {
      ...cur,
      quantity:
        cur.quantity !== null && incoming.quantity !== null
          ? cur.quantity + incoming.quantity
          : cur.quantity ?? incoming.quantity,
    };
    return next;
  }
  // Always store the canonical (singular) form so pluralize() works correctly
  const canonicalName = normalizeName(incoming.name);
  const canonicalUnit = normalizeUnit(incoming.unit) || null;
  return [...list, { ...incoming, name: canonicalName, unit: canonicalUnit, checked: false }];
}

// ─── Ingredient expansion ─────────────────────────────────────────────────────
// Some recipes store compound seasoning strings as a single ingredient name,
// e.g. "sare, piper, dafin, cimbru" or "dupa gust sare, piper, condimente".
// expandIngredient splits these into individual AddableItems so they aggregate
// correctly. It also strips parentheticals BEFORE comma-splitting to avoid
// "verdeata (patrunjel, marar)" → ["verdeata (patrunjel", "marar)"].

const TASTE_PREFIX_RE = /^(dup[a]\s+gust[,\s]*|de\s+gust[,\s]*)/i;
const LITTLE_PREFIX_RE = /^(putin[a]?(\s+de)?\s+)/i;

export function expandIngredient(item: AddableItem): AddableItem[] {
  // Strip diacritics so all downstream checks work on plain ASCII
  let name = stripDiacritics(item.name.trim());

  // Strip parentheticals FIRST, before comma-splitting, so that
  // "verdeata (patrunjel, marar)" → "verdeata" (not split into two junk parts)
  name = name.replace(/\s*\([^)]*\)/g, "").trim();

  // Strip "dupa gust" / "putin" prefixes
  name = name.replace(TASTE_PREFIX_RE, "").trim();
  name = name.replace(LITTLE_PREFIX_RE, "").trim();

  // Discard if the whole name is a standalone prep instruction (e.g. "ras", "taiata")
  if (!name || DISCARD_PREP_RE.test(name)) return [];

  // Split on commas if this looks like a compound seasoning list
  if (name.includes(",")) {
    const parts = name.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      // Each part is a standalone ingredient — no measured quantity.
      // Drop fragments that are pure prep instructions (e.g. "ras", "taiat cubulete").
      return parts
        .filter((part) => part && !DISCARD_PREP_RE.test(part))
        .map((part) => ({ name: part, quantity: null, unit: null }));
    }
  }

  return [{ ...item, name }];
}

// ─── Migration ────────────────────────────────────────────────────────────────
// Re-runs all items in localStorage through the current normalization pipeline.
// Fixes items stored with diacritics, stale canonical names, or bad keys,
// and merges any duplicates that now resolve to the same key.

export function normalizeStoredItems(items: ShoppingItem[]): ShoppingItem[] {
  // Capture which keys were checked so we can restore that state after re-keying
  const checkedKeys = new Set(
    items.filter((i) => i.checked).map((i) => makeKey(i.name, i.unit))
  );
  let normalized: ShoppingItem[] = [];
  for (const item of items) {
    // Drop items that are prep instructions or generic "condimente"
    if (DISCARD_PREP_RE.test(normalizeName(item.name))) continue;
    const { checked: _checked, ...addable } = item;
    normalized = aggregateInto(normalized, addable);
  }
  return normalized.map((item) => ({
    ...item,
    checked: checkedKeys.has(makeKey(item.name, item.unit)),
  }));
}

// ─── Categorisation ───────────────────────────────────────────────────────────

// First matching rule wins — order matters.
// Keywords are matched as substrings on the lowercased, diacritic-free name.
const CATEGORY_RULES: Array<{ name: string; icon: string; keywords: string[] }> = [
  {
    name: "Peste & Fructe de mare",
    icon: "🐟",
    keywords: [
      "peste", "somon", "ton", "cod", "sardine", "sardina", "sardin",
      "macrou", "crap", "biban", "dorada", "tilapia", "hering", "scrumbie",
      "pastrav", "stavrid", "merluciu", "file de peste",
      "creveti", "caracatita", "calmar", "midii", "homari",
      "ficat de cod",
      "fish", "salmon", "tuna", "shrimp", "prawn", "anchov", "trout",
    ],
  },
  {
    name: "Carne & Mezeluri",
    icon: "🥩",
    keywords: [
      "pui", "curcan", "rata", "gasca",
      "porc", "vita", "miel", "vanat",
      "cotlet", "muschi", "pulpa de porc", "pulpa de vit",
      "piept de pui", "piept de curcan", "pulpa de pui", "pulpa de curcan",
      "piept sau pulpe", "carne", "burger", "chiftea", "friptura",
      "gulas",
      "bacon", "prosciutto", "salam", "carnati",
      "jambon", "sunca", "mezel", "pastrama",
      "ciolan", "costita",
      "chicken", "beef", "pork", "lamb", "turkey", "duck",
      "sausage", "ham", "steak", "mince",
    ],
  },
  {
    name: "Oua",
    icon: "🥚",
    keywords: ["ou", "egg"],
  },
  {
    name: "Lactate",
    icon: "🧀",
    keywords: [
      "branz", "feta", "mozzarella", "parmezan", "cheddar",
      "brie", "gouda", "ricotta", "mascarpone", "cas", "telemea",
      "urda", "cascaval",
      "lapte", "smantana", "iaurt", "unt", "frisca",
      "kefir", "zara",
      "cottage", "crema de branz",
      "milk", "cream", "butter", "yogurt", "yoghurt", "cheese", "ghee",
    ],
  },
  {
    name: "Leguminoase",
    icon: "🫘",
    keywords: [
      "fasole", "linte", "naut", "mazare",
      "soia", "boabe", "hummus",
      "lentil", "chickpea", "kidney bean", "cannellini", "black bean",
      "edamame", "tofu",
    ],
  },
  {
    name: "Cereale & Paine",
    icon: "🌾",
    keywords: [
      "paine", "lipie", "franzela", "bagheta",
      "orez", "paste", "spaghete", "penne", "fidea", "taitei",
      "quinoa", "ovaz", "fulgi de ovaz", "gris",
      "malai", "mamaliga", "pesmet",
      "tortilla", "wrap", "pita", "couscous", "bulgur", "orz", "secara",
      "grau", "tapioca", "cereale", "wasa",
      "bread", "rice", "pasta", "flour", "oats", "noodle", "polenta",
      "semolina", "barley", "breadcrumb",
    ],
  },
  {
    // Checked BEFORE Legume so pickled cucumbers land here, not in vegetables.
    name: "Conserve & Muratura",
    icon: "🥫",
    keywords: [
      "murat", "muratur", "acriu", "in otet",
      "maslina", "olive",
      "bulion", "passata",
      "rosii decojite", "rosii in suc",
      "conserv",
      "canned", "tinned", "pickled", "tomato paste", "tomato puree",
      "stock", "broth",
    ],
  },
  {
    name: "Legume",
    icon: "🥦",
    keywords: [
      "rosie", "rosii", "ardei", "dovlecel", "vinete", "vanata", "porumb",
      "morcov", "cartof", "sfecla", "pastarnac",
      "ridiche", "nap", "gulii",
      "ceapa", "usturoi", "praz",
      "varza", "conopida", "broccoli", "kale", "gulie",
      "salata", "frunze", "spanac", "rucola", "iceberg",
      "verdeata",
      "patrunjel", "ceapa verde",
      "marar", "busuioc proaspat", "coriandru proaspat",
      "castravete", "ciuperca", "ciuperci", "telina", "fenicul", "anghinare",
      "dovleac", "broccolini",
      "legume",
      "tomato", "pepper", "onion", "garlic", "carrot", "potato",
      "cabbage", "spinach", "lettuce", "mushroom", "cucumber",
      "zucchini", "courgette", "celery", "leek", "parsley",
      "cauliflower", "eggplant", "aubergine",
    ],
  },
  {
    name: "Fructe",
    icon: "🍊",
    keywords: [
      "lamaie", "portocal", "grapefruit", "limeta",
      "mango", "ananas", "banana", "kiwi", "papaya", "guava",
      "mar", "para", "piersica",
      "ciresa", "visina", "caisa",
      "prun", "prune",
      "capsun", "afine", "zmeura", "coacaz",
      "mure", "agris",
      "pepene", "melona",
      "avocado",
      "curmale", "smochine", "stafide", "caise uscate",
      "apple", "banana", "lemon", "lime", "orange", "berry", "berries",
      "cherry", "grape", "peach", "plum", "apricot",
    ],
  },
  {
    name: "Condimente & Uleiuri",
    icon: "🧂",
    keywords: [
      "ulei", "otet", "balsamic",
      "maioneza", "mustar", "ketchup",
      "hrean", "sos de soia", "sos de peste", "tahini", "pesto",
      "sos", "dressing",
      "sare", "piper", "boia", "paprika", "turmeric", "cumin", "chimen",
      "oregano", "cimbru", "rozmarin", "dafin", "busuioc uscat",
      "coriandru uscat", "nucsoara", "scortisoara",
      "ienibahar", "cardamom", "curry", "sofran",
      "ardei iute", "fulgi de ardei", "boia de ardei",
      "condiment", "amestec de condimente",
      "zahar", "miere", "sirop de artar", "sirop de agave",
      "vanilie", "cacao", "ciocolata",
      "praf de copt", "bicarbonat", "drojdie", "amidon",
      "oil", "vinegar", "salt", "pepper", "mustard", "mayonnaise",
      "sugar", "honey", "spice", "seasoning", "sauce",
    ],
  },
  {
    name: "Seminte & Nuci",
    icon: "🌰",
    keywords: [
      "nuci", "migdale", "alune", "caju", "fistic", "nuci pecan",
      "macadamia", "seminte", "susan", "chia",
      "canepa", "floarea-soarelui", "dovleac seminte",
      "almond", "cashew", "walnut", "pecan", "peanut", "pistachio",
      "hazelnut", "pine nut", "sesame", "sunflower seed", "pumpkin seed",
      "flaxseed", "hemp seed",
    ],
  },
];

const DEFAULT_CATEGORY = { name: "Altele", icon: "🛒" };

export function categorize(name: string): { name: string; icon: string } {
  // Strip diacritics from the name so it matches our diacritic-free keyword lists
  const lower = stripDiacritics(name.toLowerCase());
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule;
  }
  return DEFAULT_CATEGORY;
}

export function buildCategories(items: ShoppingItem[]): ShoppingCategory[] {
  const catMap = new Map<string, { icon: string; items: ShoppingItem[] }>();

  for (const item of items) {
    const cat = categorize(item.name);
    if (!catMap.has(cat.name)) catMap.set(cat.name, { icon: cat.icon, items: [] });
    catMap.get(cat.name)!.items.push(item);
  }

  for (const cat of catMap.values()) {
    cat.items.sort((a, b) => a.name.localeCompare(b.name));
  }

  const result: ShoppingCategory[] = [];
  for (const rule of CATEGORY_RULES) {
    const cat = catMap.get(rule.name);
    if (cat && cat.items.length > 0)
      result.push({ name: rule.name, icon: rule.icon, items: cat.items });
  }
  const other = catMap.get(DEFAULT_CATEGORY.name);
  if (other && other.items.length > 0)
    result.push({ name: DEFAULT_CATEGORY.name, icon: DEFAULT_CATEGORY.icon, items: other.items });

  return result;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const FRACTIONS: [number, string][] = [
  [0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"], [0.5, "½"],
  [0.667, "⅔"], [0.75, "¾"],
];

export function formatQuantity(raw: number): string {
  const whole = Math.floor(raw);
  const frac = raw - whole;
  if (frac < 0.05) return whole > 0 ? String(whole) : "";
  if (frac > 0.95) return String(whole + 1);
  let best = frac.toFixed(2);
  let bestDiff = Infinity;
  for (const [val, sym] of FRACTIONS) {
    const diff = Math.abs(frac - val);
    if (diff < bestDiff) { bestDiff = diff; best = sym; }
  }
  return whole > 0 ? `${whole}${best}` : best;
}

export function formatItem(item: Pick<ShoppingItem, "name" | "quantity" | "unit" | "note">): string {
  const parts: string[] = [];
  if (item.quantity !== null) {
    const q = formatQuantity(item.quantity);
    if (q) parts.push(q);
  }
  if (item.unit) parts.push(pluralize(item.unit, item.quantity));
  parts.push(pluralize(item.name, item.quantity));
  if (item.note) parts.push(`(${item.note})`);
  return parts.join(" ");
}
