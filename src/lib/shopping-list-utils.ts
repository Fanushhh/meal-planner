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
  // Romanian units
  "linguri": "lingură", "lingura": "lingură",
  "lingurițe": "linguriță", "lingurite": "linguriță",
  "felii": "felie",
  "conserve": "conservă", "conserva": "conservă",
  "cutii": "cutie",
  "căței": "cățel", "catei": "cățel",
  "bucăți": "bucată", "bucati": "bucată",
  "pahare": "pahar",
  "căni": "cană", "cani": "cană",
};

export function normalizeUnit(unit: string | null): string {
  if (!unit) return "";
  const u = unit.toLowerCase().trim();
  return UNIT_MAP[u] ?? u;
}

// ─── Ingredient name normalisation ───────────────────────────────────────────
// Maps plural / variant Romanian ingredient names to a canonical singular form
// so that "ou" and "ouă" aggregate into the same shopping list entry.
//
// Before the map lookup, two preprocessing steps run:
//  1. Strip parenthetical qualifiers  e.g. "(pentru servire)", "(fara zahar)"
//  2. Strip trailing prep-modifiers   e.g. ", tocat" / ", ras" / " proaspat"

// Trailing ", <prep-adjective>" or " <prep-adjective>" at end of name
const TRAILING_PREP_RE =
  /[,\s]+(tocat[aă]?|ras[aă]?|feliat[aă]?|fiert[aă]?|copt[aă]?|pisat[aă]?|crud[aă]?|t[aă]iat[aă]?(\s+\S+)?|r[aă]cit[aă]?|proasp[aă]t[aă]?)\s*$/i;

