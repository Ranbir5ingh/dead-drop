import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const PRACTICE = [
  {
    id: "d4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
    difficulty: 1,
    area: "Practice stone",
    hider: "Practice desk",
    object: "a smooth stone painted with a yellow sun",
    vicinity: "Any public bench or low wall. This practice drop is not tied to one park.",
    riddle:
      "A pocket-sized sun is painted on a smooth stone. It is brighter than the pebbles around it. Crouch if you mean it, photograph the stone, and leave it where you found it.",
  },
  {
    id: "e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
    difficulty: 2,
    area: "Practice crane",
    hider: "Practice desk",
    object: "a folded paper crane",
    vicinity: "Any sheltered public nook. This practice drop is not tied to one garden.",
    riddle:
      "Something folded and wing-small has taken shelter from the weather. It is paper, not stone. Photograph the crane and do not unfold it. The next person deserves the same surprise.",
  },
  {
    id: "f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
    difficulty: 3,
    area: "Practice cap",
    hider: "Practice desk",
    object: "a bottle cap with a red thread tied through it",
    vicinity: "Any public wall where people pause. This practice drop is not tied to one lane.",
    riddle:
      "Search the pause where a wall meets open air: a bottle's lost crown, wearing one red thread. It is metal, tiny, and slightly ridiculous. Photograph it, then leave it for the next person.",
  },
];

const SEED = [
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    difficulty: 1,
    area: "Riverside walk",
    hider: "Asha",
    object: "a smooth stone painted with a yellow sun",
    vicinity:
      "A public riverside path where people pause near trees, away from the water and away from any building door.",
    riddle:
      "Where the path keeps company with the water, a pocket-sized sun sits closer to the soil than to the sky. It is brighter than the pebbles around it, and it did not roll there by chance. Crouch if you mean it. Leave it when you have.",
  },
  {
    id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    difficulty: 2,
    area: "Library garden",
    hider: "Leo",
    object: "a folded paper crane in a sheltered nook",
    vicinity:
      "A quiet public garden beside a library, among shrubs and benches, not at the entrance.",
    riddle:
      "This garden keeps the quiet the readers leave behind. Something folded and wing-small has taken shelter from the weather, the way a note hides in a margin. It is paper, not stone. If you find the joke, do not unfold it. The next person deserves the same surprise.",
  },
  {
    id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    difficulty: 3,
    area: "North market lane",
    hider: "Noor",
    object: "a bottle cap with a red thread tied through it",
    vicinity:
      "A pedestrian market lane, where a wall meets a place people stop, not a shop doorway.",
    riddle:
      "The lane talks louder than this. Search the pause where a wall meets open air: a bottle's lost crown, wearing one red thread like a secret handshake. It is metal, tiny, and slightly ridiculous. Glance and you will miss it. Take the credit, not the object.",
  },
];

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and point it at Postgres.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { prepare: false, max: 1 });

try {
  await sql`alter table drops add column if not exists everywhere boolean not null default false`;
  for (const drop of PRACTICE) {
    await sql`
      insert into drops (
        id, riddle, difficulty, vicinity_description, object_description,
        area_name, latitude, longitude, photo_url, hider_name, status, find_count, seeded, everywhere
      ) values (
        ${drop.id}::uuid,
        ${drop.riddle},
        ${drop.difficulty},
        ${drop.vicinity},
        ${drop.object},
        ${drop.area},
        null,
        null,
        null,
        ${drop.hider},
        'open',
        0,
        false,
        true
      )
      on conflict (id) do update set
        riddle = excluded.riddle,
        difficulty = excluded.difficulty,
        vicinity_description = excluded.vicinity_description,
        object_description = excluded.object_description,
        area_name = excluded.area_name,
        hider_name = excluded.hider_name,
        status = 'open',
        seeded = false,
        everywhere = true
    `;
  }
  for (const drop of SEED) {
    await sql`
      insert into drops (
        id, riddle, difficulty, vicinity_description, object_description,
        area_name, photo_url, hider_name, status, find_count, seeded
      ) values (
        ${drop.id}::uuid,
        ${drop.riddle},
        ${drop.difficulty},
        ${drop.vicinity},
        ${drop.object},
        ${drop.area},
        null,
        ${drop.hider},
        'open',
        0,
        true
      )
      on conflict (id) do nothing
    `;
  }
  console.log(
    `Seeded ${SEED.length} unscored samples and ${PRACTICE.length} live practice drops visible from every location.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error("If the table is missing, run npm run db:push from apps/api first.");
  process.exitCode = 1;
} finally {
  await sql.end();
}
