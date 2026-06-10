package de.nkotech.nkonto.persistence;

public record AppSettingsResponse(
        String primaryCurrency,
        boolean secondaryCurrencyEnabled,
        String secondaryCurrency,
        String taxYearStart,
        String language,
        String companyName
) {
    public static AppSettingsResponse from(AppSettingsData data, String companyName) {
        return new AppSettingsResponse(
                data.primaryCurrency(),
                data.secondaryCurrencyEnabled(),
                data.secondaryCurrency(),
                data.taxYearStart(),
                data.language(),
                companyName
        );
    }
}
