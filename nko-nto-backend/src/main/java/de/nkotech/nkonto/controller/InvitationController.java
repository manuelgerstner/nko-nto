package de.nkotech.nkonto.controller;

import de.nkotech.nkonto.persistence.InvitationEntity;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.service.InvitationService;
import de.nkotech.nkonto.service.InvitationService.InvitationPreview;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;
    private final SecurityService securityService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Map<String, Object>> create() {
        UUID companyId = securityService.currentCompanyId();
        String uid = securityService.currentUid();
        InvitationEntity inv = invitationService.create(companyId, uid);
        return ResponseEntity.ok(Map.of(
                "token", inv.getToken(),
                "expiresAt", inv.getExpiresAt()
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<InvitationSummary> list() {
        UUID companyId = securityService.currentCompanyId();
        return invitationService.listForCompany(companyId).stream()
                .map(InvitationSummary::from)
                .toList();
    }

    @GetMapping("/{token}/preview")
    public InvitationPreview preview(@PathVariable String token) {
        return invitationService.preview(token);
    }

    public record InvitationSummary(
            String token,
            String createdBy,
            Instant createdAt,
            Instant expiresAt,
            boolean used,
            Instant usedAt
    ) {
        static InvitationSummary from(InvitationEntity e) {
            return new InvitationSummary(
                    e.getToken(), e.getCreatedBy(), e.getCreatedAt(),
                    e.getExpiresAt(), e.getUsedAt() != null, e.getUsedAt()
            );
        }
    }
}
