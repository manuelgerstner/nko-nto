package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.CompanyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CompanyRepository extends JpaRepository<CompanyEntity, UUID> {
}
