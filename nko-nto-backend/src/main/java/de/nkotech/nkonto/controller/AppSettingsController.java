package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.persistence.AppSettingsData;
import de.nkotech.nkonto.persistence.AppSettingsResponse;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.service.AppSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
public class AppSettingsController {

    private final AppSettingsService service;
    private final SecurityService securityService;

    @GetMapping
    public AppSettingsResponse get() {
        UUID companyId = securityService.currentCompanyId();
        return service.get(companyId);
    }

    @PutMapping
    public AppSettingsData update(@RequestBody AppSettingsData data) {
        UUID companyId = securityService.currentCompanyId();
        return service.update(data, companyId);
    }
}
