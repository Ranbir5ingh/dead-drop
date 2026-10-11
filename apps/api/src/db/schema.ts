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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  googleSub: text("google_sub").unique(),
  githubId: text("github_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  /** Refresh tokens in one login share a family so a reused token kills the chain. */
  familyId: uuid("family_id").notNull().defaultRandom(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oauthStates = pgTable("oauth_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  stateHash: text("state_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const placePicks = pgTable("place_picks", {
  id: uuid("id").primaryKey().defaultRandom(),
  areaName: text("area_name").notNull(),
  label: text("label").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const drops = pgTable(
  "drops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riddle: text("riddle").notNull(),
    difficulty: integer("difficulty").notNull(),
    vicinityDescription: text("vicinity_description").notNull(),
    objectDescription: text("object_description").notNull(),
    areaName: text("area_name").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    photoUrl: text("photo_url"),
    hiderUserId: uuid("hider_user_id").references(() => users.id),
    hiderName: text("hider_name").notNull(),
    status: text("status").notNull().default("preview"),
    findCount: integer("find_count").notNull().default(0),
    seeded: boolean("seeded").notNull().default(false),
    /** Open drops with this flag appear on every hunt, with no stored pin. */
    everywhere: boolean("everywhere").notNull().default(false),
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
    finderUserId: uuid("finder_user_id").references(() => users.id),
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
