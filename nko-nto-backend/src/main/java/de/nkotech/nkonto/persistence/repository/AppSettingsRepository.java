package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.AppSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AppSettingsRepository extends JpaRepository<AppSettingsEntity, UUID> {
    Optional<AppSettingsEntity> findByCompanyId(UUID companyId);
}
