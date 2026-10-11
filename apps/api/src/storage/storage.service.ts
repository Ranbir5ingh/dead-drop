import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "drop-photos";

export interface StoredObject {
  url: string;
  path: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient | null;
  private bucketReady = false;
  private readonly localRoot: string;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>("SUPABASE_URL")?.trim();
    const key = config.get<string>("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    this.client = url && key ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) : null;
    this.localRoot = path.join(process.cwd(), "uploads");
  }

  get usesSupabase(): boolean {
    return this.client !== null;
  }

  async save(objectPath: string, bytes: Buffer, contentType: string): Promise<StoredObject> {
    this.assertSafePath(objectPath);
    if (this.client) {
      await this.ensureBucket();
      const { error } = await this.client.storage.from(BUCKET).upload(objectPath, bytes, {
        contentType,
        upsert: false,
      });
      if (error) {
        this.logger.warn(`Storage upload failed: ${error.message}`);
        throw new ServiceUnavailableException(
          "The photo could not be stored. Check the drop-photos bucket and the service role key.",
        );
      }
      const { data } = this.client.storage.from(BUCKET).getPublicUrl(objectPath);
      return { url: data.publicUrl, path: objectPath };
    }

    if (process.env.NODE_ENV === "production") {
      throw new ServiceUnavailableException(
        "Photo storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const full = path.join(this.localRoot, objectPath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
    return { url: `local://${objectPath}`, path: objectPath };
  }

  async remove(objectPath: string): Promise<void> {
    this.assertSafePath(objectPath);
    if (this.client) {
      const { error } = await this.client.storage.from(BUCKET).remove([objectPath]);
      if (error) this.logger.warn(`Storage remove failed: ${error.message}`);
      return;
    }
    await unlink(path.join(this.localRoot, objectPath)).catch(() => undefined);
  }

  async readLocal(folder: string, name: string): Promise<{ bytes: Buffer; contentType: string } | null> {
    if (folder !== "drops" && folder !== "finds") return null;
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(name)) return null;
    const objectPath = `${folder}/${name}`;
    try {
      const bytes = await readFile(path.join(this.localRoot, objectPath));
      const contentType = name.endsWith(".png")
        ? "image/png"
        : name.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      return { bytes, contentType };
    } catch {
      return null;
    }
  }

  objectPathFromUrl(url: string, folder: "drops" | "finds", id: string): string | null {
    const match = url.match(/\.(jpg|png|webp)(?:\?|$)/i);
    if (!match?.[1]) return null;
    return `${folder}/${id}.${match[1].toLowerCase()}`;
  }

  private assertSafePath(objectPath: string): void {
    if (objectPath.includes("..") || objectPath.startsWith("/") || objectPath.includes("\\")) {
      throw new ServiceUnavailableException("Photo path was rejected.");
    }
  }

  private async ensureBucket(): Promise<void> {
    if (!this.client || this.bucketReady) return;
    const { error } = await this.client.storage.createBucket(BUCKET, { public: true });
    if (error && !/exist/i.test(error.message)) {
      this.logger.warn(`Bucket create: ${error.message}`);
    }
    this.bucketReady = true;
  }
}
