CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"title" varchar(255),
	"description" text,
	"cover_image" varchar(255),
	"page_count" integer,
	"isbn" varchar(13),
	"published_date" date,
	"name" varchar(100),
	"bio" text,
	"birth_date" date,
	"birth_place" varchar(100),
	"nationality" varchar(50),
	"type_of_work" varchar(50),
	"profile_picture" varchar(255),
	"rejection_reason" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;