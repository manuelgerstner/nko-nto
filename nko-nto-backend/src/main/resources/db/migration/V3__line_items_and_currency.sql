ALTER TABLE contact
    ADD COLUMN default_currency VARCHAR(10);

ALTER TABLE invoice
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

ALTER TABLE bill
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

CREATE TABLE invoice_line (
    id          UUID           PRIMARY KEY,
    invoice_id  UUID           NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    description VARCHAR(500)   NOT NULL,
    quantity    NUMERIC(12,4)  NOT NULL,
    unit_price  NUMERIC(12,4)  NOT NULL,
    vat_rate    NUMERIC(5,2)   NOT NULL DEFAULT 0,
    line_total  NUMERIC(12,2)  NOT NULL,
    sort_order  INTEGER        NOT NULL DEFAULT 0
);

CREATE TABLE bill_line (
    id          UUID           PRIMARY KEY,
    bill_id     UUID           NOT NULL REFERENCES bill(id) ON DELETE CASCADE,
    description VARCHAR(500)   NOT NULL,
    quantity    NUMERIC(12,4)  NOT NULL,
    unit_price  NUMERIC(12,4)  NOT NULL,
    vat_rate    NUMERIC(5,2)   NOT NULL DEFAULT 0,
    line_total  NUMERIC(12,2)  NOT NULL,
    sort_order  INTEGER        NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_line_invoice ON invoice_line(invoice_id);
CREATE INDEX idx_bill_line_bill ON bill_line(bill_id);
