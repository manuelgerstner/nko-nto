package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.domain.request.InvoiceRequest;
import de.nkotech.nkonto.domain.type.InvoiceStatus;
import de.nkotech.nkonto.persistence.InvoiceEntity;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService service;
    private final SecurityService securityService;

    @GetMapping
    public Page<InvoiceEntity> list(
            @PageableDefault(size = 20, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        UUID companyId = securityService.currentCompanyId();
        return service.list(pageable, search, status, from, to, companyId);
    }

    @GetMapping("/{id}")
    public InvoiceEntity get(@PathVariable UUID id) {
        UUID companyId = securityService.currentCompanyId();
        return service.get(id, companyId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceEntity create(@Valid @RequestBody InvoiceRequest request) {
        UUID companyId = securityService.currentCompanyId();
        return service.create(request, companyId);
    }

    @PutMapping("/{id}")
    public InvoiceEntity update(@PathVariable UUID id, @Valid @RequestBody InvoiceRequest request) {
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
