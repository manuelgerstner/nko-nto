package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.InvitationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<InvitationEntity, String> {
    List<InvitationEntity> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
