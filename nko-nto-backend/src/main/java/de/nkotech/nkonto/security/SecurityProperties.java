package de.nkotech.nkonto.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "nkonto.security")
public class SecurityProperties {
    private List<String> superAdmins = List.of();
}
