package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.persistence.ExchangeRateEntity;
import de.nkotech.nkonto.service.ExchangeRateService;
import de.nkotech.nkonto.service.ExchangeRateService.BackfillResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/exchange-rates")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService service;

    @GetMapping
    public Page<ExchangeRateEntity> list(
            @PageableDefault(size = 20, sort = "rateDate", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.list(pageable, currency, from, to);
    }

    @PostMapping("/fetch")
    public ResponseEntity<Map<String, String>> fetch() {
        service.fetchAndStore();
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/for-dates")
    public Map<String, Map<String, BigDecimal>> getRatesForDates(
            @RequestParam List<String> currencies,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dates) {
        return service.getRatesForDates(currencies, dates);
    }

    @PostMapping("/backfill")
    public ResponseEntity<Map<String, Integer>> backfill(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam String currency) {
        BackfillResult result = service.backfill(startDate, endDate, currency.toUpperCase());
        return ResponseEntity.ok(Map.of("saved", result.saved(), "skipped", result.skipped()));
    }
}
