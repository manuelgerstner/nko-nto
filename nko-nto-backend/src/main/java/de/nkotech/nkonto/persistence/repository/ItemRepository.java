package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.ItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<ItemEntity, UUID> {

    List<ItemEntity> findAllByCompany_IdOrderByNameAsc(UUID companyId);
}
