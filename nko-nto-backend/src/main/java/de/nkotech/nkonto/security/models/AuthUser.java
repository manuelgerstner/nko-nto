package de.nkotech.nkonto.security.models;

import lombok.Data;

@Data
public class AuthUser {
    private String uid;
    private String name;
    private String email;
    private boolean emailVerified;
}
