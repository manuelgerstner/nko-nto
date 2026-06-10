package de.nkotech.nkonto.service;

import de.nkotech.nkonto.domain.response.DashboardSummaryResponse;
import de.nkotech.nkonto.domain.response.MonthlyChartEntry;
import de.nkotech.nkonto.domain.type.BillStatus;
import de.nkotech.nkonto.domain.type.InvoiceStatus;
import de.nkotech.nkonto.persistence.repository.BillRepository;
import de.nkotech.nkonto.persistence.repository.ContactRepository;
import de.nkotech.nkonto.persistence.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final BillRepository billRepository;
    private final ContactRepository contactRepository;

    private static final List<InvoiceStatus> OUTSTANDING_STATUSES = List.of(InvoiceStatus.SENT, InvoiceStatus.OVERDUE);
    private static final List<BillStatus> UNPAID_STATUSES = List.of(BillStatus.PENDING, BillStatus.OVERDUE);

    public DashboardSummaryResponse summary(UUID companyId) {
        long outstandingInvoiceCount = invoiceRepository.countByStatusInAndCompanyId(OUTSTANDING_STATUSES, companyId);
        BigDecimal outstandingInvoiceTotal = invoiceRepository.sumAmountByStatusInAndCompanyId(OUTSTANDING_STATUSES, companyId);

        long unpaidBillCount = billRepository.countByStatusInAndCompanyId(UNPAID_STATUSES, companyId);
        BigDecimal unpaidBillTotal = billRepository.sumAmountByStatusInAndCompanyId(UNPAID_STATUSES, companyId);

        long totalContacts = contactRepository.countByCompanyId(companyId);

        BigDecimal netBalance = outstandingInvoiceTotal.subtract(unpaidBillTotal);

        return DashboardSummaryResponse.builder()
                .outstandingInvoiceCount(outstandingInvoiceCount)
                .outstandingInvoiceTotal(outstandingInvoiceTotal)
                .unpaidBillCount(unpaidBillCount)
                .unpaidBillTotal(unpaidBillTotal)
                .totalContacts(totalContacts)
                .netBalance(netBalance)
                .build();
    }

    public List<MonthlyChartEntry> monthlyChart(UUID companyId) {
        LocalDate fromDate = LocalDate.now().minusMonths(11).withDayOfMonth(1);

        Map<YearMonth, BigDecimal> earningsMap = new HashMap<>();
        for (Object[] row : invoiceRepository.sumPaidByMonthSince(companyId, fromDate)) {
            YearMonth ym = YearMonth.of(((Number) row[0]).intValue(), ((Number) row[1]).intValue());
            earningsMap.put(ym, (BigDecimal) row[2]);
        }

        Map<YearMonth, BigDecimal> spendingsMap = new HashMap<>();
        for (Object[] row : billRepository.sumPaidByMonthSince(companyId, fromDate)) {
            YearMonth ym = YearMonth.of(((Number) row[0]).intValue(), ((Number) row[1]).intValue());
            spendingsMap.put(ym, (BigDecimal) row[2]);
        }

        List<MonthlyChartEntry> result = new ArrayList<>();
        YearMonth current = YearMonth.from(fromDate);
        YearMonth end = YearMonth.now();
        while (!current.isAfter(end)) {
            result.add(MonthlyChartEntry.builder()
                    .year(current.getYear())
                    .month(current.getMonthValue())
                    .earnings(earningsMap.getOrDefault(current, BigDecimal.ZERO))
                    .spendings(spendingsMap.getOrDefault(current, BigDecimal.ZERO))
                    .build());
            current = current.plusMonths(1);
        }
        return result;
    }
}
