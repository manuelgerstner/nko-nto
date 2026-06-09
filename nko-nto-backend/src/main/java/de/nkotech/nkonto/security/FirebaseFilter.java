package de.nkotech.nkonto.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import de.nkotech.nkonto.persistence.repository.AppUserRepository;
import de.nkotech.nkonto.security.models.AuthUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class FirebaseFilter extends OncePerRequestFilter {

    private final FirebaseAuth firebaseAuth;
    private final AppUserRepository appUserRepository;

    @Value("${nkonto.superadmin-uid:}")
    private String superadminUid;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = extractBearerToken(request);

        if (token != null && !token.equals("null") && !token.equalsIgnoreCase("undefined")) {
            try {
                FirebaseToken decoded = firebaseAuth.verifyIdToken(token);
                AuthUser user = new AuthUser();
                user.setUid(decoded.getUid());
                user.setName(decoded.getName());
                user.setEmail(decoded.getEmail());
                user.setEmailVerified(decoded.isEmailVerified());

                var auth = new UsernamePasswordAuthenticationToken(
                    user, token, authoritiesFromClaims(decoded.getClaims(), decoded.getUid()));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (FirebaseAuthException e) {
                log.warn("Firebase token verification failed: {}", e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> authoritiesFromClaims(Map<String, Object> claims, String uid) {
        if (!superadminUid.isEmpty() && superadminUid.equals(uid)) {
            if (!Boolean.TRUE.equals(claims.get("ROLE_ADMIN"))) {
                try {
                    firebaseAuth.setCustomUserClaims(uid, Map.of("ROLE_ADMIN", true));
                    log.info("Promoted superadmin uid {} to ROLE_ADMIN in Firebase claims", uid);
                } catch (FirebaseAuthException e) {
                    log.warn("Failed to set ROLE_ADMIN claim for superadmin uid {}: {}", uid, e.getMessage());
                }
                appUserRepository.findByFirebaseUid(uid).ifPresent(u -> {
                    u.setRole("ADMIN");
                    appUserRepository.save(u);
                });
            }
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"));
        }
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (Boolean.TRUE.equals(claims.get("ROLE_ADMIN"))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        if (Boolean.TRUE.equals(claims.get("ROLE_USER")) || Boolean.TRUE.equals(claims.get("ROLE_ADMIN"))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return authorities;
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
