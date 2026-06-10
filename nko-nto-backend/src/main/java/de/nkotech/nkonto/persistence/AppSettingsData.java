package de.nkotech.nkonto.persistence;

public record AppSettingsData(
        String primaryCurrency,
        boolean secondaryCurrencyEnabled,
        String secondaryCurrency,
        String taxYearStart,
        String language
) {
    public static AppSettingsData defaults() {
        return new AppSettingsData("EUR", false, null, "01-01", "en");
    }
}