const NAME_NORMALIZE_MAP: Record<string, string> = {
  // ── Eggs ────────────────────────────────────────────────────────────────────
  "ouă": "ou", "oua": "ou",
  "ou fiert tare": "ou", "ou crud": "ou",
  "oua fierte": "ou",

  // ── Dairy & cheese ──────────────────────────────────────────────────────────
  "brânzeturi": "brânză", "branzeturi": "brânză",
  // telemea variants → canonical
  "branza telemea de capra": "telemea de capra",
  "branza telemea de capra sau oaie": "telemea de capra",
  "telemea de capra sau oaie": "telemea de capra",
  "branza feta sau telemea": "brânză feta",
  // fat-% iaurt variants → plain iaurt
  "iaurt 10% grasime": "iaurt",
  "iaurt 4.5% grasime": "iaurt",
  "iaurt grecesc 10% grasime": "iaurt grecesc",
  "iaurt grecesc 10% grasime sau lapte vegetal": "iaurt grecesc",
  "iaurt sau smantana": "iaurt",
  "iaurt skyr": "iaurt",
  // mozzarella
  "mozzarella light": "mozzarella",
  // cottage cheese fat %
  "cottage cheese 2% grasime": "cottage cheese",
  // crema de branza
  "crema de branza light": "crema de branza",
  // parmezan
  "parmezan ras": "parmezan",

  // ── Vegetables ──────────────────────────────────────────────────────────────
  "roșii": "roșie", "rosii": "roșie", "rosie": "roșie",
  "rosii cherry": "roșii cherry",
  "cartofi": "cartof",
  "cartofi fierti in coaja si raciti": "cartof",
  "cartof copt in coaja si racit": "cartof",
  "cartof mediu": "cartof",
  "cartof dulce copt": "cartof dulce",
  "morcovi": "morcov",
  "morcov crud": "morcov",
  "morcov pentru salata": "morcov",
  "cepe": "ceapă", "ceapa": "ceapă",
  "ceapa tocata": "ceapă",
  "ceapa verde tocata": "ceapă verde",
  "ardei grași": "ardei gras", "ardei grasi": "ardei gras",
  "ciuperci": "ciupercă", "ciuperca": "ciupercă",
  "ciuperci feliate": "ciupercă",
  "castraveți": "castravete", "castraveti": "castravete",
  "castravete murat fara zahar": "castravete murat",
  "castraveti murati fara zahar": "castravete murat",
  "castraveti murati": "castravete murat",
  "dovlecei": "dovlecel",
  "cepe roșii": "ceapă roșie", "cepe rosii": "ceapă roșie",
  "telina apio": "țelină",
  "radacina de telina": "țelină",
  "telina": "țelină",
  // usturoi
  "usturoi pisat": "usturoi",
  // ceapa verde (after preprocessing strips ", tocata")
  "ceapa verde": "ceapă verde",
  // patrunjel / marar (after preprocessing strips "proaspat")
  "patrunjel": "pătrunjel",
  "marar": "mărar",
  // spanac
  "frunze de baby spanac": "spanac",
  "spanac proaspat": "spanac",
  // salată / frunze
  "frunze de salata verde": "salată verde",
  "frunze verzi": "mix frunze verzi",
  "frunze": "frunză", "frunza": "frunză",
  // varza
  "varza pentru salata": "varză",
  "varza alba sau rosie": "varză",
  "varza alba taiata marunt": "varză",
  // broccoli/conopida
  "broccoli sau conopida": "broccoli",
  "conopida sau broccoli": "conopidă",
  // sfecla
  "sfecla rosie": "sfeclă roșie",
  "sfecla fiarta": "sfeclă roșie",
  // patrunjel / marar
  "patrunjel proaspat tocat": "pătrunjel",
  "patrunjel proaspat": "pătrunjel",
  "patrunjel sau verdeata": "pătrunjel",
  "marar proaspat": "mărar",
  "marar proaspat ridichi": "mărar",
  "verdeata patrunjel marar": "verdeață",

  // ── Fruits ──────────────────────────────────────────────────────────────────
  "portocale": "portocală", "portocala": "portocală",
  "lămâi": "lămâie", "lamai": "lămâie",
  "lamaie": "lămâie",
  "lamaie stoarsa": "lămâie",
  "lamaie sau otet": "lămâie sau oțet",
  "lamaie sau otet pentru salata": "lămâie sau oțet",
  "lamaie sare piper": "lămâie",
  "lamaie sucul": "lămâie",
  "lamaie zeama": "lămâie",

  // ── Grains & legumes ────────────────────────────────────────────────────────
  "quinoa fiarta pentru salata": "quinoa",
  "quinoa fiarta pentru servire": "quinoa",
  "quinoa fiarta": "quinoa",
  "naut fiert": "năut",
  "linte verde fiarta": "linte verde",
  "fasole boabe conserva sau uscata fiarta": "fasole boabe",
  "fasole boabe fara zahar": "fasole boabe",
  "fasole alba fara zahar": "fasole albă",
  "fasole rosie fiarta": "fasole roșie",
  "paste integrale cantarite crude": "paste integrale",
  "orez basmati": "orez",
  "paine cu maia": "pâine cu maia",
  "lipie libaneza": "lipie libaneză",

  // ── Oils, condiments & sauces ───────────────────────────────────────────────
  "ulei de masline pentru salata": "ulei de măsline",
  "ulei de masline": "ulei de măsline",
  "masline": "măslină", "măsline": "măslină",
  "pasta de susan tahini": "pastă de susan (tahini)",
  "pasta de tomate": "bulion",
  "sos de rosii": "bulion",
  "mustar dijon fara zahar": "muștar",
  "mustar": "muștar",
  "mayo light": "maioneză light",

  // ── Meat ────────────────────────────────────────────────────────────────────
  "piept de pui la gratar taiat cubulete": "piept de pui la grătar",
  "piept de pui la gratar": "piept de pui la grătar",
  "pulpe de pui fara piele": "pulpe de pui",
  "pulpe de pui superioare": "pulpe de pui",
  "pulpe superioare de pui": "pulpe de pui",
  "muschi de porc la gratar": "mușchi de porc",
  "carnat maestro sau cotlet de porc": "cotlet de porc",
  "muschi sau cotlet de porc": "cotlet de porc",
  "carne de pasare pui": "piept de pui la grătar",
  "carne de pui tocata": "carne tocată de pui",
  "carne tocata de pui sau vita": "carne tocată de pui",

  // ── Other ───────────────────────────────────────────────────────────────────
  "felii de pâine": "felie de pâine", "felii de paine": "felie de pâine",
  "unt de arahide cremos": "unt de arahide",
  "unt de arahide natural": "unt de arahide",
  "unt sau 1 lingura ulei de masline": "unt",
  "pudra proteica vanilie sau ciocolata": "pudră proteică",
  "pudra proteica wpi": "pudră proteică",
  "pudra proteica": "pudră proteică",
  "colagen optional": "colagen",
};

