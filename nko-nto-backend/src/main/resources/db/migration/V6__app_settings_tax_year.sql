UPDATE app_settings
SET settings = settings || '{"taxYearStart":"01-01"}'
WHERE settings->>'taxYearStart' IS NULL;
