package de.nkotech.nkonto.security;

import de.nkotech.nkonto.persistence.AppUserEntity;
import de.nkotech.nkonto.persistence.repository.AppUserRepository;
import de.nkotech.nkonto.security.models.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SecurityService {

    private final AppUserRepository appUserRepository;

    public AuthUser currentUser() {
        return (AuthUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public String currentUid() {
        return currentUser().getUid();
    }

    public UUID currentCompanyId() {
        String uid = currentUid();
        AppUserEntity appUser = appUserRepository.findByFirebaseUid(uid)
            .orElseThrow(() -> new IllegalStateException("No app user found for uid: " + uid));
        return appUser.getCompany().getId();
    }
}