// Maps canonical singular → plural for display in formatItem
const ROMANIAN_PLURALS: Record<string, string> = {
  // ingredient names
  "ou": "ouă",
  "roșie": "roșii",
  "cartof": "cartofi",
  "morcov": "morcovi",
  "ceapă": "cepe",
  "ardei gras": "ardei grași",
  "ciupercă": "ciuperci",
  "castravete": "castraveți",
  "castravete murat": "castraveți murați",
  "dovlecel": "dovlecei",
  "ceapă roșie": "cepe roșii",
  "portocală": "portocale",
  "lămâie": "lămâi",
  "brânză": "brânzeturi",
  "frunză": "frunze",
  "măslină": "măsline",
  "felie de pâine": "felii de pâine",
  // units
  "lingură": "linguri",
  "linguriță": "lingurițe",
  "felie": "felii",
  "conservă": "conserve",
  "cutie": "cutii",
  "cățel": "căței",
  "bucată": "bucăți",
  "cană": "căni",
  "pahar": "pahare",
};

function normalizeName(name: string): string {
  // 1. Lowercase and trim
  let s = name.toLowerCase().trim();
  // 2. Strip parenthetical qualifiers: "(pentru servire)", "(fara zahar)", etc.
  s = s.replace(/\s*\([^)]*\)/g, "").trim();
  // 3. Strip trailing ", <prep-modifier>" e.g. ", tocat" / ", ras"
  s = s.replace(TRAILING_PREP_RE, "").trim();
  // 4. Collapse multiple spaces left by stripping
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

// ─── Categorisation ───────────────────────────────────────────────────────────

