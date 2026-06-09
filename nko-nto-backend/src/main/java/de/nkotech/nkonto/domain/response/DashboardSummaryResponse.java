package de.nkotech.nkonto.domain.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardSummaryResponse {
    private long outstandingInvoiceCount;
    private BigDecimal outstandingInvoiceTotal;
    private long unpaidBillCount;
    private BigDecimal unpaidBillTotal;
    private long totalContacts;
    private BigDecimal netBalance;
}
