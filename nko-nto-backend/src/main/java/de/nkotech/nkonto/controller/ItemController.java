package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.domain.request.ItemRequest;
import de.nkotech.nkonto.persistence.ItemEntity;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService service;
    private final SecurityService securityService;

    @GetMapping
    public List<ItemEntity> list() {
        UUID companyId = securityService.currentCompanyId();
        return service.list(companyId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemEntity create(@Valid @RequestBody ItemRequest request) {
        UUID companyId = securityService.currentCompanyId();
        return service.create(request, companyId);
    }

    @PutMapping("/{id}")
    public ItemEntity update(@PathVariable UUID id, @Valid @RequestBody ItemRequest request) {
        UUID companyId = securityService.currentCompanyId();
        return service.update(id, request, companyId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        UUID companyId = securityService.currentCompanyId();
        service.delete(id, companyId);
    }
}
