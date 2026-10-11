import { Injectable } from "@nestjs/common";
import { fallbackRiddle } from "../fallback";
import type { AiProvider } from "../provider";
import type { RiddleInput, VerifyInput } from "../prompts";

@Injectable()
export class MockAiProvider implements AiProvider {
  readonly id = "mock" as const;

  writeRiddle(input: RiddleInput): Promise<string> {
    const draft = fallbackRiddle({
      areaName: input.areaName,
      objectHint: input.objectHint,
    });
    return Promise.resolve(
      JSON.stringify({
        riddle: draft.riddle,
        difficulty: draft.difficulty,
        safetyFlags: [],
      }),
    );
  }

  judgePhoto(_input: VerifyInput): Promise<string> {
    return Promise.resolve(
      JSON.stringify({
        match: false,
        confidence: 0,
        reason:
          "No match. This server is running the mock referee, which cannot see photographs and will never invent one. The hosted demo uses Gemma on Google AI Studio. A local server can use Ollama instead.",
      }),
    );
  }
}
