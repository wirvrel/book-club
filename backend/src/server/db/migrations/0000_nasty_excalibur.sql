CREATE TYPE "public"."author_work_type" AS ENUM('novelist', 'short_story_writer', 'poet', 'playwright', 'screenwriter', 'essayist', 'biographer', 'memoirist', 'historian', 'journalist', 'science_writer', 'self_help_writer', 'children_writer', 'young_adult_writer', 'graphic_novelist', 'fantasy_writer', 'sci_fi_writer', 'mystery_writer', 'romance_writer', 'horror_writer', 'other');
CREATE TYPE "public"."age_rating" AS ENUM('0+', '6+', '12+', '16+', '18+');
CREATE TYPE "public"."cover_type" AS ENUM('hardcover', 'paperback', 'other');
CREATE TYPE "public"."reading_format" AS ENUM('physical', 'ebook', 'audiobook', 'other');
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"profile_picture" varchar(255),
	"bio" text,
	"is_public" boolean DEFAULT true,
	"birthday" date,
	"gender" varchar(20),
	"location" varchar(100),
	"last_login" timestamp,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"social_media_links" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"bio" text,
	"birth_date" date,
	"birth_place" varchar(100),
	"nationality" varchar(50),
	"type_of_work" "author_work_type",
	"website" varchar(255),
	"profile_picture" varchar(255),
	"death_date" date,
	"social_media_links" jsonb,
	"media_images" jsonb,
	"media_videos" jsonb,
	"fun_facts" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"website" varchar(255),
	"country" varchar(50),
	"founded_year" integer,
	"logo" varchar(255),
	"contact_email" varchar(255),
	"phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "book_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"total_books" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"plot" text,
	"history" text,
	"series_id" uuid,
	"number_in_series" integer,
	"page_count" integer,
	"languages" jsonb,
	"age_restriction" "age_rating",
	"cover_image" varchar(255),
	"fun_facts" jsonb,
	"adaptations" jsonb,
	"is_bestseller" boolean,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"parent_id" uuid,
	"description" text,
	"book_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "book_authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "book_authors_book_id_author_id_pk" PRIMARY KEY("book_id","author_id")
);
CREATE TABLE "book_genres" (
	"book_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "book_genres_book_id_genre_id_pk" PRIMARY KEY("book_id","genre_id")
);
CREATE TABLE "book_publishers" (
	"book_id" uuid NOT NULL,
	"publisher_id" uuid NOT NULL,
	"published_date" date,
	"isbn" varchar(13),
	"circulation" integer,
	"format" varchar(50),
	"cover_type" "cover_type",
	"translator" varchar(100),
	"edition" integer,
	"price" integer,
	"binding" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_publishers_book_id_publisher_id_pk" PRIMARY KEY("book_id","publisher_id"),
	CONSTRAINT "book_publishers_isbn_unique" UNIQUE("isbn")
);
CREATE TABLE "collection_books" (
	"collection_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_books_collection_id_book_id_pk" PRIMARY KEY("collection_id","book_id")
);
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image" varchar(255),
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"commentable_id" uuid NOT NULL,
	"commentable_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"favoriteable_id" uuid NOT NULL,
	"favoriteable_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_favoriteable_id_favoriteable_type_unique" UNIQUE("user_id","favoriteable_id","favoriteable_type")
);
CREATE TABLE "follows" (
	"follower_id" uuid NOT NULL,
	"followed_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_followed_id_pk" PRIMARY KEY("follower_id","followed_id")
);
CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"likeable_id" uuid NOT NULL,
	"likeable_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "likes_user_id_likeable_id_likeable_type_unique" UNIQUE("user_id","likeable_id","likeable_type")
);
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"text" text NOT NULL,
	"page_number" integer,
	"contains_spoilers" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_user_id_book_id_unique" UNIQUE("user_id","book_id")
);
CREATE TABLE "shelves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "user_authors" (
	"user_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "user_authors_user_id_author_id_pk" PRIMARY KEY("user_id","author_id")
);
CREATE TABLE "user_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"shelf_id" uuid NOT NULL,
	"start_date" date,
	"read_date" date,
	"progress_pages" integer,
	"is_private" boolean DEFAULT false,
	"rating" integer,
	"notes" text,
	"reading_format" "reading_format",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_books_user_id_book_id_unique" UNIQUE("user_id","book_id")
);
CREATE TABLE "view_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"viewable_id" uuid NOT NULL,
	"viewable_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "view_histories_user_id_viewable_id_viewable_type_unique" UNIQUE("user_id","viewable_id","viewable_type")
);
ALTER TABLE "books" ADD CONSTRAINT "books_series_id_book_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."book_series"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "genres" ADD CONSTRAINT "genres_parent_id_genres_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "book_publishers" ADD CONSTRAINT "book_publishers_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "book_publishers" ADD CONSTRAINT "book_publishers_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collection_books" ADD CONSTRAINT "collection_books_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collection_books" ADD CONSTRAINT "collection_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "follows" ADD CONSTRAINT "follows_followed_id_users_id_fk" FOREIGN KEY ("followed_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_authors" ADD CONSTRAINT "user_authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_authors" ADD CONSTRAINT "user_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_shelf_id_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;