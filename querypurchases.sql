CREATE TABLE IF NOT EXISTS purchases
(
    invoice character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT invoice(),
    "time" timestamp with time zone NOT NULL DEFAULT now(),
    totalsum numeric(19,2) NOT NULL DEFAULT 0,
    supplier integer,
    operator integer,
    CONSTRAINT purchases_pkey PRIMARY KEY (invoice),
    CONSTRAINT operator_fkey FOREIGN KEY (operator)
        REFERENCES public.users (userid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT supplier_fkey FOREIGN KEY (supplier)
        REFERENCES public.suppliers (supplierid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

CREATE TABLE IF NOT EXISTS purchaseitems
(
    id integer NOT NULL DEFAULT nextval('purchaseitems_id_seq'::regclass),
    quantity integer NOT NULL,
    purchaseprice numeric(19,2) NOT NULL DEFAULT 0,
    totalprice numeric(19,2) NOT NULL DEFAULT 0,
    invoice character varying(20) COLLATE pg_catalog."default" NOT NULL,
    itemcode character varying(20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT purchaseitems_pkey PRIMARY KEY (id),
    CONSTRAINT invoice_fkey FOREIGN KEY (invoice)
        REFERENCES public.purchases (invoice) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT itemcode_fkey FOREIGN KEY (itemcode)
        REFERENCES public.goods (barcode) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

-- TRIGGER FUNCTION FOR PURCHASES
CREATE OR REPLACE FUNCTION update_purchases() RETURNS TRIGGER AS $set_purchases$
    DECLARE 
    old_stock INTEGER;
    price_total_sum NUMERIC;
    current_invoice TEXT;
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            SELECT stock INTO old_stock FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = old_stock + NEW.quantity WHERE barcode = NEW.itemcode;
                current_invoice := NEW.invoice;
        ELSIF (TG_OP = 'UPDATE') THEN
            SELECT stock INTO old_stock FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = old_stock - OLD.quantity + NEW.quantity WHERE barcode = NEW.itemcode;
                current_invoice := NEW.invoice;
        ELSIF (TG_OP = 'DELETE') THEN
            SELECT stock INTO old_stock FROM goods WHERE barcode = OLD.itemcode;
            UPDATE goods SET stock = old_stock - OLD.quantity WHERE barcode = OLD.itemcode;
                current_invoice := OLD.invoice;
        END IF;

        SELECT sum(totalprice) INTO price_total_sum FROM purchaseitems WHERE invoice = current_invoice;
        UPDATE purchases SET totalsum = price_total_sum WHERE invoice = current_invoice;

        RETURN NULL;
    END;
$set_purchases$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchases
AFTER INSERT OR UPDATE OR DELETE ON purchaseitems
    FOR EACH ROW EXECUTE FUNCTION update_purchases();




-- TRIGGER FUNCTION FOR UPDATE TOTAL PRICE PURCHASE
CREATE OR REPLACE FUNCTION update_price() RETURNS TRIGGER AS $set_total_price$
    DECLARE 
    total_price_purchase NUMERIC;
    BEGIN
        SELECT purchaseprice INTO total_price_purchase FROM goods WHERE barcode = NEW.itemcode;
        NEW.purchaseprice := total_price_purchase;
        NEW.totalprice := NEW.quantity * NEW.purchaseprice;
        RETURN NEW;
    END;
$set_total_price$ LANGUAGE plpgsql;

CREATE TRIGGER set_total_price
BEFORE INSERT OR UPDATE ON purchaseitems
    FOR EACH ROW EXECUTE FUNCTION update_price();



CREATE OR REPLACE FUNCTION invoice() RETURNS text AS $$
 
    BEGIN
	IF EXISTS(SELECT invoice FROM purchases WHERE invoice = 'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || - 1) THEN
		return 'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || - nextval('invoice_seq');
	ELSE
		ALTER SEQUENCE invoice_seq RESTART WITH 1;
		return 'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || - nextval('invoice_seq');
	END IF;
END;

$$ LANGUAGE plpgsql;
