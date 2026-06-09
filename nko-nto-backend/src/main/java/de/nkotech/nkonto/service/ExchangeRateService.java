package de.nkotech.nkonto.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.nkotech.nkonto.config.NkoNtoProperties;
import de.nkotech.nkonto.persistence.ExchangeRateEntity;
import de.nkotech.nkonto.persistence.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private static final String ECB_URL =
            "https://data-api.ecb.europa.eu/service/data/EXR/D.{currencies}.EUR.SP00.A" +
            "?format=jsondata&lastNObservations=1";

    private static final String ECB_HISTORY_URL =
            "https://data-api.ecb.europa.eu/service/data/EXR/D.{currency}.EUR.SP00.A" +
            "?format=jsondata&startPeriod={startDate}&endPeriod={endDate}";

    private final ExchangeRateRepository repository;
    private final NkoNtoProperties properties;
    private final ObjectMapper objectMapper;

    public Page<ExchangeRateEntity> list(Pageable pageable, String currency, LocalDate from, LocalDate to) {
        Specification<ExchangeRateEntity> spec = Specification
                .where(hasCurrency(currency))
                .and(fromDate(from))
                .and(toDate(to));
        return repository.findAll(spec, pageable);
    }

    private static Specification<ExchangeRateEntity> hasCurrency(String currency) {
        return (root, query, cb) -> (currency == null || currency.isBlank())
                ? cb.conjunction()
                : cb.equal(cb.upper(root.get("currency")), currency.toUpperCase().trim());
    }

    private static Specification<ExchangeRateEntity> fromDate(LocalDate from) {
        return (root, query, cb) -> from == null
                ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("rateDate"), from);
    }

    private static Specification<ExchangeRateEntity> toDate(LocalDate to) {
        return (root, query, cb) -> to == null
                ? cb.conjunction()
                : cb.lessThanOrEqualTo(root.get("rateDate"), to);
    }

    @Transactional
    public void fetchAndStore() {
        List<String> currencies = properties.getCurrencies();
        if (currencies.isEmpty()) {
            log.warn("No currencies configured under nkonto.currencies — skipping ECB fetch");
            return;
        }

        String currencyKey = String.join("+", currencies);
        String url = ECB_URL.replace("{currencies}", currencyKey);
        log.info("Fetching ECB exchange rates for {} from {}", currencies, url);

        String body = RestClient.create()
                .get()
                .uri(url)
                .header("Accept", "application/json")
                .retrieve()
                .body(String.class);

        Map<String, RateEntry> rates = parseEcbResponse(body);
        if (rates.isEmpty()) {
            log.warn("ECB response parsed but contained no rates");
            return;
        }

        int saved = 0;
        for (Map.Entry<String, RateEntry> entry : rates.entrySet()) {
            String currency = entry.getKey();
            RateEntry re = entry.getValue();

            // Upsert: skip if we already have this date+currency
            if (repository.findByRateDateAndCurrency(re.date(), currency).isPresent()) {
                log.debug("Rate for {}/{} already stored, skipping", currency, re.date());
                continue;
            }

            ExchangeRateEntity entity = new ExchangeRateEntity();
            entity.setRateDate(re.date());
            entity.setCurrency(currency);
            entity.setBaseCurrency("EUR");
            entity.setRate(re.rate());
            repository.save(entity);
            saved++;
            log.info("Stored 1 EUR = {} {} on {}", re.rate(), currency, re.date());
        }
        log.info("ECB fetch complete — {} new rate(s) stored", saved);
    }

    /**
     * Parses the ECB SDMX-JSON response.
     *
     * The series key format is "FREQ_IDX:CURRENCY_IDX:DENOM_IDX:TYPE_IDX:SUFFIX_IDX".
     * The CURRENCY dimension position is located by scanning structure.dimensions.series.
     * The observation date is read from structure.dimensions.observation[TIME_PERIOD].
     */
    private Map<String, RateEntry> parseEcbResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode seriesDims = root.path("structure").path("dimensions").path("series");

            // Find which position in the series key holds the currency code
            int currencyDimIdx = -1;
            for (int i = 0; i < seriesDims.size(); i++) {
                if ("CURRENCY".equals(seriesDims.get(i).path("id").asText())) {
                    currencyDimIdx = i;
                    break;
                }
            }
            if (currencyDimIdx < 0) {
                log.error("Could not find CURRENCY dimension in ECB response");
                return Map.of();
            }

            // Build idx → currency code lookup
            JsonNode currencyValues = seriesDims.get(currencyDimIdx).path("values");
            Map<Integer, String> idxToCurrency = new HashMap<>();
            for (int i = 0; i < currencyValues.size(); i++) {
                idxToCurrency.put(i, currencyValues.get(i).path("id").asText());
            }

            // The single observation date (lastNObservations=1 → only one time period)
            JsonNode obsDims = root.path("structure").path("dimensions").path("observation");
            LocalDate rateDate = null;
            for (JsonNode obsDim : obsDims) {
                if ("TIME_PERIOD".equals(obsDim.path("id").asText())) {
                    String dateStr = obsDim.path("values").get(0).path("id").asText();
                    rateDate = LocalDate.parse(dateStr);
                    break;
                }
            }
            if (rateDate == null) {
                log.error("Could not find TIME_PERIOD in ECB response");
                return Map.of();
            }

            // Extract rate per currency from dataSets[0].series
            Map<String, RateEntry> result = new HashMap<>();
            JsonNode series = root.path("dataSets").get(0).path("series");
            final LocalDate finalDate = rateDate;
            final int finalCurrencyDimIdx = currencyDimIdx;

            series.fields().forEachRemaining(entry -> {
                String[] parts = entry.getKey().split(":");
                int cIdx = Integer.parseInt(parts[finalCurrencyDimIdx]);
                String currency = idxToCurrency.get(cIdx);

                JsonNode firstObs = entry.getValue().path("observations").path("0");
                if (!firstObs.isMissingNode() && firstObs.isArray() && !firstObs.isEmpty()) {
                    BigDecimal rate = BigDecimal.valueOf(firstObs.get(0).asDouble());
                    result.put(currency, new RateEntry(finalDate, rate));
                }
            });

            return result;
        } catch (Exception e) {
            log.error("Failed to parse ECB JSON response: {}", e.getMessage(), e);
            return Map.of();
        }
    }

    @Transactional
    public BackfillResult backfill(LocalDate startDate, LocalDate endDate, String currency) {
        String url = ECB_HISTORY_URL
                .replace("{currency}", currency)
                .replace("{startDate}", startDate.toString())
                .replace("{endDate}", endDate.toString());
        log.info("Backfilling ECB rates for {} from {} to {}", currency, startDate, endDate);

        String body = RestClient.create()
                .get()
                .uri(url)
                .header("Accept", "application/json")
                .retrieve()
                .body(String.class);

        Map<LocalDate, BigDecimal> rates = parseEcbResponseMultiObs(body);
        if (rates.isEmpty()) {
            log.warn("ECB backfill response for {} contained no rates", currency);
            return new BackfillResult(0, 0);
        }

        int saved = 0, skipped = 0;
        for (Map.Entry<LocalDate, BigDecimal> entry : rates.entrySet()) {
            LocalDate rateDate = entry.getKey();
            if (repository.findByRateDateAndCurrency(rateDate, currency).isPresent()) {
                skipped++;
                continue;
            }
            ExchangeRateEntity entity = new ExchangeRateEntity();
            entity.setRateDate(rateDate);
            entity.setCurrency(currency);
            entity.setBaseCurrency("EUR");
            entity.setRate(entry.getValue());
            repository.save(entity);
            saved++;
        }
        log.info("Backfill complete for {} — {} saved, {} skipped", currency, saved, skipped);
        return new BackfillResult(saved, skipped);
    }

    private Map<LocalDate, BigDecimal> parseEcbResponseMultiObs(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);

            // Build observation-index → date lookup from TIME_PERIOD dimension
            JsonNode obsDims = root.path("structure").path("dimensions").path("observation");
            Map<Integer, LocalDate> idxToDate = new HashMap<>();
            for (JsonNode obsDim : obsDims) {
                if ("TIME_PERIOD".equals(obsDim.path("id").asText())) {
                    JsonNode values = obsDim.path("values");
                    for (int i = 0; i < values.size(); i++) {
                        idxToDate.put(i, LocalDate.parse(values.get(i).path("id").asText()));
                    }
                    break;
                }
            }
            if (idxToDate.isEmpty()) {
                log.error("No TIME_PERIOD values found in ECB backfill response");
                return Map.of();
            }

            // All observations come from the first (and only) series in the response
            Map<LocalDate, BigDecimal> result = new HashMap<>();
            JsonNode series = root.path("dataSets").get(0).path("series");
            series.fields().forEachRemaining(entry -> {
                JsonNode observations = entry.getValue().path("observations");
                observations.fields().forEachRemaining(obs -> {
                    int idx = Integer.parseInt(obs.getKey());
                    LocalDate date = idxToDate.get(idx);
                    JsonNode obsArray = obs.getValue();
                    if (date != null && obsArray.isArray() && !obsArray.isEmpty() && !obsArray.get(0).isNull()) {
                        result.put(date, BigDecimal.valueOf(obsArray.get(0).asDouble()));
                    }
                });
            });

            return result;
        } catch (Exception e) {
            log.error("Failed to parse ECB multi-obs JSON response: {}", e.getMessage(), e);
            return Map.of();
        }
    }

    public Map<String, Map<String, BigDecimal>> getRatesForDates(List<String> currencies, List<LocalDate> dates) {
        Map<String, Map<String, BigDecimal>> result = new HashMap<>();
        for (String currency : currencies) {
            Map<String, BigDecimal> dateRateMap = new HashMap<>();
            for (LocalDate date : dates) {
                repository.findFirstByCurrencyAndRateDateLessThanEqualOrderByRateDateDesc(currency, date)
                        .ifPresent(r -> dateRateMap.put(date.toString(), r.getRate()));
            }
            result.put(currency, dateRateMap);
        }
        return result;
    }

    public record BackfillResult(int saved, int skipped) {}

    private record RateEntry(LocalDate date, BigDecimal rate) {}
}
