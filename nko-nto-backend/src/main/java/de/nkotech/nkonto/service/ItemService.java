package de.nkotech.nkonto.service;

import de.nkotech.nkonto.config.NkoNtoProperties;
import de.nkotech.nkonto.domain.request.ItemRequest;
import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.ItemEntity;
import de.nkotech.nkonto.persistence.repository.CompanyRepository;
import de.nkotech.nkonto.persistence.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository repository;
    private final CompanyRepository companyRepository;
    private final NkoNtoProperties properties;

    public List<ItemEntity> list(UUID companyId) {
        return repository.findAllByCompany_IdOrderByNameAsc(companyId);
    }

    public ItemEntity get(UUID id, UUID companyId) {
        ItemEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        if (!companyId.equals(entity.getCompany() != null ? entity.getCompany().getId() : null)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found");
        }
        return entity;
    }

    @Transactional
    public ItemEntity create(ItemRequest request, UUID companyId) {
        ItemEntity entity = new ItemEntity();
        CompanyEntity company = companyRepository.getReferenceById(companyId);
        entity.setCompany(company);
        applyRequest(entity, request);
        return repository.save(entity);
    }

    @Transactional
    public ItemEntity update(UUID id, ItemRequest request, UUID companyId) {
        ItemEntity entity = get(id, companyId);
        applyRequest(entity, request);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        get(id, companyId);
        repository.deleteById(id);
    }

    private void applyRequest(ItemEntity entity, ItemRequest request) {
        entity.setName(request.getName());
        entity.setDefaultPrice(request.getDefaultPrice());
        entity.setDefaultVatRate(request.getDefaultVatRate() != null ? request.getDefaultVatRate() : BigDecimal.ZERO);
        if (!properties.getSupportedCurrencies().contains(request.getCurrency())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported currency: " + request.getCurrency() + ". Supported: " + properties.getSupportedCurrencies());
        }
        entity.setCurrency(request.getCurrency());
    }
}
