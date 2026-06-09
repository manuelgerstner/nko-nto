package de.nkotech.nkonto;

import de.nkotech.nkonto.config.NkoNtoProperties;
import de.nkotech.nkonto.security.SecurityProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({NkoNtoProperties.class, SecurityProperties.class})
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class NkoNtoApplication {
    public static void main(String[] args) {
        SpringApplication.run(NkoNtoApplication.class, args);
    }
}
