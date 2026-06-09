package de.nkotech.nkonto.service;

import de.nkotech.nkonto.config.NkoNtoProperties;
import de.nkotech.nkonto.domain.request.BillRequest;
import de.nkotech.nkonto.domain.request.LineItemRequest;
import de.nkotech.nkonto.domain.type.BillStatus;
import de.nkotech.nkonto.persistence.BillEntity;
import de.nkotech.nkonto.persistence.BillLineEntity;
import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.ContactEntity;
import de.nkotech.nkonto.persistence.repository.BillRepository;
import de.nkotech.nkonto.persistence.repository.CompanyRepository;
import de.nkotech.nkonto.persistence.repository.ContactRepository;
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
public class BillService {

    private final BillRepository repository;
    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final NkoNtoProperties properties;

    public Page<BillEntity> list(Pageable pageable, String search,
                                 BillStatus status, LocalDate from, LocalDate to, UUID companyId) {
        Specification<BillEntity> spec = Specification
                .where(forCompany(companyId))
                .and(referenceContains(search))
                .and(hasStatus(status))
                .and(fromDate(from))
                .and(toDate(to));
        return repository.findAll(spec, pageable);
    }

    private static Specification<BillEntity> forCompany(UUID companyId) {
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }

    private static Specification<BillEntity> referenceContains(String search) {
        return (root, query, cb) -> (search == null || search.isBlank())
                ? cb.conjunction()
                : cb.like(cb.lower(root.get("reference")), "%" + search.toLowerCase().trim() + "%");
    }

    private static Specification<BillEntity> hasStatus(BillStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction()
                : cb.equal(root.get("status"), status);
    }

    private static Specification<BillEntity> fromDate(LocalDate from) {
        return (root, query, cb) -> from == null
                ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("issueDate"), from);
    }

    private static Specification<BillEntity> toDate(LocalDate to) {
        return (root, query, cb) -> to == null
                ? cb.conjunction()
                : cb.lessThanOrEqualTo(root.get("issueDate"), to);
    }

    public BillEntity get(UUID id, UUID companyId) {
        BillEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found"));
        if (!companyId.equals(entity.getCompany().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found");
        }
        return entity;
    }

    @Transactional
    public BillEntity create(BillRequest request, UUID companyId) {
        BillEntity entity = new BillEntity();
        CompanyEntity company = companyRepository.getReferenceById(companyId);
        entity.setCompany(company);
        applyRequest(entity, request, companyId);
        return repository.save(entity);
    }

    @Transactional
    public BillEntity update(UUID id, BillRequest request, UUID companyId) {
        BillEntity entity = get(id, companyId);
        applyRequest(entity, request, companyId);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        get(id, companyId);
        repository.deleteById(id);
    }

    private void applyRequest(BillEntity entity, BillRequest request, UUID companyId) {
        validateCurrency(request.getCurrency());

        entity.setReference(request.getReference());
        entity.setIssueDate(request.getIssueDate());
        entity.setDueDate(request.getDueDate());
        entity.setCurrency(request.getCurrency());
        entity.setStatus(request.getStatus());
        entity.setCategory(request.getCategory());
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
                BillLineEntity line = buildLine(lr, i);
                line.setBill(entity);
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

    private BillLineEntity buildLine(LineItemRequest lr, int sortOrder) {
        BigDecimal vatRate = lr.getVatRate() != null ? lr.getVatRate() : BigDecimal.ZERO;
        BigDecimal lineNet = lr.getQuantity()
                .multiply(lr.getUnitPrice())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal vatAmount = lineNet
                .multiply(vatRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BillLineEntity line = new BillLineEntity();
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
