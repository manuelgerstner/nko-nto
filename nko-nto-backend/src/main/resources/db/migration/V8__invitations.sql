CREATE TABLE invitation (
    token       VARCHAR(64)  PRIMARY KEY,
    company_id  UUID         NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    created_by  VARCHAR(128) NOT NULL REFERENCES app_user(firebase_uid),
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    expires_at  TIMESTAMP    NOT NULL,
    used_at     TIMESTAMP    NULL,
    used_by     VARCHAR(128) NULL REFERENCES app_user(firebase_uid)
);

CREATE INDEX idx_invitation_company ON invitation(company_id);
