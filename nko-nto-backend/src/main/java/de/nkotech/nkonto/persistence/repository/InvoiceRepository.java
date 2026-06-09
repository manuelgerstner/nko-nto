package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.domain.type.InvoiceStatus;
import de.nkotech.nkonto.persistence.InvoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, UUID>,
        JpaSpecificationExecutor<InvoiceEntity> {

    @Query("SELECT COUNT(i) FROM InvoiceEntity i WHERE i.status IN :statuses AND i.company.id = :companyId")
    long countByStatusInAndCompanyId(List<InvoiceStatus> statuses, UUID companyId);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM InvoiceEntity i WHERE i.status IN :statuses AND i.company.id = :companyId")
    BigDecimal sumAmountByStatusInAndCompanyId(List<InvoiceStatus> statuses, UUID companyId);
}
