package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.ExchangeRateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRateEntity, UUID>,
        JpaSpecificationExecutor<ExchangeRateEntity> {

    Optional<ExchangeRateEntity> findByRateDateAndCurrency(LocalDate rateDate, String currency);

    List<ExchangeRateEntity> findByRateDateOrderByCurrencyAsc(LocalDate rateDate);

    List<ExchangeRateEntity> findTop30ByCurrencyOrderByRateDateDesc(String currency);

    Optional<ExchangeRateEntity> findFirstByCurrencyAndRateDateLessThanEqualOrderByRateDateDesc(
            String currency, LocalDate date);
}
