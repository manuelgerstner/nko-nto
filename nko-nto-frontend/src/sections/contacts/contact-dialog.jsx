import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, FormHelperText, InputLabel, MenuItem, Select,
  Stack, TextField, Typography,
} from '@mui/material';

import { createContact, updateContact } from '../../utils/api';

const CURRENCIES    = ['EUR', 'USD', 'ZAR'];
const CONTACT_TYPES = ['CUSTOMER', 'SUPPLIER', 'BOTH'];
const EMPTY = {
  name: '', email: '', phone: '',
  street: '', postalCode: '', state: '', country: '',
  type: 'CUSTOMER', vatId: '', defaultCurrency: '', notes: '',
};

function fromInitial(d) {
  return {
    name:            d.name            ?? '',
    email:           d.email           ?? '',
    phone:           d.phone           ?? '',
    street:          d.street          ?? '',
    postalCode:      d.postalCode      ?? '',
    state:           d.state           ?? '',
    country:         d.country         ?? '',
    type:            d.type            ?? 'CUSTOMER',
    vatId:           d.vatId           ?? '',
    defaultCurrency: d.defaultCurrency ?? '',
    notes:           d.notes           ?? '',
  };
}

export default function ContactDialog({ open, onClose, onSuccess, initialData }) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(isEdit ? fromInitial(initialData) : EMPTY);
      setErrors({});
      setApiError('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('contacts.nameRequired');
    if (!form.type)        e.type = t('contacts.typeRequired');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError('');
    const payload = {
      name:            form.name.trim(),
      email:           form.email           || null,
      phone:           form.phone           || null,
      street:          form.street          || null,
      postalCode:      form.postalCode      || null,
      state:           form.state           || null,
      country:         form.country         || null,
      type:            form.type,
      vatId:           form.vatId           || null,
      defaultCurrency: form.defaultCurrency || null,
      notes:           form.notes           || null,
    };
    try {
      if (isEdit) {
        await updateContact(initialData.id, payload);
      } else {
        await createContact(payload);
      }
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? t('contacts.editContact') : t('contacts.newContact')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}

          <TextField
            label={t('common.name')} required autoFocus fullWidth
            value={form.name} onChange={set('name')}
            error={!!errors.name} helperText={errors.name}
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth required error={!!errors.type}>
              <InputLabel>{t('common.type')}</InputLabel>
              <Select value={form.type} label={t('common.type')} onChange={set('type')}>
                {CONTACT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{t(`contactType.${type}`)}</MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('contacts.defaultCurrency')}</InputLabel>
              <Select value={form.defaultCurrency} label={t('contacts.defaultCurrency')} onChange={set('defaultCurrency')}>
                <MenuItem value=""><em>{t('common.none')}</em></MenuItem>
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label={t('common.email')} type="email" fullWidth value={form.email} onChange={set('email')} />
            <TextField label={t('common.phone')} fullWidth value={form.phone} onChange={set('phone')} />
          </Stack>

          <TextField label={t('contacts.vatId')} fullWidth value={form.vatId} onChange={set('vatId')} />

          <Box>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {t('contacts.streetAddress')}
              </Typography>
            </Divider>
            <Stack spacing={2}>
              <TextField label={t('contacts.streetAddress')} fullWidth value={form.street} onChange={set('street')} />
              <Stack direction="row" spacing={2}>
                <TextField label={t('contacts.postalCode')} value={form.postalCode} onChange={set('postalCode')} />
                <TextField label={t('contacts.stateProvince')} fullWidth value={form.state} onChange={set('state')} />
              </Stack>
              <TextField label={t('contacts.country')} fullWidth value={form.country} onChange={set('country')} />
            </Stack>
          </Box>

          <TextField label={t('common.notes')} multiline rows={2} fullWidth value={form.notes} onChange={set('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('contacts.createContact')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ContactDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};

ContactDialog.defaultProps = {
  initialData: null,
};
