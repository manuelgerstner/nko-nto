CREATE TABLE company (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(200) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
    firebase_uid VARCHAR(128) PRIMARY KEY,
    company_id   UUID         NOT NULL REFERENCES company(id),
    name         VARCHAR(200),
    email        VARCHAR(200),
    role         VARCHAR(50),
    created_at   TIMESTAMP    NOT NULL DEFAULT now()
);

ALTER TABLE contact      ADD COLUMN company_id UUID REFERENCES company(id);
ALTER TABLE invoice      ADD COLUMN company_id UUID REFERENCES company(id);
ALTER TABLE bill         ADD COLUMN company_id UUID REFERENCES company(id);
ALTER TABLE app_settings ADD COLUMN company_id UUID REFERENCES company(id);

CREATE INDEX idx_app_user_company ON app_user(company_id);
CREATE INDEX idx_contact_company  ON contact(company_id);
CREATE INDEX idx_invoice_company  ON invoice(company_id);
CREATE INDEX idx_bill_company     ON bill(company_id);