// First matching rule wins — order matters.
// Keywords are matched as substrings on the lowercased ingredient name.
// Pește is checked before Carne so "ficat de cod" hits the fish category,
// not the meat one. Conserve is checked before Legume so "castraveți murați"
// hits the pickles bucket rather than the vegetable one.
const CATEGORY_RULES: Array<{ name: string; icon: string; keywords: string[] }> = [
  {
    // ── Fish & seafood ──────────────────────────────────────────────────────
    name: "Pește & Fructe de mare",
    icon: "🐟",
    keywords: [
      // Romanian
      "pește", "peşte", "somon", "ton", "cod", "sardine", "sardină", "sardin",
      "macrou", "crap", "biban", "doradă", "tilapia", "hering", "scrumbie",
      "păstrăv", "pastrav", "stavrid", "merluciu", "file de pește",
      "creveți", "creveti", "caracatiță", "calmar", "midii", "homari",
      "ficat de cod",
      // English fallback
      "fish", "salmon", "tuna", "shrimp", "prawn", "anchov", "trout",
    ],
  },
  {
    // ── Meat & charcuterie ──────────────────────────────────────────────────
    name: "Carne & Mezeluri",
    icon: "🥩",
    keywords: [
      // Romanian poultry
      "pui", "curcan", "rață", "rata", "gâscă", "gasca",
      // Romanian red meat
      "porc", "vită", "vita", "miel", "vânat", "vanat",
      // Romanian cuts & preps
      "cotlet", "mușchi", "muschi", "pulpă de porc", "pulpă de vit",
      "piept de pui", "piept de curcan", "pulpă de pui", "pulpă de curcan",
      "piept sau pulpe", "carne", "burger", "chiftea", "friptură", "friptura",
      "gulaș", "gulas",
      // Romanian charcuterie
      "bacon", "prosciutto", "salam", "cârnați", "carnati",
      "jambon", "șuncă", "sunca", "mezel", "pastramă", "pastrama",
      "ciolan", "costiță", "costita",
      // English fallback
      "chicken", "beef", "pork", "lamb", "turkey", "duck",
      "sausage", "ham", "steak", "mince",
    ],
  },
  {
    // ── Eggs ────────────────────────────────────────────────────────────────
    name: "Ouă",
    icon: "🥚",
    keywords: [
      "ou",   // matches "ou" (canonical) — deliberately short; verified safe
      "egg",
    ],
  },
  {
    // ── Dairy ───────────────────────────────────────────────────────────────
    name: "Lactate",
    icon: "🧀",
    keywords: [
      // Romanian cheeses & dairy
      "brânz", "branz", "feta", "mozzarella", "parmezan", "cheddar",
      "brie", "gouda", "ricotta", "mascarpone", "caș", "cas", "telemea",
      "urdă", "urda", "cascaval",
      // Romanian liquids
      "lapte", "smântân", "smantan", "iaurt", "unt", "frișcă", "frisca",
      "kefir", "zară", "zara",
      // Other
      "cottage", "cremă de brânz", "crema de branz",
      // English fallback
      "milk", "cream", "butter", "yogurt", "yoghurt", "cheese", "ghee",
    ],
  },
  {
    // ── Pulses & legumes ────────────────────────────────────────────────────
    name: "Leguminoase",
    icon: "🫘",
    keywords: [
      // Romanian
      "fasole", "linte", "năut", "naut", "mazăre", "mazare",
      "soia", "boabe", "hummus",
      // English fallback
      "lentil", "chickpea", "kidney bean", "cannellini", "black bean",
      "edamame", "tofu",
    ],
  },
  {
    // ── Grains, pasta & bread ───────────────────────────────────────────────
    name: "Cereale & Pâine",
    icon: "🌾",
    keywords: [
      // Romanian
      "pâine", "paine", "lipie", "franzelă", "franzela", "baghetă", "bagheta",
      "orez", "paste", "spaghete", "penne", "fidea", "tăiței", "taitei",
      "quinoa", "ovăz", "ovaz", "fulgi de ovăz", "griș", "gris",
      "mălai", "malai", "mămăligă", "mamaliga", "pesmet",
      "tortilla", "wrap", "pita", "couscous", "bulgur", "orz", "secară",
      "grâu", "grau", "tapioca", "cereale",
      // English fallback
      "bread", "rice", "pasta", "flour", "oats", "noodle", "polenta",
      "semolina", "barley", "breadcrumb",
    ],
  },
  {
    // ── Canned goods & pickles ──────────────────────────────────────────────
    // Checked BEFORE Legume so pickled cucumbers land here, not in vegetables.
    name: "Conserve & Murături",
    icon: "🥫",
    keywords: [
      // Pickled / preserved
      "murat", "murătur", "muratur", "acriu", "în oțet", "in otet",
      // Olives (always sold preserved)
      "măslină", "maslina", "olive",
      // Canned tomato products
      "pastă de roșii", "pasta de rosii", "bulion", "passata",
      "roșii decojite", "rosii decojite", "roșii în suc",
      // Generic canned
      "conserv",
      // English fallback
      "canned", "tinned", "pickled", "tomato paste", "tomato purée",
      "tomato puree", "stock", "broth",
    ],
  },
  {
    // ── Vegetables (broad) ──────────────────────────────────────────────────
    name: "Legume",
    icon: "🥦",
    keywords: [
      // Fruiting vegetables
      "roșie", "rosie", "roșii", "rosii", "ardei", "dovlecel", "vinete",
      "vânătă", "vanata", "porumb", "roșii cherry",
      // Root & bulb
      "morcov", "cartof", "sfeclă", "sfecla", "păstârnac", "pastarnac",
      "ridiche", "nap", "gulii",
      // Alliums
      "ceapă", "ceapa", "usturoi", "praz",
      // Brassicas
      "varză", "varza", "conopidă", "conopida", "broccoli", "kale", "gulie",
      // Leafy greens & salads
      "salată", "salata", "frunze", "spanac", "rucola", "iceberg",
      "mix frunze", "verdeață", "verdeata",
      // Herbs (fresh)
      "pătrunjel", "patrunjel", "ceapă verde", "ceapa verde",
      "mărar", "marar", "busuioc proaspăt", "coriandru proaspăt",
      // Other vegetables
      "castravete", "castraveți", "castraveti", "ciupercă", "ciuperca",
      "ciuperci", "țelină", "telina", "fenicul", "anghinare",
      "dovleac", "broccolini",
      // Generic
      "legume",
      // English fallback
      "tomato", "pepper", "onion", "garlic", "carrot", "potato",
      "cabbage", "spinach", "lettuce", "mushroom", "cucumber",
      "zucchini", "courgette", "celery", "leek", "parsley",
      "broccoli", "cauliflower", "eggplant", "aubergine",
    ],
  },
  {
    // ── Fruits ──────────────────────────────────────────────────────────────
    name: "Fructe",
    icon: "🍊",
    keywords: [
      // Romanian citrus & tropical
      "lămâie", "lamaie", "portocal", "grapefruit", "limetă", "limeta",
      "mango", "ananas", "banană", "banana", "kiwi", "papaya", "guava",
      // Romanian stone & pome fruit
      "măr", " mar ", "pară", "para", "piersică", "piersica",
      "cireașă", "ciresea", "vișină", "visina", "caisă", "caisa",
      "prun", "prune",
      // Romanian berries
      "căpșun", "capsun", "afine", "zmeură", "zmura", "coacăz", "coacaz",
      "mure", "agriș", "agris",
      // Romanian melon
      "pepene", "melonă", "melona",
      // Avocado (fruit, bought as such)
      "avocado",
      // Romanian juice (from fruit)
      "suc de",
      // Dried fruit
      "curmale", "smochine", "stafide", "caise uscate",
      // English fallback
      "apple", "banana", "lemon", "lime", "orange", "berry", "berries",
      "cherry", "grape", "peach", "plum", "apricot", "mango",
    ],
  },
  {
    // ── Condiments, spices & oils ───────────────────────────────────────────
    name: "Condimente & Uleiuri",
    icon: "🧂",
    keywords: [
      // Oils & vinegars (Romanian)
      "ulei", "oțet", "otet", "balsamic",
      // Condiments (Romanian)
      "maioneză", "maioneza", "muștar", "mustar", "ketchup",
      "hrean", "sos de soia", "sos de pește", "tahini", "pesto",
      "sos", "dressing",
      // Dried spices & herbs (Romanian)
      "sare", "piper", "boia", "paprika", "turmeric", "cumin", "chimen",
      "oregano", "cimbru", "rozmarin", "dafin", "busuioc uscat",
      "coriandru uscat", "nucșoară", "nucsoara", "scorțișoară", "scortisoara",
      "ienibahar", "cardamom", "curry", "șofran", "sofran",
      "ardei iute", "fulgi de ardei", "boia de ardei",
      "condiment", "amestec de condimente",
      // Sweeteners
      "zahăr", "zahar", "miere", "sirop de arțar", "sirop de agave",
      "vanilie", "cacao", "ciocolată", "ciocolata",
      // Leavening
      "praf de copt", "bicarbonat", "drojdie", "amidon",
      // English fallback
      "oil", "vinegar", "salt", "pepper", "mustard", "mayonnaise",
      "sugar", "honey", "spice", "seasoning", "sauce",
    ],
  },
  {
    // ── Seeds & nuts ────────────────────────────────────────────────────────
    name: "Semințe & Nuci",
    icon: "🌰",
    keywords: [
      // Romanian
      "nuci", "migdale", "alune", "caju", "fistic", "nuci pecan",
      "macadamia", "semințe", "seminte", "susan", "in", "chia",
      "cânepă", "canepa", "floarea-soarelui", "dovleac seminte",
      // English fallback
      "almond", "cashew", "walnut", "pecan", "peanut", "pistachio",
      "hazelnut", "pine nut", "sesame", "sunflower seed", "pumpkin seed",
      "flaxseed", "hemp seed",
    ],
  },
];

const DEFAULT_CATEGORY = { name: "Altele", icon: "🛒" };

export function categorize(name: string): { name: string; icon: string } {
  const lower = name.toLowerCase();
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
  const other = catMap.get("Other");
  if (other && other.items.length > 0)
    result.push({ name: "Other", icon: DEFAULT_CATEGORY.icon, items: other.items });

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
