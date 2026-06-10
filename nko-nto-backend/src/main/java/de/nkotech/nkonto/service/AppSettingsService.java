package de.nkotech.nkonto.service;

import de.nkotech.nkonto.persistence.AppSettingsData;
import de.nkotech.nkonto.persistence.AppSettingsEntity;
import de.nkotech.nkonto.persistence.AppSettingsResponse;
import de.nkotech.nkonto.persistence.CompanyEntity;
import de.nkotech.nkonto.persistence.repository.AppSettingsRepository;
import de.nkotech.nkonto.persistence.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    private final AppSettingsRepository repository;
    private final CompanyRepository companyRepository;

    public AppSettingsResponse get(UUID companyId) {
        CompanyEntity company = companyRepository.getReferenceById(companyId);
        AppSettingsData data = repository.findByCompanyId(companyId)
                .map(AppSettingsEntity::getSettings)
                .orElse(AppSettingsData.defaults());
        return AppSettingsResponse.from(data, company.getName());
    }

    @Transactional
    public AppSettingsData update(AppSettingsData data, UUID companyId) {
        AppSettingsEntity entity = repository.findByCompanyId(companyId)
                .orElseGet(() -> {
                    AppSettingsEntity e = new AppSettingsEntity();
                    CompanyEntity company = companyRepository.getReferenceById(companyId);
                    e.setCompany(company);
                    return e;
                });
        entity.setSettings(data);
        return repository.save(entity).getSettings();
    }
}
