package de.nkotech.nkonto.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import de.nkotech.nkonto.persistence.AppUserEntity;
import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.InvitationEntity;
import de.nkotech.nkonto.persistence.repository.AppUserRepository;
import de.nkotech.nkonto.persistence.repository.CompanyRepository;
import de.nkotech.nkonto.security.SecurityService;
import de.nkotech.nkonto.security.models.AuthUser;
import de.nkotech.nkonto.service.InvitationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SecurityService securityService;
    private final CompanyRepository companyRepository;
    private final AppUserRepository appUserRepository;
    private final FirebaseAuth firebaseAuth;
    private final InvitationService invitationService;

    public record RegisterRequest(@NotBlank String name, @NotBlank String companyName) {}

    public record RegisterInviteRequest(@NotBlank String name, @NotBlank String inviteToken) {}

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req)
            throws FirebaseAuthException {
        AuthUser currentUser = securityService.currentUser();
        String uid = currentUser.getUid();

        if (appUserRepository.findByFirebaseUid(uid).isPresent()) {
            return ResponseEntity.ok(Map.of("message", "already registered"));
        }

        CompanyEntity company = new CompanyEntity();
        company.setName(req.companyName());
        companyRepository.save(company);

        AppUserEntity appUser = new AppUserEntity();
        appUser.setFirebaseUid(uid);
        appUser.setCompany(company);
        appUser.setName(req.name());
        appUser.setEmail(currentUser.getEmail());
        appUser.setRole("ADMIN");
        appUserRepository.save(appUser);

        firebaseAuth.setCustomUserClaims(uid, Map.of("ROLE_ADMIN", true));

        return ResponseEntity.ok(Map.of(
            "companyId", company.getId(),
            "userId", uid
        ));
    }

    @PostMapping("/register-invite")
    public ResponseEntity<Map<String, Object>> registerWithInvite(@Valid @RequestBody RegisterInviteRequest req)
            throws FirebaseAuthException {
        AuthUser currentUser = securityService.currentUser();
        String uid = currentUser.getUid();

        if (appUserRepository.findByFirebaseUid(uid).isPresent()) {
            return ResponseEntity.ok(Map.of("message", "already registered"));
        }

        InvitationEntity invitation = invitationService.consume(req.inviteToken(), uid);

        AppUserEntity appUser = new AppUserEntity();
        appUser.setFirebaseUid(uid);
        appUser.setCompany(invitation.getCompany());
        appUser.setName(req.name());
        appUser.setEmail(currentUser.getEmail());
        appUser.setRole("USER");
        appUserRepository.save(appUser);

        firebaseAuth.setCustomUserClaims(uid, Map.of("ROLE_USER", true));

        return ResponseEntity.ok(Map.of(
            "companyId", invitation.getCompany().getId(),
            "userId", uid
        ));
    }
}
