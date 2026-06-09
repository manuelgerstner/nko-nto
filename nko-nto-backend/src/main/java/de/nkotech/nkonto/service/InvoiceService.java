package de.nkotech.nkonto.service;

import de.nkotech.nkonto.config.NkoNtoProperties;
import de.nkotech.nkonto.domain.request.InvoiceRequest;
import de.nkotech.nkonto.domain.request.LineItemRequest;
import de.nkotech.nkonto.domain.type.InvoiceStatus;
import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.ContactEntity;
import de.nkotech.nkonto.persistence.InvoiceEntity;
import de.nkotech.nkonto.persistence.InvoiceLineEntity;
import de.nkotech.nkonto.persistence.repository.CompanyRepository;
import de.nkotech.nkonto.persistence.repository.ContactRepository;
import de.nkotech.nkonto.persistence.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository repository;
    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final NkoNtoProperties properties;

    public Page<InvoiceEntity> list(Pageable pageable, String search,
                                    InvoiceStatus status, LocalDate from, LocalDate to, UUID companyId) {
        Specification<InvoiceEntity> spec = Specification
                .where(forCompany(companyId))
                .and(numberContains(search))
                .and(hasStatus(status))
                .and(fromDate(from))
                .and(toDate(to));
        return repository.findAll(spec, pageable);
    }

    private static Specification<InvoiceEntity> forCompany(UUID companyId) {
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }

    private static Specification<InvoiceEntity> numberContains(String search) {
        return (root, query, cb) -> (search == null || search.isBlank())
                ? cb.conjunction()
                : cb.like(cb.lower(root.get("number")), "%" + search.toLowerCase().trim() + "%");
    }

    private static Specification<InvoiceEntity> hasStatus(InvoiceStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction()
                : cb.equal(root.get("status"), status);
    }

    private static Specification<InvoiceEntity> fromDate(LocalDate from) {
        return (root, query, cb) -> from == null
                ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("issueDate"), from);
    }

    private static Specification<InvoiceEntity> toDate(LocalDate to) {
        return (root, query, cb) -> to == null
                ? cb.conjunction()
                : cb.lessThanOrEqualTo(root.get("issueDate"), to);
    }

    public InvoiceEntity get(UUID id, UUID companyId) {
        InvoiceEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));
        if (!companyId.equals(entity.getCompany().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found");
        }
        return entity;
    }

    @Transactional
    public InvoiceEntity create(InvoiceRequest request, UUID companyId) {
        InvoiceEntity entity = new InvoiceEntity();
        CompanyEntity company = companyRepository.getReferenceById(companyId);
        entity.setCompany(company);
        applyRequest(entity, request, companyId);
        return repository.save(entity);
    }

    @Transactional
    public InvoiceEntity update(UUID id, InvoiceRequest request, UUID companyId) {
        InvoiceEntity entity = get(id, companyId);
        applyRequest(entity, request, companyId);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        get(id, companyId);
        repository.deleteById(id);
    }

    private void applyRequest(InvoiceEntity entity, InvoiceRequest request, UUID companyId) {
        validateCurrency(request.getCurrency());

        entity.setNumber(request.getNumber());
        entity.setIssueDate(request.getIssueDate());
        entity.setDueDate(request.getDueDate());
        entity.setCurrency(request.getCurrency());
        entity.setStatus(request.getStatus());
        entity.setNotes(request.getNotes());

        if (request.getContactId() != null) {
            ContactEntity contact = contactRepository.findById(request.getContactId())
                    .filter(c -> companyId.equals(c.getCompany() != null ? c.getCompany().getId() : null))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact not found"));
            entity.setContact(contact);
        } else {
            entity.setContact(null);
        }

        boolean hasLines = request.getLines() != null && !request.getLines().isEmpty();

        entity.getLines().clear();
        if (hasLines) {
            BigDecimal total = BigDecimal.ZERO;
            List<LineItemRequest> lineRequests = request.getLines();
            for (int i = 0; i < lineRequests.size(); i++) {
                LineItemRequest lr = lineRequests.get(i);
                InvoiceLineEntity line = buildLine(lr, i);
                line.setInvoice(entity);
                entity.getLines().add(line);
                total = total.add(line.getLineTotal());
            }
            entity.setAmount(total);
        } else {
            if (request.getAmount() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Amount is required when no line items are provided");
            }
            entity.setAmount(request.getAmount());
        }
    }

    private InvoiceLineEntity buildLine(LineItemRequest lr, int sortOrder) {
        BigDecimal vatRate = lr.getVatRate() != null ? lr.getVatRate() : BigDecimal.ZERO;
        BigDecimal lineNet = lr.getQuantity()
                .multiply(lr.getUnitPrice())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal vatAmount = lineNet
                .multiply(vatRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        InvoiceLineEntity line = new InvoiceLineEntity();
        line.setDescription(lr.getDescription());
        line.setQuantity(lr.getQuantity());
        line.setUnitPrice(lr.getUnitPrice());
        line.setVatRate(vatRate);
        line.setLineTotal(lineNet.add(vatAmount));
        line.setSortOrder(sortOrder);
        return line;
    }

    private void validateCurrency(String currency) {
        if (!properties.getSupportedCurrencies().contains(currency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported currency: " + currency + ". Supported: " + properties.getSupportedCurrencies());
        }
    }
}
