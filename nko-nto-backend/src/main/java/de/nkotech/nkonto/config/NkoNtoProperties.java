package de.nkotech.nkonto.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "nkonto")
public class NkoNtoProperties {

    private Cors cors = new Cors();
    private List<String> currencies = List.of("USD", "ZAR");
    private List<String> supportedCurrencies = List.of("EUR", "USD", "ZAR");

    @Data
    public static class Cors {
        private List<String> allowedOrigins = List.of();
    }
}
