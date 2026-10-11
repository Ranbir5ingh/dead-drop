import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  MAX_FIND_ATTEMPTS,
  hiderPoints,
  hunterPoints,
  isDifficulty,
  type FindAttemptResponse,
} from "@deaddrop/shared";
import { and, eq, sql } from "drizzle-orm";
import { AiService } from "../ai/ai.service";
import { namesMatch } from "../common/names";
import { DbService } from "../db/db.service";
import { drops, finds } from "../db/schema";
import { StorageService } from "../storage/storage.service";
import { DropsService } from "./drops.service";
import { extensionFor, requireImage, type UploadedPhoto } from "./photo";

@Injectable()
export class FindsService {
  constructor(
    private readonly db: DbService,
    private readonly dropsService: DropsService,
    private readonly ai: AiService,
    private readonly storage: StorageService,
  ) {}

  async attempt(
    dropId: string,
    finderName: string,
    photo: UploadedPhoto | undefined,
  ): Promise<FindAttemptResponse> {
    const mime = requireImage(photo, true);
    if (!photo || !mime) {
      throw new NotFoundException("A photo is required.");
    }
    const drop = await this.dropsService.mustGet(dropId);
    if (drop.status !== "open") {
      throw new NotFoundException("That drop isn't on the board.");
    }
    if (!isDifficulty(drop.difficulty)) {
      throw new ConflictException("This drop cannot be scored.");
    }
    if (drop.seeded) {
      throw new ConflictException(
        "This is a sample riddle so the board is not empty. Nothing was physically hidden, so it cannot be scored. Hide a real one.",
      );
    }
    if (namesMatch(drop.hiderName, finderName)) {
      throw new ConflictException("You hid this one. Leave it for someone else.");
    }

    const prior = await this.attemptState(drop.id, finderName);
    if (prior.verified) {
      throw new ConflictException("You already verified this drop. Once is the whole prize.");
    }
    if (prior.count >= MAX_FIND_ATTEMPTS) {
      throw new ConflictException(
        "Three looks is the limit on this drop. Leave it for the next person.",
      );
    }

    const verdict = await this.ai.verifyFind({
      photoBase64: photo.buffer.toString("base64"),
      mimeType: mime,
      objectDescription: drop.objectDescription,
      riddle: drop.riddle,
    });

    const points = verdict.match ? hunterPoints(drop.difficulty) : 0;
    const hiderAward = verdict.match ? hiderPoints(drop.difficulty) : 0;
    const findId = crypto.randomUUID();
    const stored = await this.storage.save(
      `finds/${findId}.${extensionFor(mime)}`,
      photo.buffer,
      mime,
    );

    try {
      const attemptsUsed = await this.db.orm.transaction(async (tx) => {
        await tx
          .select({ id: drops.id })
          .from(drops)
          .where(eq(drops.id, drop.id))
          .for("update");
        const rows = await tx
          .select({ verified: finds.verified })
          .from(finds)
          .where(
            and(
              eq(finds.dropId, drop.id),
              sql`lower(${finds.finderName}) = ${finderName.toLowerCase()}`,
            ),
          );
        const verified = rows.some((row) => row.verified);
        if (verified) {
          throw new ConflictException("You already verified this drop. Once is the whole prize.");
        }
        if (rows.length >= MAX_FIND_ATTEMPTS) {
          throw new ConflictException(
            "Three looks is the limit on this drop. Leave it for the next person.",
          );
        }
        const used = rows.length + 1;
        await tx.insert(finds).values({
          id: findId,
          dropId: drop.id,
          finderName,
          photoUrl: stored.url,
          verified: verdict.match,
          confidence: verdict.confidence.toFixed(3),
          points,
          attempts: used,
        });
        if (verdict.match) {
          await tx
            .update(drops)
            .set({ findCount: sql`${drops.findCount} + 1` })
            .where(eq(drops.id, drop.id));
        }
        return used;
      });

      return {
        match: verdict.match,
        confidence: verdict.confidence,
        reason: verdict.reason,
        attemptsUsed,
        attemptsRemaining: MAX_FIND_ATTEMPTS - attemptsUsed,
        pointsAwarded: points,
        hiderPointsAwarded: hiderAward,
      };
    } catch (error) {
      await this.storage.remove(stored.path);
      throw error;
    }
  }

  private async attemptState(dropId: string, finderName: string) {
    const rows = await this.db.orm
      .select({ verified: finds.verified })
      .from(finds)
      .where(
        and(
          eq(finds.dropId, dropId),
          sql`lower(${finds.finderName}) = ${finderName.toLowerCase()}`,
        ),
      );
    return {
      count: rows.length,
      verified: rows.some((row) => row.verified),
    };
  }
}
