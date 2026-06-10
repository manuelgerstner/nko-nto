package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.domain.type.BillStatus;
import de.nkotech.nkonto.persistence.BillEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BillRepository extends JpaRepository<BillEntity, UUID>,
        JpaSpecificationExecutor<BillEntity> {

    @Query("SELECT COUNT(b) FROM BillEntity b WHERE b.status IN :statuses AND b.company.id = :companyId")
    long countByStatusInAndCompanyId(List<BillStatus> statuses, UUID companyId);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM BillEntity b WHERE b.status IN :statuses AND b.company.id = :companyId")
    BigDecimal sumAmountByStatusInAndCompanyId(List<BillStatus> statuses, UUID companyId);

    @Query("SELECT YEAR(b.issueDate), MONTH(b.issueDate), COALESCE(SUM(b.amount), 0) " +
           "FROM BillEntity b " +
           "WHERE b.status = de.nkotech.nkonto.domain.type.BillStatus.PAID " +
           "AND b.company.id = :companyId AND b.issueDate >= :fromDate " +
           "GROUP BY YEAR(b.issueDate), MONTH(b.issueDate) " +
           "ORDER BY YEAR(b.issueDate), MONTH(b.issueDate)")
    List<Object[]> sumPaidByMonthSince(@Param("companyId") UUID companyId, @Param("fromDate") LocalDate fromDate);
}
