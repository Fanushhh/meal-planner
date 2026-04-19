import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { meals } from "../src/server/db/schema";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

type Ingredient = {
  quantity: number | null;
  unit: string | null;
  name: string;
  note?: string;
};

const now = Date.now();

const seedMeals: Array<{
  name: string;
  description: string;
  servings: number;
  prepTimeMin: number;
  cookTimeMin: number;
  ingredients: Ingredient[];
  instructions: string[];
  mealType: string;
}> = [
  // ── Mic dejun ──────────────────────────────────────────────
  {
    mealType: "breakfast",
    name: "Wrap cu ou fiert și prosciutto",
    description:
      "Lipie libaneză sau wrap integral cu ou fiert, prosciutto crudo, hummus și frunze de salată verde.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 10,
    ingredients: [
      { quantity: 1, unit: null, name: "lipie libaneză sau wrap integral" },
      { quantity: 1, unit: null, name: "ou" },
      { quantity: 3, unit: "felie", name: "prosciutto crudo" },
      { quantity: 1, unit: "lingură", name: "hummus" },
      { quantity: null, unit: null, name: "frunze de salată verde" },
    ],
    instructions: [
      "Fierbe oul aproximativ 8-9 minute, răcește și curăță.",
      "Întinde hummus-ul pe wrap.",
      "Adaugă oul fiert feliat și feliile de prosciutto.",
      "Completează cu frunzele de salată și rulează.",
    ],
  },
  {
    mealType: "breakfast",
    name: "Sardine cu salată și feta",
    description:
      "Conservă de sardine în sos de roșii fără zahăr, servite cu frunze de salată, ardei gras, măsline și brânză feta.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    ingredients: [
      { quantity: 1, unit: "conservă", name: "sardine în sos de roșii fără zahăr" },
      { quantity: null, unit: null, name: "frunze de salată verde" },
      { quantity: 1, unit: null, name: "ardei gras" },
      { quantity: null, unit: null, name: "măsline" },
      { quantity: 20, unit: "g", name: "brânză feta" },
    ],
    instructions: [
      "Aranjează frunzele de salată pe farfurie.",
      "Adaugă sardinele, ardeiul gras tăiat fâșii, măslinele și feta sfărâmată.",
    ],
  },
  {
    mealType: "breakfast",
    name: "Omletă cu mozzarella și salată",
    description:
      "Omletă din 2 ouă cu mozzarella rasă, servită cu o felie de pâine și mix de frunze verzi cu roșii și castraveți.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 5,
    ingredients: [
      { quantity: 2, unit: null, name: "ouă" },
      { quantity: 20, unit: "g", name: "mozzarella rasă" },
      { quantity: 1, unit: "felie", name: "pâine" },
      { quantity: null, unit: null, name: "mix frunze verzi" },
      { quantity: null, unit: null, name: "roșii" },
      { quantity: null, unit: null, name: "castravete" },
    ],
    instructions: [
      "Bate ouăle cu un praf de sare.",
      "Prăjește omleta în tigaie la foc mediu.",
      "Presară mozzarella rasă și pliază.",
      "Servește cu felia de pâine și salată de frunze verzi cu roșii și castraveți.",
    ],
  },
  {
    mealType: "breakfast",
    name: "Ouă fierte cu hummus și morcov",
    description: "Ouă fierte tari cu hummus, morcov crud și câteva măsline.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 10,
    ingredients: [
      { quantity: 2, unit: null, name: "ouă" },
      { quantity: 2, unit: "linguri", name: "hummus" },
      { quantity: 1, unit: null, name: "morcov" },
      { quantity: null, unit: null, name: "măsline" },
    ],
    instructions: [
      "Fierbe ouăle tari (10 minute), răcește și curăță.",
      "Servește cu hummus, morcov tăiat bastonașe și măsline.",
    ],
  },
  {
    mealType: "breakfast",
    name: "Pastă de avocado cu cottage cheese",
    description:
      "Pastă din avocado și cottage cheese cu ceapă, servită pe felie de pâine cu frunze verzi.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    ingredients: [
      { quantity: 0.5, unit: null, name: "avocado" },
      { quantity: 1, unit: "cutie", name: "cottage cheese" },
      { quantity: null, unit: null, name: "ceapă" },
      { quantity: 1, unit: "felie", name: "pâine" },
      { quantity: null, unit: null, name: "mix frunze verzi" },
    ],
    instructions: [
      "Zdrobește avocado cu o furculiță.",
      "Amestecă cu cottage cheese și ceapă tocată mărunt.",
      "Așează pe felie de pâine.",
      "Servește cu frunze verzi alături.",
    ],
  },
  {
    mealType: "breakfast",
    name: "Pastă de ficat de cod",
    description:
      "Pastă de ficat de cod cu lămâie, pătrunjel și ceapă verde, servită cu ou fiert tare și pâine.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 10,
    ingredients: [
      { quantity: 0.5, unit: "conservă", name: "ficat de cod" },
      { quantity: null, unit: null, name: "suc de lămâie" },
      { quantity: null, unit: null, name: "pătrunjel proaspăt" },
      { quantity: null, unit: null, name: "ceapă verde" },
      { quantity: 1, unit: null, name: "ou" },
      { quantity: 1, unit: "felie", name: "pâine" },
    ],
    instructions: [
      "Fierbe oul tare (10 minute), răcește și curăță.",
      "Amestecă ficatul de cod cu sucul de lămâie, pătrunjel tocat și ceapă verde.",
      "Servește pe felie de pâine cu oul fiert feliat alături.",
    ],
  },
  {
    mealType: "breakfast",
    name: "Pâine cu prosciutto și hummus",
    description:
      "Felie de pâine cu prosciutto crudo, hummus, morcov crud și măsline.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    ingredients: [
      { quantity: 1, unit: "felie", name: "pâine" },
      { quantity: 3, unit: "felie", name: "prosciutto crudo" },
      { quantity: 2, unit: "linguri", name: "hummus" },
      { quantity: 1, unit: null, name: "morcov" },
      { quantity: null, unit: null, name: "măsline" },
    ],
    instructions: [
      "Întinde hummus-ul pe felie de pâine.",
      "Adaugă feliile de prosciutto.",
      "Servește cu morcov tăiat bastonașe și măsline.",
    ],
  },

  // ── Prânz ─────────────────────────────────────────────────
  {
    mealType: "lunch",
    name: "Salată de fasole roșie cu avocado și feta",
    description:
      "Conservă de fasole roșie boabe cu roșii, avocado, brânză feta, oregano și lămâie sau oțet.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    ingredients: [
      { quantity: 1, unit: "conservă", name: "fasole roșie boabe" },
      { quantity: null, unit: null, name: "roșii" },
      { quantity: 0.5, unit: null, name: "avocado" },
      { quantity: 20, unit: "g", name: "brânză feta" },
      { quantity: null, unit: null, name: "oregano" },
      { quantity: null, unit: null, name: "suc de lămâie" },
      { quantity: null, unit: null, name: "oțet" },
    ],
    instructions: [
      "Scurge și clătește fasolea.",
      "Combină cu roșii tăiate cubulețe, avocado, feta sfărâmată și oregano.",
      "Asezonează cu lămâie sau oțet după gust.",
    ],
  },
  {
    mealType: "lunch",
    name: "Supă cremă de legume cu kefir",
    description:
      "Supă cremă de spanac cu cartof și ceapă, mixată fin, servită caldă alături de un pahar de kefir rece.",
    servings: 2,
    prepTimeMin: 10,
    cookTimeMin: 25,
    ingredients: [
      { quantity: 300, unit: "g", name: "spanac", note: "proaspăt sau congelat" },
      { quantity: 2, unit: "buc", name: "cartof", note: "mediu, tăiat cuburi" },
      { quantity: 1, unit: "buc", name: "ceapă", note: "tocată" },
      { quantity: 2, unit: "căței", name: "usturoi" },
      { quantity: 700, unit: "ml", name: "supă de legume" },
      { quantity: 1, unit: "lingură", name: "ulei de măsline" },
      { quantity: 1, unit: "lingură", name: "suc de lămâie" },
      { quantity: null, unit: null, name: "sare, piper, nucșoară" },
      { quantity: 250, unit: "ml", name: "kefir", note: "rece, la servire" },
    ],
    instructions: [
      "Căliți ceapa în ulei de măsline la foc mediu 4–5 minute până devine moale.",
      "Adăugați usturoiul și căliți încă un minut.",
      "Adăugați cartoful și supa de legume. Aduceți la fierbere, apoi reduceți focul și fierbeți 15 minute.",
      "Adăugați spanacul și fierbeți încă 3–4 minute până se înmoaie.",
      "Mixați totul cu blenderul de mână până obțineți o cremă fină.",
      "Adăugați sucul de lămâie, condimentați cu sare, piper și un vârf de nucșoară.",
      "Serviți supa caldă alături de un pahar de kefir rece.",
    ],
  },
  {
    mealType: "lunch",
    name: "Cartof dulce la cuptor cu feta",
    description:
      "Cartof dulce tăiat felii, copt cu usturoi, ulei de măsline și suc de portocale, cu feta și verdeață.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 30,
    ingredients: [
      { quantity: 1, unit: null, name: "cartof dulce" },
      { quantity: 3, unit: "cățel", name: "usturoi" },
      { quantity: 1, unit: "lingură", name: "ulei de măsline" },
      { quantity: null, unit: null, name: "suc de portocale" },
      { quantity: 40, unit: "g", name: "brânză feta" },
      { quantity: null, unit: null, name: "verdeață" },
    ],
    instructions: [
      "Taie cartoful dulce în felii de 1 cm.",
      "Aranjează în tavă cu usturoi, ulei de măsline și suc de portocale.",
      "Coace la 200°C timp de 25-30 de minute.",
      "Adaugă feta sfărâmată și verdeața la final.",
    ],
  },
  {
    mealType: "lunch",
    name: "Salată cu quinoa și curcan la grătar",
    description:
      "Salată cu quinoa fiartă, hummus, ardei gras, ceapă roșie, măsline și piept de curcan la grătar.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 20,
    ingredients: [
      { quantity: 2, unit: "linguri", name: "quinoa fiartă" },
      { quantity: 1, unit: "lingură", name: "hummus" },
      { quantity: 1, unit: null, name: "ardei gras" },
      { quantity: null, unit: null, name: "ceapă roșie" },
      { quantity: 4, unit: null, name: "măsline" },
      { quantity: 60, unit: "g", name: "piept de curcan" },
    ],
    instructions: [
      "Fierbe quinoa și lasă să se răcească.",
      "Grătarează pieptul de curcan și feliază.",
      "Combină quinoa cu hummus, ardei gras tăiat, ceapă roșie, măsline și curcan.",
    ],
  },
  {
    mealType: "lunch",
    name: "Cotlet de porc cu salată de varză și cartof",
    description:
      "Cotlet de porc la grătar sau cuptor cu salată de varză și un cartof fiert în coajă.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 30,
    ingredients: [
      { quantity: 150, unit: "g", name: "cotlet de porc" },
      { quantity: 200, unit: "g", name: "varză" },
      { quantity: 1, unit: null, name: "cartof" },
      { quantity: 1, unit: "lingură", name: "ulei de măsline" },
      { quantity: null, unit: null, name: "sare și piper" },
    ],
    instructions: [
      "Condimentează cotletul cu sare și piper.",
      "Grătarează sau coace la cuptor la 200°C circa 25-30 minute.",
      "Pregătește salata de varză cu ulei de măsline.",
      "Fierbe cartoful în coajă, lasă să se răcească și servește.",
    ],
  },
  {
    mealType: "lunch",
    name: "Naked burger",
    description:
      "Burger fără pâine: pateu de carne la grătar cu castraveți murați fără zahăr, maioneză light și salată iceberg.",
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 10,
    ingredients: [
      { quantity: 1, unit: null, name: "chiftea de burger" },
      { quantity: null, unit: null, name: "castraveți murați fără zahăr" },
      { quantity: 1, unit: "linguriță", name: "maioneză light" },
      { quantity: null, unit: null, name: "frunze de salată iceberg" },
    ],
    instructions: [
      "Grătarează sau prăjește carnea de burger.",
      "Aranjează pe un pat generos de salată iceberg.",
      "Adaugă castraveții murați și maioneza light.",
    ],
  },

  // ── Cină ──────────────────────────────────────────────────
  {
    mealType: "dinner",
    name: "Supă cremă de legume cu bacon",
    description:
      "Supă cremă de dovleac cu morcov, cartof și ceapă, mixată fin și servită cu bacon crocant.",
    servings: 2,
    prepTimeMin: 15,
    cookTimeMin: 35,
    ingredients: [
      { quantity: 500, unit: "g", name: "dovleac", note: "curățat și tăiat cuburi" },
      { quantity: 1, unit: "buc", name: "morcov", note: "tăiat cuburi" },
      { quantity: 1, unit: "buc", name: "cartof", note: "mediu, tăiat cuburi" },
      { quantity: 1, unit: "buc", name: "ceapă", note: "tocată" },
      { quantity: 2, unit: "căței", name: "usturoi" },
      { quantity: 700, unit: "ml", name: "supă de legume" },
      { quantity: 100, unit: "ml", name: "smântână pentru gătit" },
      { quantity: 2, unit: "linguri", name: "ulei de măsline" },
      { quantity: 80, unit: "g", name: "bacon" },
      { quantity: null, unit: null, name: "sare, piper" },
    ],
    instructions: [
      "Căliți ceapa în ulei de măsline la foc mediu circa 5 minute, până devine translucidă.",
      "Adăugați usturoiul și morcovul și căliți încă 3 minute.",
      "Adăugați dovleacul, cartoful și supa de legume. Aduceți la fierbere.",
      "Reduceți focul, acoperiți și fierbeți 20–25 de minute până legumele sunt moi.",
      "Mixați cu blenderul de mână până obțineți o cremă fină și omogenă.",
      "Adăugați smântâna, amestecați și ajustați sarea și piperul după gust.",
      "Prăjiți baconul într-o tigaie fără ulei până devine crocant, apoi tăiați-l în bucăți mici.",
      "Serviți supa fierbinte cu bacon crocant presărat deasupra.",
    ],
  },
  {
    mealType: "dinner",
    name: "Pui la grătar cu salată de varză",
    description:
      "Piept sau pulpe de pui la grătar sau cuptor, servit cu salată de varză (sau murată) și ulei de măsline.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 25,
    ingredients: [
      { quantity: 150, unit: "g", name: "piept sau pulpe de pui" },
      { quantity: 200, unit: "g", name: "varză" },
      { quantity: 1, unit: "lingură", name: "ulei de măsline" },
      { quantity: null, unit: null, name: "sare și piper" },
    ],
    instructions: [
      "Condimentează puiul cu sare și piper.",
      "Grătarează sau coace la 200°C circa 25 de minute.",
      "Pregătește salata de varză simplă sau murată cu ulei de măsline.",
      "Servește împreună.",
    ],
  },
  {
    mealType: "dinner",
    name: "Pulpă de curcan la cuptor cu legume",
    description:
      "Pulpă de curcan coaptă la cuptor cu legume la alegere și cartof, servită cu hrean opțional.",
    servings: 1,
    prepTimeMin: 15,
    cookTimeMin: 40,
    ingredients: [
      { quantity: 150, unit: "g", name: "pulpă de curcan" },
      { quantity: null, unit: null, name: "legume la alegere (morcov, ceapă, țelină)" },
      { quantity: 1, unit: null, name: "cartof mediu" },
      { quantity: null, unit: null, name: "hrean (opțional)" },
      { quantity: null, unit: null, name: "sare, piper, ulei de măsline" },
    ],
    instructions: [
      "Condimentează curcanul cu sare, piper și ulei de măsline.",
      "Taie legumele și cartoful cuburi mari.",
      "Pune totul în tavă și coace la 200°C circa 40 de minute.",
      "Servește cu hrean dacă dorești.",
    ],
  },
  {
    mealType: "dinner",
    name: "Pește cu conopidă sau broccoli la abur",
    description:
      "Pește la alegere cu conopidă sau broccoli la abur, stropit cu lămâie și ulei de măsline.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 20,
    ingredients: [
      { quantity: 150, unit: "g", name: "pește la alegere" },
      { quantity: 200, unit: "g", name: "conopidă sau broccoli" },
      { quantity: null, unit: null, name: "suc de lămâie" },
      { quantity: 1, unit: "lingură", name: "ulei de măsline" },
    ],
    instructions: [
      "Gătește peștele la grătar sau cuptor.",
      "Fierbe conopida sau broccoli la abur 8-10 minute.",
      "Stropește cu lămâie și ulei de măsline.",
    ],
  },
  {
    mealType: "dinner",
    name: "Pește la cuptor cu legume",
    description:
      "Pește copt cu dovlecel, ciuperci, ardei și roșii cherry, cu ulei de măsline și oțet balsamic.",
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 25,
    ingredients: [
      { quantity: 100, unit: "g", name: "pește" },
      { quantity: null, unit: null, name: "dovlecel" },
      { quantity: null, unit: null, name: "ciuperci" },
      { quantity: null, unit: null, name: "ardei" },
      { quantity: null, unit: null, name: "roșii cherry" },
      { quantity: 1, unit: "lingură", name: "ulei de măsline" },
      { quantity: null, unit: null, name: "oțet balsamic" },
    ],
    instructions: [
      "Taie legumele și aranjează în tavă cu peștele.",
      "Stropește cu ulei de măsline.",
      "Coace la 200°C timp de 20-25 de minute.",
      "Adaugă oțet balsamic după gust la servire.",
    ],
  },
  {
    mealType: "dinner",
    name: "Ciorbă de fasole",
    description: "Ciorbă de fasole boabe servită cu pâine.",
    servings: 4,
    prepTimeMin: 15,
    cookTimeMin: 60,
    ingredients: [
      { quantity: 400, unit: "g", name: "fasole boabe" },
      { quantity: 1, unit: null, name: "ceapă" },
      { quantity: 2, unit: null, name: "morcov" },
      { quantity: 1, unit: null, name: "ardei gras" },
      { quantity: 2, unit: "linguri", name: "ulei de măsline" },
      { quantity: null, unit: null, name: "sare, piper, dafin, cimbru" },
      { quantity: 30, unit: "g", name: "pâine", note: "per porție" },
    ],
    instructions: [
      "Înmoaie fasolea overnight sau folosește conservă.",
      "Călește ceapa, morcovul și ardeiul în ulei.",
      "Adaugă fasolea și apă cât să acopere, cu foaie de dafin și cimbru.",
      "Fierbe la foc mic 45-60 de minute până fasolea se înmoaie.",
      "Asezonează și servește cu pâine.",
    ],
  },
];

async function main() {
  const existing = await db.select().from(meals);
  if (existing.length > 0) {
    console.log(
      `Meals table already has ${existing.length} rows — skipping seed.`
    );
    process.exit(0);
  }

  const rows = seedMeals.map((m) => ({
    id: randomUUID(),
    name: m.name,
    description: m.description,
    servings: m.servings,
    prepTimeMin: m.prepTimeMin,
    cookTimeMin: m.cookTimeMin,
    ingredients: JSON.stringify(m.ingredients),
    instructions: JSON.stringify(m.instructions),
    imageUrl: null,
    mealType: m.mealType,
    createdAt: now,
  }));

  await db.insert(meals).values(rows);
  console.log(`Seeded ${rows.length} meals.`);
}

main();
