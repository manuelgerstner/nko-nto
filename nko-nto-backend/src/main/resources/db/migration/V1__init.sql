CREATE TABLE contact (
    id          UUID PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(200),
    phone       VARCHAR(50),
    address     TEXT,
    type        VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',
    vat_id      VARCHAR(50),
    notes       TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE invoice (
    id          UUID PRIMARY KEY,
    number      VARCHAR(50)   NOT NULL UNIQUE,
    contact_id  UUID          REFERENCES contact(id) ON DELETE SET NULL,
    issue_date  DATE          NOT NULL,
    due_date    DATE,
    amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    status      VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    notes       TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE TABLE bill (
    id          UUID PRIMARY KEY,
    reference   VARCHAR(100)  NOT NULL,
    contact_id  UUID          REFERENCES contact(id) ON DELETE SET NULL,
    issue_date  DATE          NOT NULL,
    due_date    DATE,
    amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    category    VARCHAR(100),
    notes       TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_contact ON invoice(contact_id);
CREATE INDEX idx_invoice_status  ON invoice(status);
CREATE INDEX idx_bill_contact    ON bill(contact_id);
CREATE INDEX idx_bill_status     ON bill(status);
