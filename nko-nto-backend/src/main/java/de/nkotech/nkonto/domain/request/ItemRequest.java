package de.nkotech.nkonto.domain.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ItemRequest {

    @NotBlank
    private String name;

    @NotNull
    @DecimalMin("0")
    private BigDecimal defaultPrice;

    @DecimalMin("0")
    private BigDecimal defaultVatRate;

    @NotBlank
    private String currency;
}
