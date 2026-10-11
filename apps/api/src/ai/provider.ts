import type { RiddleInput, VerifyInput } from "./prompts";

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface AiProvider {
  readonly id: "google" | "ollama" | "mock";
  writeRiddle(input: RiddleInput, correction: string | null): Promise<string>;
  judgePhoto(input: VerifyInput): Promise<string>;
}
