package de.nkotech.nkonto.service;

import de.nkotech.nkonto.domain.response.DashboardSummaryResponse;
import de.nkotech.nkonto.domain.type.BillStatus;
import de.nkotech.nkonto.domain.type.InvoiceStatus;
import de.nkotech.nkonto.persistence.repository.BillRepository;
import de.nkotech.nkonto.persistence.repository.ContactRepository;
import de.nkotech.nkonto.persistence.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
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
}
