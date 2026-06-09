package de.nkotech.nkonto.persistence;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import de.nkotech.nkonto.domain.type.ContactType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Data
@Table(name = "contact")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "company"})
public class ContactEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;

    private String street;
    private String postalCode;
    private String state;
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactType type;

    private String vatId;

    @Column(length = 10)
    private String defaultCurrency;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private CompanyEntity company;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
