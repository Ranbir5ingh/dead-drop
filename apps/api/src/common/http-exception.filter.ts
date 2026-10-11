import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { MulterError } from "multer";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof MulterError) {
      const message =
        exception.code === "LIMIT_FILE_SIZE"
          ? "Photos must be 5 MB or smaller."
          : "That upload did not land. Try the photo again.";
      response.status(400).json({ statusCode: 400, message });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = this.messageOf(body, exception.message);
      if (body && typeof body === "object") {
        const extra = body as Record<string, unknown>;
        response.status(status).json({ ...extra, statusCode: status, message });
        return;
      }
      response.status(status).json({ statusCode: status, message });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : "Unknown failure",
    );
    response.status(500).json({
      statusCode: 500,
      message: "Something went wrong on the trail.",
    });
  }

  private messageOf(body: unknown, fallback: string): string {
    if (typeof body === "string") return body;
    if (!body || typeof body !== "object" || !("message" in body)) return fallback;
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === "string").join(" ");
    }
    return fallback;
  }
}
