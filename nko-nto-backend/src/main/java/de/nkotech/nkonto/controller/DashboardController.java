package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.domain.response.DashboardSummaryResponse;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;
    private final SecurityService securityService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        UUID companyId = securityService.currentCompanyId();
        return service.summary(companyId);
    }
}
