package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.ContactEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface ContactRepository extends JpaRepository<ContactEntity, UUID>,
        JpaSpecificationExecutor<ContactEntity> {

    @Query("SELECT COUNT(c) FROM ContactEntity c WHERE c.company.id = :companyId")
    long countByCompanyId(UUID companyId);
}
