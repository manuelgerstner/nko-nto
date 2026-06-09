package de.nkotech.nkonto.service;

import de.nkotech.nkonto.config.NkoNtoProperties;
import de.nkotech.nkonto.domain.request.ContactRequest;
import de.nkotech.nkonto.domain.type.ContactType;
import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.ContactEntity;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository repository;
    private final CompanyRepository companyRepository;
    private final NkoNtoProperties properties;

    public Page<ContactEntity> list(Pageable pageable, String search, ContactType type, UUID companyId) {
        Specification<ContactEntity> spec = Specification
                .where(forCompany(companyId))
                .and(nameContains(search))
                .and(hasType(type));
        return repository.findAll(spec, pageable);
    }

    private static Specification<ContactEntity> forCompany(UUID companyId) {
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }

    private static Specification<ContactEntity> nameContains(String search) {
        return (root, query, cb) -> (search == null || search.isBlank())
                ? cb.conjunction()
                : cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase().trim() + "%");
    }

    private static Specification<ContactEntity> hasType(ContactType type) {
        return (root, query, cb) -> type == null
                ? cb.conjunction()
                : cb.equal(root.get("type"), type);
    }

    public ContactEntity get(UUID id, UUID companyId) {
        ContactEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
        if (!companyId.equals(entity.getCompany() != null ? entity.getCompany().getId() : null)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found");
        }
        return entity;
    }

    @Transactional
    public ContactEntity create(ContactRequest request, UUID companyId) {
        ContactEntity entity = new ContactEntity();
        CompanyEntity company = companyRepository.getReferenceById(companyId);
        entity.setCompany(company);
        applyRequest(entity, request);
        return repository.save(entity);
    }

    @Transactional
    public ContactEntity update(UUID id, ContactRequest request, UUID companyId) {
        ContactEntity entity = get(id, companyId);
        applyRequest(entity, request);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        get(id, companyId);
        repository.deleteById(id);
    }

    private void applyRequest(ContactEntity entity, ContactRequest request) {
        entity.setName(request.getName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setStreet(request.getStreet());
        entity.setPostalCode(request.getPostalCode());
        entity.setState(request.getState());
        entity.setCountry(request.getCountry());
        entity.setType(request.getType());
        entity.setVatId(request.getVatId());
        entity.setNotes(request.getNotes());

        String dc = request.getDefaultCurrency();
        if (dc != null && !dc.isBlank()) {
            if (!properties.getSupportedCurrencies().contains(dc)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unsupported currency: " + dc + ". Supported: " + properties.getSupportedCurrencies());
            }
            entity.setDefaultCurrency(dc);
        } else {
            entity.setDefaultCurrency(null);
        }
    }
}
