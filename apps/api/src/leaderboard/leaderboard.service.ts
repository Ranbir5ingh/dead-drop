import { Injectable } from "@nestjs/common";
import { HIDER_POINT_FACTOR, type LeaderboardResponse } from "@deaddrop/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { DbService } from "../db/db.service";
import { drops, finds } from "../db/schema";

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly db: DbService) {}

  async get(): Promise<LeaderboardResponse> {
    const [hiders, hunters] = await Promise.all([this.hiders(), this.hunters()]);
    return { hiders, hunters };
  }

  private async hiders(): Promise<LeaderboardResponse["hiders"]> {
    const pointsExpr = sql`coalesce(sum(case when ${finds.verified} then ${drops.difficulty} * ${HIDER_POINT_FACTOR} else 0 end), 0)`;
    const rows = await this.db.orm
      .select({
        name: sql<string>`min(${drops.hiderName})`,
        dropsHidden: sql<number>`cast(count(distinct ${drops.id}) as int)`,
        findsReceived: sql<number>`cast(count(${finds.id}) filter (where ${finds.verified}) as int)`,
        points: sql<number>`cast(${pointsExpr} as int)`,
      })
      .from(drops)
      .leftJoin(finds, eq(finds.dropId, drops.id))
      .where(and(eq(drops.status, "open"), eq(drops.seeded, false)))
      .groupBy(sql`lower(${drops.hiderName})`)
      .orderBy(desc(pointsExpr))
      .limit(20);

    return rows.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      dropsHidden: num(row.dropsHidden),
      findsReceived: num(row.findsReceived),
      points: num(row.points),
    }));
  }

  private async hunters(): Promise<LeaderboardResponse["hunters"]> {
    const pointsExpr = sql`coalesce(sum(${finds.points}), 0)`;
    const rows = await this.db.orm
      .select({
        name: sql<string>`min(${finds.finderName})`,
        finds: sql<number>`cast(count(*) as int)`,
        avgDifficulty: sql<string | number | null>`avg(${drops.difficulty})`,
        points: sql<number>`cast(${pointsExpr} as int)`,
      })
      .from(finds)
      .innerJoin(drops, eq(drops.id, finds.dropId))
      .where(eq(finds.verified, true))
      .groupBy(sql`lower(${finds.finderName})`)
      .orderBy(desc(pointsExpr))
      .limit(20);

    return rows.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      finds: num(row.finds),
      avgDifficultyCleared: Math.round(num(row.avgDifficulty) * 100) / 100,
      points: num(row.points),
    }));
  }
}
