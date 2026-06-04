ALTER TABLE "user_books" DROP CONSTRAINT "user_books_user_id_book_id_unique";
ALTER TABLE "users" ALTER COLUMN "profile_picture" SET DATA TYPE text;
ALTER TABLE "authors" ALTER COLUMN "profile_picture" SET DATA TYPE text;
ALTER TABLE "books" ALTER COLUMN "cover_image" SET DATA TYPE text;
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_book_id_shelf_id_unique" UNIQUE("user_id","book_id","shelf_id");