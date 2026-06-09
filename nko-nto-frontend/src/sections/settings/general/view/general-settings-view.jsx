import { useTranslation } from 'react-i18next';
import {
  Card, CardContent, Checkbox, CircularProgress, FormControlLabel,
  MenuItem, Select, Stack, Typography,
} from '@mui/material';
import { useSettings } from '../../../../contexts/settings-context';

const CURRENCIES = ['EUR', 'USD', 'ZAR'];

const TAX_YEAR_OPTIONS = [
  { value: 'calendar', label: 'settings.taxYearCalendar', start: '01-01' },
  { value: 'za',       label: 'settings.taxYearZA',       start: '03-01' },
];

export default function GeneralSettingsView() {
  const { t } = useTranslation();
  const { settings, updateSettings, loading } = useSettings();

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const handlePrimaryCurrency = (e) => {
    const primary = e.target.value;
    const patch = { primaryCurrency: primary };
    if (settings.secondaryCurrency === primary) patch.secondaryCurrency = null;
    updateSettings(patch);
  };

  const handleSecondaryCurrencyToggle = (e) => {
    const enabled = e.target.checked;
    const patch = { secondaryCurrencyEnabled: enabled };
    if (!enabled) patch.secondaryCurrency = null;
    updateSettings(patch);
  };

  const handleSecondaryCurrency = (e) => {
    updateSettings({ secondaryCurrency: e.target.value });
  };

  const secondaryOptions = CURRENCIES.filter((c) => c !== settings.primaryCurrency);

  const currentTaxYear = TAX_YEAR_OPTIONS.find((o) => o.start === settings.taxYearStart) ?? TAX_YEAR_OPTIONS[0];

  const handleTaxYear = (e) => {
    const opt = TAX_YEAR_OPTIONS.find((o) => o.value === e.target.value);
    updateSettings({ taxYearStart: opt.start });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4">{t('settings.pageTitle')}</Typography>

      <Card>
        <CardContent>
          <Stack spacing={3} sx={{ maxWidth: 400 }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">{t('settings.primaryCurrency')}</Typography>
              <Select
                size="small"
                value={settings.primaryCurrency ?? 'EUR'}
                onChange={handlePrimaryCurrency}
                sx={{ width: 160 }}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.secondaryCurrencyEnabled ?? false}
                  onChange={handleSecondaryCurrencyToggle}
                />
              }
              label={t('settings.activateSecondaryCurrency')}
            />

            {settings.secondaryCurrencyEnabled && (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">{t('settings.secondaryCurrency')}</Typography>
                <Select
                  size="small"
                  value={settings.secondaryCurrency ?? ''}
                  onChange={handleSecondaryCurrency}
                  displayEmpty
                  sx={{ width: 160 }}
                >
                  <MenuItem value="">{t('common.none')}</MenuItem>
                  {secondaryOptions.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </Stack>
            )}

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">{t('settings.taxYear')}</Typography>
              <Select
                size="small"
                value={currentTaxYear.value}
                onChange={handleTaxYear}
                sx={{ width: 340 }}
              >
                {TAX_YEAR_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{t(o.label)}</MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
