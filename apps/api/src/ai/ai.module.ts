import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AiService, AI_PROVIDER } from "./ai.service";
import type { AiProvider } from "./provider";
import { GoogleGemmaProvider } from "./providers/google-gemma.provider";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { OllamaProvider } from "./providers/ollama.provider";

@Module({
  providers: [
    GoogleGemmaProvider,
    OllamaProvider,
    MockAiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, GoogleGemmaProvider, OllamaProvider, MockAiProvider],
      useFactory: (
        config: ConfigService,
        google: GoogleGemmaProvider,
        ollama: OllamaProvider,
        mock: MockAiProvider,
      ): AiProvider => {
        const which = (config.get<string>("AI_PROVIDER") ?? "mock").trim().toLowerCase();
        if (which === "google") {
          const key = config.get<string>("GOOGLE_AI_API_KEY")?.trim();
          if (!key) {
            throw new Error("GOOGLE_AI_API_KEY is required when AI_PROVIDER=google.");
          }
          return google;
        }
        if (which === "ollama") return ollama;
        if (which === "mock") return mock;
        throw new Error(`Unknown AI_PROVIDER "${which}". Use google, ollama, or mock.`);
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
