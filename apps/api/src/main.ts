import "reflect-metadata";
import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const frontend = config.getOrThrow<string>("FRONTEND_URL");
  const allowed = frontend
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const provider = (config.get<string>("AI_PROVIDER") ?? "mock").trim().toLowerCase();

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    exposedHeaders: ["X-Ai-Provider"],
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Ai-Provider", provider);
    next();
  });

  app.setGlobalPrefix("api", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(config.get<string>("PORT") ?? 8787);
  await app.listen(port, "0.0.0.0");
  Logger.log(`Dead Drop API on :${port} (AI_PROVIDER=${provider})`, "Bootstrap");
}

void bootstrap();
