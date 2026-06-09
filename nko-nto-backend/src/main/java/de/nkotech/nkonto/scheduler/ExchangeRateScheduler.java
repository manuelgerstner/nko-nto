package de.nkotech.nkonto.scheduler;

import de.nkotech.nkonto.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    // 17:00 CET/CEST (Europe/Berlin handles both standard and daylight saving time)
    // ECB publishes reference rates around 16:00 CET each business day
    @Scheduled(cron = "0 0 17 * * MON-FRI", zone = "Europe/Berlin")
    public void fetchDailyRates() {
        log.info("Scheduled ECB exchange rate fetch triggered");
        try {
            exchangeRateService.fetchAndStore();
        } catch (Exception e) {
            log.error("Scheduled ECB fetch failed: {}", e.getMessage(), e);
        }
    }
}
