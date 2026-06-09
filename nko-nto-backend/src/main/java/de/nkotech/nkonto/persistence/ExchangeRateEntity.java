package de.nkotech.nkonto.persistence;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Data
@Table(name = "exchange_rate")
public class ExchangeRateEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private LocalDate rateDate;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(nullable = false, length = 10)
    private String baseCurrency;

    @Column(nullable = false, precision = 18, scale = 6)
    private BigDecimal rate;

    @Column(nullable = false, updatable = false)
    private Instant fetchedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (fetchedAt == null) fetchedAt = Instant.now();
    }
}
