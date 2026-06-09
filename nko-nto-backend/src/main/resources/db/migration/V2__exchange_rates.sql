CREATE TABLE exchange_rate (
    id            UUID PRIMARY KEY,
    rate_date     DATE           NOT NULL,
    currency      VARCHAR(10)    NOT NULL,
    base_currency VARCHAR(10)    NOT NULL DEFAULT 'EUR',
    rate          NUMERIC(18,6)  NOT NULL,
    fetched_at    TIMESTAMP      NOT NULL DEFAULT now(),

    CONSTRAINT uq_exchange_rate_date_currency UNIQUE (rate_date, currency)
);

CREATE INDEX idx_exchange_rate_date ON exchange_rate(rate_date DESC);
