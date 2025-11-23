CREATE TABLE "catalogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"emoji" text DEFAULT '📁',
	"color" text DEFAULT '#3B82F6',
	"parent_id" integer,
	"user_id" integer NOT NULL,
	"position" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"type" text DEFAULT 'text' NOT NULL,
	"telegram_post_id" text,
	"telegram_post_url" text,
	"image_url" text,
	"file_url" text,
	"metadata" json,
	"catalog_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"position" integer DEFAULT 0,
	"is_pinned" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6B7280',
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" text NOT NULL,
	"username" text,
	"language_code" text DEFAULT 'ru',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_id_idx" ON "users" USING btree ("telegram_id");