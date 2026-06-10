import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField,
} from '@mui/material';

import { createItem, updateItem } from '../../utils/api';

const CURRENCIES = ['EUR', 'USD', 'ZAR'];
const EMPTY = () => ({ name: '', defaultPrice: '', defaultVatRate: '0', currency: 'EUR' });

function fromInitial(d) {
  return {
    name:           d.name            ?? '',
    defaultPrice:   String(d.defaultPrice  ?? ''),
    defaultVatRate: String(d.defaultVatRate ?? '0'),
    currency:       d.currency        ?? 'EUR',
  };
}

export default function ItemDialog({ open, onClose, onSuccess, initialData }) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [form, setForm]         = useState(EMPTY());
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(isEdit ? fromInitial(initialData) : EMPTY());
      setErrors({});
      setApiError('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                         e.name         = t('items.nameRequired');
    if (!form.defaultPrice || parseFloat(form.defaultPrice) < 0)  e.defaultPrice  = t('items.defaultPriceRequired');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError('');
    const payload = {
      name:           form.name.trim(),
      defaultPrice:   parseFloat(form.defaultPrice),
      defaultVatRate: parseFloat(form.defaultVatRate) || 0,
      currency:       form.currency,
    };
    try {
      if (isEdit) {
        await updateItem(initialData.id, payload);
      } else {
        await createItem(payload);
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
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? t('items.editItem') : t('items.newItem')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}

          <TextField
            label={t('items.name')} required fullWidth autoFocus
            value={form.name} onChange={setField('name')}
            error={!!errors.name} helperText={errors.name}
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>{t('items.currency')}</InputLabel>
              <Select value={form.currency} label={t('items.currency')} onChange={setField('currency')}>
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label={t('items.defaultVatRate')} fullWidth type="number"
              inputProps={{ min: 0, max: 100, step: 1 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              value={form.defaultVatRate} onChange={setField('defaultVatRate')}
            />
          </Stack>

          <TextField
            label={t('items.defaultPrice')} required fullWidth type="number"
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{ startAdornment: <InputAdornment position="start">{form.currency}</InputAdornment> }}
            value={form.defaultPrice} onChange={setField('defaultPrice')}
            error={!!errors.defaultPrice} helperText={errors.defaultPrice}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('items.createItem')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ItemDialog.propTypes = {
  open:        PropTypes.bool.isRequired,
  onClose:     PropTypes.func.isRequired,
  onSuccess:   PropTypes.func.isRequired,
  initialData: PropTypes.object,
};

ItemDialog.defaultProps = {
  initialData: null,
};
