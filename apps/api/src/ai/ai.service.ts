import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { MIN_MATCH_CONFIDENCE, type Difficulty } from "@deaddrop/shared";
import { fallbackRiddle } from "./fallback";
import { parseRiddle, parseVerdict, type ParsedVerdict } from "./parse";
import type { AiProvider } from "./provider";
import { ProviderError } from "./provider";
import type { RiddleInput, VerifyInput } from "./prompts";
import { leaksObject, scanRiddle } from "./safety";

export const AI_PROVIDER = Symbol("AI_PROVIDER");

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  get referee(): AiProvider["id"] {
    return this.provider.id;
  }

  async generateRiddle(input: RiddleInput): Promise<{ riddle: string; difficulty: Difficulty }> {
    let correction: string | null = null;
    let providerFailures = 0;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      let raw: string;
      try {
        raw = await this.provider.writeRiddle(input, correction);
      } catch (error) {
        providerFailures += 1;
        const message = error instanceof Error ? error.message : "provider error";
        this.logger.warn(`Riddle attempt ${attempt + 1} failed: ${message}`);
        correction = "The previous call failed. Return only the JSON object.";
        if (providerFailures >= 2) break;
        continue;
      }

      const parsed = parseRiddle(raw);
      if (!parsed) {
        correction =
          "The previous reply was not valid JSON with riddle, difficulty 1, 2, or 3, and safetyFlags.";
        continue;
      }
      if (parsed.safetyFlags.length > 0) {
        correction = `The previous riddle flagged ${parsed.safetyFlags.join(", ")}. Remove anything exact.`;
        continue;
      }
      const flags = scanRiddle(parsed.riddle);
      if (flags.length > 0) {
        correction = `The previous riddle contained ${flags.join(", ")}. Those are forbidden.`;
        this.logger.warn(`Rejected riddle flags: ${flags.join(", ")}`);
        continue;
      }
      if (leaksObject(parsed.riddle, input.objectHint)) {
        correction = "The previous riddle copied the object description. Hint at it. Do not quote it.";
        continue;
      }
      return { riddle: parsed.riddle, difficulty: parsed.difficulty };
    }

    this.logger.warn("Using a hand-written riddle template.");
    const draft = fallbackRiddle({
      areaName: input.areaName,
      objectHint: input.objectHint,
      variant: 0,
    });
    const flags = scanRiddle(draft.riddle);
    if (flags.length > 0) {
      throw new ServiceUnavailableException(
        "The referee could not write a safe riddle. Try a broader area name.",
      );
    }
    return draft;
  }

  async verifyFind(input: VerifyInput): Promise<ParsedVerdict> {
    let providerFailures = 0;
    let sawUnusable = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      let raw: string;
      try {
        raw = await this.provider.judgePhoto(input);
      } catch (error) {
        providerFailures += 1;
        const message = error instanceof ProviderError ? error.message : "provider error";
        this.logger.warn(`Verify attempt ${attempt + 1} failed: ${message}`);
        if (providerFailures >= 2) break;
        continue;
      }

      const parsed = parseVerdict(raw);
      if (!parsed) {
        sawUnusable = true;
        continue;
      }
      if (parsed.match && parsed.confidence < MIN_MATCH_CONFIDENCE) {
        return {
          match: false,
          confidence: parsed.confidence,
          reason: `${parsed.reason} The referee was not certain enough to call a match.`,
        };
      }
      if (!parsed.match && parsed.confidence < 0) {
        return { ...parsed, confidence: 0 };
      }
      return parsed;
    }

    if (providerFailures > 0 && !sawUnusable) {
      throw new ServiceUnavailableException(
        "The referee is unavailable. This look was not counted. Try again in a little while.",
      );
    }
    throw new ServiceUnavailableException(
      "The referee could not give a clear verdict. This look was not counted.",
    );
  }
}
