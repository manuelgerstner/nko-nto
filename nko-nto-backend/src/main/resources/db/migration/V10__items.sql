CREATE TABLE item (
    id               UUID PRIMARY KEY,
    company_id       UUID NOT NULL REFERENCES company(id),
    name             VARCHAR(255) NOT NULL,
    default_price    NUMERIC(12,4) NOT NULL,
    default_vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL,
    updated_at       TIMESTAMP
);
