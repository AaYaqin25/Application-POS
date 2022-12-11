CREATE OR REPLACE FUNCTION update_sales() RETURNS TRIGGER AS $set_sales$
    DECLARE 
    old_stock INTEGER;
    price_total_sum NUMERIC;
    current_invoice TEXT;
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            SELECT stock INTO old_stock FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = old_stock - NEW.quantity WHERE barcode = NEW.itemcode;
                current_invoice := NEW.invoice;
        ELSIF (TG_OP = 'UPDATE') THEN
            SELECT stock INTO old_stock FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = old_stock + OLD.quantity - NEW.quantity WHERE barcode = NEW.itemcode;
                current_invoice := NEW.invoice;
        ELSIF (TG_OP = 'DELETE') THEN
            SELECT stock INTO old_stock FROM goods WHERE barcode = OLD.itemcode;
            UPDATE goods SET stock = old_stock + OLD.quantity WHERE barcode = OLD.itemcode;
                current_invoice := OLD.invoice;
        END IF;

        SELECT sum(totalprice) INTO price_total_sum FROM saleitems WHERE invoice = current_invoice;
        UPDATE sales SET totalsum = price_total_sum WHERE invoice = current_invoice;

        RETURN NULL;
    END;
$set_sales$ LANGUAGE plpgsql;

CREATE TRIGGER set_sales
AFTER INSERT OR UPDATE OR DELETE ON saleitems
    FOR EACH ROW EXECUTE FUNCTION update_sales();




CREATE OR REPLACE FUNCTION update_price_sales() RETURNS TRIGGER AS $set_total_price$
    DECLARE 
    total_price_sales NUMERIC;
    BEGIN
        SELECT sellingprice INTO total_price_sales FROM goods WHERE barcode = NEW.itemcode;
        NEW.sellingprice := total_price_sales;
        NEW.totalprice := NEW.quantity * NEW.sellingprice;
        RETURN NEW;
    END;
$set_total_price$ LANGUAGE plpgsql;

CREATE TRIGGER set_total_price
BEFORE INSERT OR UPDATE ON saleitems
    FOR EACH ROW EXECUTE FUNCTION update_price_sales();



CREATE OR REPLACE FUNCTION invoice() RETURNS text AS $$
 
BEGIN
	IF EXISTS(SELECT invoice FROM sales WHERE invoice = 'INV-PENJ' || to_char(CURRENT_DATE, 'YYYYMMDD') || - 1) THEN
		return 'INV-PENJ' || to_char(CURRENT_DATE, 'YYYYMMDD') || - nextval('invoice_sales_seq');
	ELSE
		ALTER SEQUENCE invoice_sales_seq RESTART WITH 1;
		return 'INV-PENJ' || to_char(CURRENT_DATE, 'YYYYMMDD') || - nextval('invoice_sales_seq');
	END IF;
END;

$$ LANGUAGE plpgsql;