CREATE OR REPLACE FUNCTION update_book_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE books
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM ratings
            WHERE book_id = NEW.book_id
        )
        WHERE id = NEW.book_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE books
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM ratings
            WHERE book_id = OLD.book_id
        )
        WHERE id = OLD.book_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rating_on_change ON ratings;
DROP TRIGGER IF EXISTS trigger_update_rating_on_delete ON ratings;

CREATE TRIGGER trigger_update_rating_on_change
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_book_average_rating();

CREATE TRIGGER trigger_update_rating_on_delete
AFTER DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_book_average_rating();

UPDATE books
SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM ratings
    WHERE ratings.book_id = books.id
);

CREATE OR REPLACE FUNCTION update_genre_book_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE genres SET book_count = book_count + 1 WHERE id = NEW.genre_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE genres SET book_count = book_count - 1 WHERE id = OLD.genre_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_genre_book_count_on_insert ON book_genres;
DROP TRIGGER IF EXISTS trigger_update_genre_book_count_on_delete ON book_genres;

CREATE TRIGGER trigger_update_genre_book_count_on_insert
AFTER INSERT ON book_genres
FOR EACH ROW
EXECUTE FUNCTION update_genre_book_count();

CREATE TRIGGER trigger_update_genre_book_count_on_delete
AFTER DELETE ON book_genres
FOR EACH ROW
EXECUTE FUNCTION update_genre_book_count();

UPDATE genres
SET book_count = (
    SELECT COUNT(*)
    FROM book_genres
    WHERE book_genres.genre_id = genres.id
);
