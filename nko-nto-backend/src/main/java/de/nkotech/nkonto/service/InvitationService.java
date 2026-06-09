package de.nkotech.nkonto.service;

import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.InvitationEntity;
import de.nkotech.nkonto.persistence.repository.CompanyRepository;
import de.nkotech.nkonto.persistence.repository.InvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private static final int TOKEN_BYTES = 48;
    private static final long EXPIRY_DAYS = 7;

    private final InvitationRepository invitationRepository;
    private final CompanyRepository companyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public InvitationEntity create(UUID companyId, String createdByUid) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        InvitationEntity invitation = new InvitationEntity();
        invitation.setToken(token);
        invitation.setCompany(company);
        invitation.setCreatedBy(createdByUid);
        invitation.setExpiresAt(Instant.now().plus(EXPIRY_DAYS, ChronoUnit.DAYS));

        return invitationRepository.save(invitation);
    }

    public InvitationPreview preview(String token) {
        InvitationEntity inv = findValidOrThrow(token);
        return new InvitationPreview(inv.getCompany().getId(), inv.getCompany().getName(), inv.getExpiresAt());
    }

    @Transactional
    public InvitationEntity consume(String token, String newUserUid) {
        InvitationEntity inv = findValidOrThrow(token);
        inv.setUsedAt(Instant.now());
        inv.setUsedBy(newUserUid);
        return invitationRepository.save(inv);
    }

    public List<InvitationEntity> listForCompany(UUID companyId) {
        return invitationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    private InvitationEntity findValidOrThrow(String token) {
        InvitationEntity inv = invitationRepository.findById(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (inv.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation already used");
        }
        if (Instant.now().isAfter(inv.getExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation has expired");
        }
        return inv;
    }

    public record InvitationPreview(UUID companyId, String companyName, Instant expiresAt) {}
}
