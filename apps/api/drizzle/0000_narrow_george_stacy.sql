CREATE TABLE "drops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"riddle" text NOT NULL,
	"difficulty" integer NOT NULL,
	"vicinity_description" text NOT NULL,
	"object_description" text NOT NULL,
	"area_name" text NOT NULL,
	"photo_url" text,
	"hider_name" text NOT NULL,
	"status" text DEFAULT 'preview' NOT NULL,
	"find_count" integer DEFAULT 0 NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drop_id" uuid NOT NULL,
	"finder_name" text NOT NULL,
	"photo_url" text NOT NULL,
	"verified" boolean NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"points" integer NOT NULL,
	"attempts" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finds" ADD CONSTRAINT "finds_drop_id_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "public"."drops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drops_status_created_idx" ON "drops" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "drops_hider_name_idx" ON "drops" USING btree ("hider_name");--> statement-breakpoint
CREATE INDEX "finds_drop_finder_idx" ON "finds" USING btree ("drop_id","finder_name");--> statement-breakpoint
CREATE INDEX "finds_finder_name_idx" ON "finds" USING btree ("finder_name");