import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  BOARD_LIMIT,
  hiderPoints,
  isDifficulty,
  type CreateDropResponse,
  type Difficulty,
  type DropDetail,
  type DropListItem,
  type HiderDrop,
  type PublishDropResponse,
} from "@deaddrop/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { AiService } from "../ai/ai.service";
import { NAME_PATTERN, namesMatch } from "../common/names";
import { DbService } from "../db/db.service";
import { drops, finds } from "../db/schema";
import { scanRiddle } from "../ai/safety";
import { StorageService } from "../storage/storage.service";
import type { CreateDropDto } from "./dto/create-drop.dto";
import { extensionFor, requireImage, type UploadedPhoto } from "./photo";

const AREA_BLOCK = new Set([
  "phone",
  "coordinates",
  "coordinates-label",
  "address",
  "url",
  "email",
  "plus-code",
  "what3words",
]);

function asDifficulty(value: number): Difficulty {
  if (!isDifficulty(value)) {
    throw new InternalServerErrorException("This drop has a bad difficulty.");
  }
  return value;
}

function asIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function riddleTeaser(riddle: string): string {
  const parts = riddle.split(/(?<=[.!?])\s+/);
  const sentence = parts[0] ?? riddle;
  if (sentence.length <= 160) return sentence;
  return `${sentence.slice(0, 157).trimEnd()}…`;
}

@Injectable()
export class DropsService {
  constructor(
    private readonly db: DbService,
    private readonly ai: AiService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateDropDto, photo: UploadedPhoto | undefined): Promise<CreateDropResponse> {
    this.assertBroadArea(dto.areaName);
    const mime = requireImage(photo, false);
    const written = await this.ai.generateRiddle({
      vicinityDescription: dto.vicinityDescription,
      objectHint: dto.objectDescription,
      areaName: dto.areaName,
    });

    const id = crypto.randomUUID();
    const stored =
      photo && mime
        ? await this.storage.save(`drops/${id}.${extensionFor(mime)}`, photo.buffer, mime)
        : null;

    try {
      const [row] = await this.db.orm
        .insert(drops)
        .values({
          id,
          riddle: written.riddle,
          difficulty: written.difficulty,
          vicinityDescription: dto.vicinityDescription,
          objectDescription: dto.objectDescription,
          areaName: dto.areaName,
          photoUrl: stored?.url ?? null,
          hiderName: dto.hiderName,
          status: "preview",
          findCount: 0,
          seeded: false,
        })
        .returning();
      if (!row) throw new InternalServerErrorException("The drop did not save.");
      return {
        id: row.id,
        riddle: row.riddle,
        difficulty: asDifficulty(row.difficulty),
        areaName: row.areaName,
        hiderName: row.hiderName,
        status: "preview",
        createdAt: asIso(row.createdAt) ?? new Date().toISOString(),
      };
    } catch (error) {
      if (stored) await this.storage.remove(stored.path);
      throw error;
    }
  }

  async publish(id: string, hiderName: string): Promise<PublishDropResponse> {
    const drop = await this.mustGet(id);
    if (!namesMatch(drop.hiderName, hiderName)) {
      throw new ForbiddenException("That display name does not match the hider.");
    }
    if (drop.status === "retired") {
      throw new ConflictException("This drop has been retired.");
    }
    if (drop.status !== "open") {
      await this.db.orm.update(drops).set({ status: "open" }).where(eq(drops.id, id));
    }
    return {
      id: drop.id,
      status: "open",
      riddle: drop.riddle,
      difficulty: asDifficulty(drop.difficulty),
      areaName: drop.areaName,
    };
  }

  async discard(id: string, hiderName: string): Promise<{ ok: true }> {
    const drop = await this.mustGet(id);
    if (!namesMatch(drop.hiderName, hiderName)) {
      throw new ForbiddenException("That display name does not match the hider.");
    }
    if (drop.status !== "preview") {
      throw new ConflictException("Live drops stay on the board.");
    }
    if (drop.photoUrl) {
      const objectPath = this.storage.objectPathFromUrl(drop.photoUrl, "drops", drop.id);
      if (objectPath) await this.storage.remove(objectPath);
    }
    await this.db.orm.delete(drops).where(eq(drops.id, id));
    return { ok: true };
  }

  async list(): Promise<DropListItem[]> {
    const rows = await this.db.orm
      .select()
      .from(drops)
      .where(eq(drops.status, "open"))
      .orderBy(desc(drops.createdAt))
      .limit(BOARD_LIMIT);
    return rows.map((row) => ({
      id: row.id,
      riddleTeaser: riddleTeaser(row.riddle),
      difficulty: asDifficulty(row.difficulty),
      areaName: row.areaName,
      hiderName: row.hiderName,
      findCount: row.findCount,
      status: row.status === "retired" ? "retired" : "open",
      seeded: row.seeded,
      createdAt: asIso(row.createdAt) ?? new Date().toISOString(),
    }));
  }

  async get(id: string): Promise<DropDetail> {
    const drop = await this.mustGet(id);
    if (drop.status === "preview") {
      throw new NotFoundException("That drop isn't on the board.");
    }
    return {
      id: drop.id,
      riddle: drop.riddle,
      difficulty: asDifficulty(drop.difficulty),
      areaName: drop.areaName,
      hiderName: drop.hiderName,
      findCount: drop.findCount,
      status: drop.status === "retired" ? "retired" : "open",
      seeded: drop.seeded,
      createdAt: asIso(drop.createdAt) ?? new Date().toISOString(),
    };
  }

  async forHider(name: string): Promise<HiderDrop[]> {
    const tidyName = name.trim().replace(/\s+/g, " ");
    if (!NAME_PATTERN.test(tidyName)) {
      throw new BadRequestException("Use a display name made of letters.");
    }
    const rows = await this.db.orm
      .select({
        id: drops.id,
        riddle: drops.riddle,
        difficulty: drops.difficulty,
        areaName: drops.areaName,
        findCount: drops.findCount,
        seeded: drops.seeded,
        createdAt: drops.createdAt,
        latestFindAt: sql<Date | string | null>`max(${finds.createdAt}) filter (where ${finds.verified})`,
      })
      .from(drops)
      .leftJoin(finds, eq(finds.dropId, drops.id))
      .where(
        and(
          eq(drops.status, "open"),
          eq(drops.seeded, false),
          sql`lower(${drops.hiderName}) = ${tidyName.toLowerCase()}`,
        ),
      )
      .groupBy(drops.id)
      .orderBy(desc(drops.createdAt))
      .limit(20);

    return rows.flatMap((row) => {
      if (!isDifficulty(row.difficulty)) return [];
      return [
        {
          id: row.id,
          riddle: row.riddle,
          difficulty: row.difficulty,
          areaName: row.areaName,
          findCount: row.findCount,
          seeded: row.seeded,
          createdAt: asIso(row.createdAt) ?? new Date().toISOString(),
          latestFindAt: asIso(row.latestFindAt),
          points: row.findCount * hiderPoints(row.difficulty),
        },
      ];
    });
  }

  async mustGet(id: string) {
    const [row] = await this.db.orm.select().from(drops).where(eq(drops.id, id)).limit(1);
    if (!row) throw new NotFoundException("That drop isn't on the board.");
    return row;
  }

  private assertBroadArea(areaName: string): void {
    const blocked = scanRiddle(areaName).filter((flag) => AREA_BLOCK.has(flag));
    if (blocked.length > 0) {
      throw new BadRequestException(
        "Use a broad area name, like a park or a neighborhood — not an address, phone number, or coordinates.",
      );
    }
  }
}
