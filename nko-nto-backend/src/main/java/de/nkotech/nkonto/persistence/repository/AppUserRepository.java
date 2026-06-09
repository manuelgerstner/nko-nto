package de.nkotech.nkonto.persistence.repository;

import de.nkotech.nkonto.persistence.AppUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUserEntity, String> {
    Optional<AppUserEntity> findByFirebaseUid(String firebaseUid);
}
