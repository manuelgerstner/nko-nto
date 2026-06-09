package de.nkotech.nkonto.domain.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LineItemRequest {

    @NotBlank
    private String description;

    @NotNull
    @DecimalMin("0.0001")
    private BigDecimal quantity;

    @NotNull
    @DecimalMin("0")
    private BigDecimal unitPrice;

    @DecimalMin("0")
    private BigDecimal vatRate = BigDecimal.ZERO;
}
