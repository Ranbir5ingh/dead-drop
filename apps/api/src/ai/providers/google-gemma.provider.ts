import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProviderError, type AiProvider } from "../provider";
import { riddlePrompt, verifyPrompt, type RiddleInput, type VerifyInput } from "../prompts";

const MODELS = ["gemma-3-12b-instruct", "gemma-3-12b-it", "gemma-4-26b-a4b-it"] as const;

interface GemmaPart {
  text?: string;
}

@Injectable()
export class GoogleGemmaProvider implements AiProvider {
  readonly id = "google" as const;
  private readonly logger = new Logger(GoogleGemmaProvider.name);
  private loggedModel: string | null = null;

  constructor(private readonly config: ConfigService) {}

  async writeRiddle(input: RiddleInput, correction: string | null): Promise<string> {
    return this.generate(
      [{ text: riddlePrompt(input, correction) }],
      0.8,
    );
  }

  async judgePhoto(input: VerifyInput): Promise<string> {
    return this.generate(
      [
        { text: verifyPrompt(input.objectDescription, input.riddle) },
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.photoBase64,
          },
        },
      ],
      0.2,
    );
  }

  private key(): string {
    const value = this.config.get<string>("GOOGLE_AI_API_KEY")?.trim();
    if (!value) {
      throw new ProviderError("GOOGLE_AI_API_KEY is not set.");
    }
    return value;
  }

  private async generate(
    parts: Array<Record<string, unknown>>,
    temperature: number,
  ): Promise<string> {
    const key = this.key();
    let lastStatus = 0;
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature,
              maxOutputTokens: 700,
            },
          }),
          signal: AbortSignal.timeout(45_000),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "network";
        throw new ProviderError(`Gemma could not be reached (${reason}).`);
      }

      if (response.status === 404) {
        lastStatus = 404;
        this.logger.warn(`Gemma model ${model} was not found. Trying the next id.`);
        continue;
      }

      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        this.logger.warn(
          `Gemma ${model} responded ${response.status}: ${shortError(body)}`,
        );
        throw new ProviderError(`Gemma request failed (${response.status}).`);
      }

      if (!this.loggedModel) {
        this.loggedModel = model;
        this.logger.log(`Gemma model in use: ${model}`);
      }
      return readText(body);
    }

    throw new ProviderError(
      lastStatus === 404
        ? "Gemma model was not found on the Google AI Studio API."
        : "Gemma request failed.",
    );
  }
}

function shortError(body: unknown): string {
  if (!body || typeof body !== "object" || !("error" in body)) return "no body";
  const error = (body as { error: unknown }).error;
  if (!error || typeof error !== "object" || !("message" in error)) return "no message";
  const message = (error as { message: unknown }).message;
  return typeof message === "string" ? message.slice(0, 180) : "no message";
}

function readText(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new ProviderError("Empty Gemma response.");
  }
  const record = body as { candidates?: unknown; error?: unknown };
  if (record.error) {
    throw new ProviderError(shortError(body));
  }
  if (!Array.isArray(record.candidates) || record.candidates.length === 0) {
    throw new ProviderError("Gemma returned no candidates.");
  }
  const first: unknown = record.candidates[0];
  if (!first || typeof first !== "object" || !("content" in first)) {
    throw new ProviderError("Gemma returned no content.");
  }
  const content = (first as { content: unknown }).content;
  if (!content || typeof content !== "object" || !("parts" in content)) {
    throw new ProviderError("Gemma returned no content.");
  }
  const parts = (content as { parts: unknown }).parts;
  if (!Array.isArray(parts)) {
    throw new ProviderError("Gemma returned no content.");
  }
  const text = parts
    .map((part: unknown) => {
      if (!part || typeof part !== "object" || !("text" in part)) return "";
      const value = (part as GemmaPart).text;
      return typeof value === "string" ? value : "";
    })
    .join("")
    .trim();
  if (!text) throw new ProviderError("Gemma returned an empty reply.");
  return text;
}
