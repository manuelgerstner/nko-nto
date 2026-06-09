package de.nkotech.nkonto.persistence;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import de.nkotech.nkonto.domain.type.InvoiceStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Table(name = "invoice")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "company"})
public class InvoiceEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String number;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private ContactEntity contact;

    @Column(nullable = false)
    private LocalDate issueDate;

    private LocalDate dueDate;

    @Column(nullable = false, length = 10)
    private String currency = "EUR";

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sortOrder ASC")
    @ToString.Exclude
    private List<InvoiceLineEntity> lines = new ArrayList<>();

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
        if (status == null) status = InvoiceStatus.DRAFT;
        if (currency == null) currency = "EUR";
    }
}
