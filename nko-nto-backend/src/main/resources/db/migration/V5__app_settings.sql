CREATE TABLE app_settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings    JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO app_settings (settings)
VALUES ('{"primaryCurrency":"EUR","secondaryCurrencyEnabled":false,"secondaryCurrency":null}');
