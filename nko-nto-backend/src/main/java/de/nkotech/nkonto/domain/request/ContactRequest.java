package de.nkotech.nkonto.domain.request;

import de.nkotech.nkonto.domain.type.ContactType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContactRequest {

    @NotBlank
    private String name;

    private String email;
    private String phone;
    private String street;
    private String postalCode;
    private String state;
    private String country;

    @NotNull
    private ContactType type;

    private String vatId;
    private String defaultCurrency;
    private String notes;
}
