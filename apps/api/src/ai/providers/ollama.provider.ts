import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProviderError, type AiProvider } from "../provider";
import { riddlePrompt, verifyPrompt, type RiddleInput, type VerifyInput } from "../prompts";

const MODEL = "gemma4:e4b";

@Injectable()
export class OllamaProvider implements AiProvider {
  readonly id = "ollama" as const;

  constructor(private readonly config: ConfigService) {}

  async writeRiddle(input: RiddleInput, correction: string | null): Promise<string> {
    return this.chat(riddlePrompt(input, correction));
  }

  async judgePhoto(input: VerifyInput): Promise<string> {
    return this.chat(verifyPrompt(input.objectDescription, input.riddle), [
      input.photoBase64,
    ]);
  }

  private base(): string {
    const raw = this.config.get<string>("OLLAMA_URL") ?? "http://127.0.0.1:11434";
    return raw.replace(/\/$/, "");
  }

  private async chat(content: string, images?: string[]): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.base()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          format: "json",
          messages: [
            {
              role: "user",
              content,
              ...(images ? { images } : {}),
            },
          ],
        }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "network";
      throw new ProviderError(
        `Ollama could not be reached at ${this.base()} (${reason}). Is it running with ${MODEL}?`,
      );
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ProviderError(`Ollama request failed (${response.status}).`);
    }
    if (!body || typeof body !== "object" || !("message" in body)) {
      throw new ProviderError("Ollama returned an empty reply.");
    }
    const message = (body as { message: unknown }).message;
    if (!message || typeof message !== "object" || !("content" in message)) {
      throw new ProviderError("Ollama returned an empty reply.");
    }
    const text = (message as { content: unknown }).content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new ProviderError("Ollama returned an empty reply.");
    }
    return text.trim();
  }
}
