import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const drops = pgTable(
  "drops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riddle: text("riddle").notNull(),
    difficulty: integer("difficulty").notNull(),
    vicinityDescription: text("vicinity_description").notNull(),
    objectDescription: text("object_description").notNull(),
    areaName: text("area_name").notNull(),
    photoUrl: text("photo_url"),
    hiderName: text("hider_name").notNull(),
    status: text("status").notNull().default("preview"),
    findCount: integer("find_count").notNull().default(0),
    seeded: boolean("seeded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("drops_status_created_idx").on(table.status, table.createdAt),
    index("drops_hider_name_idx").on(table.hiderName),
  ],
);

export const finds = pgTable(
  "finds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dropId: uuid("drop_id")
      .notNull()
      .references(() => drops.id, { onDelete: "cascade" }),
    finderName: text("finder_name").notNull(),
    photoUrl: text("photo_url").notNull(),
    verified: boolean("verified").notNull(),
    confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
    points: integer("points").notNull(),
    attempts: integer("attempts").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("finds_drop_finder_idx").on(table.dropId, table.finderName),
    index("finds_finder_name_idx").on(table.finderName),
  ],
);
