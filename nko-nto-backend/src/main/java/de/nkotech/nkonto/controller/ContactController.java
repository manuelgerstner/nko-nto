package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.domain.request.ContactRequest;
import de.nkotech.nkonto.domain.type.ContactType;
import de.nkotech.nkonto.persistence.ContactEntity;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService service;
    private final SecurityService securityService;

    @GetMapping
    public Page<ContactEntity> list(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ContactType type) {
        UUID companyId = securityService.currentCompanyId();
        return service.list(pageable, search, type, companyId);
    }

    @GetMapping("/{id}")
    public ContactEntity get(@PathVariable UUID id) {
        UUID companyId = securityService.currentCompanyId();
        return service.get(id, companyId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactEntity create(@Valid @RequestBody ContactRequest request) {
        UUID companyId = securityService.currentCompanyId();
        return service.create(request, companyId);
    }

    @PutMapping("/{id}")
    public ContactEntity update(@PathVariable UUID id, @Valid @RequestBody ContactRequest request) {
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
