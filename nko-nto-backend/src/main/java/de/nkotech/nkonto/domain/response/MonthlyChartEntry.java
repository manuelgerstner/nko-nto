package de.nkotech.nkonto.domain.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MonthlyChartEntry {
    private int year;
    private int month;
    private BigDecimal earnings;
    private BigDecimal spendings;
}
