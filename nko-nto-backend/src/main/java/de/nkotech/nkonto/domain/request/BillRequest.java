package de.nkotech.nkonto.domain.request;

import de.nkotech.nkonto.domain.type.BillStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class BillRequest {

    @NotBlank
    private String reference;

    private UUID contactId;

    @NotNull
    private LocalDate issueDate;

    private LocalDate dueDate;

    @NotBlank
    private String currency;

    // Required when lines is empty; computed from lines when lines are provided
    private BigDecimal amount;

    @NotNull
    private BillStatus status;

    @Valid
    private List<LineItemRequest> lines;

    private String category;
    private String notes;
}
