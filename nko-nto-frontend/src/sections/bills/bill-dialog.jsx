import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, FormHelperText, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { createBill, getContacts, getItems, updateBill } from '../../utils/api';

const CURRENCIES = ['EUR', 'USD', 'ZAR'];
const STATUSES   = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
const today      = () => new Date().toISOString().split('T')[0];
const emptyLine  = () => ({ itemId: '', description: '', quantity: '1', unitPrice: '', vatRate: '0' });
const EMPTY      = () => ({ reference: '', contactId: '', issueDate: today(), dueDate: '', currency: 'EUR', status: 'PENDING', category: '', notes: '' });

function lineNet(l)   { return (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0); }
function lineVat(l)   { return lineNet(l) * ((parseFloat(l.vatRate) || 0) / 100); }
function lineTotal(l) { return lineNet(l) + lineVat(l); }

function fmt(n, currency) {
  return n.toLocaleString('de-DE', { style: 'currency', currency, minimumFractionDigits: 2 });
}

function fromInitial(d) {
  return {
    reference: d.reference  ?? '',
    contactId: d.contact?.id ?? '',
    issueDate: d.issueDate  ?? today(),
    dueDate:   d.dueDate    ?? '',
    currency:  d.currency   ?? 'EUR',
    status:    d.status     ?? 'PENDING',
    category:  d.category   ?? '',
    notes:     d.notes      ?? '',
  };
}

function fromDuplicate(d) {
  return {
    reference: '',
    contactId: d.contact?.id ?? '',
    issueDate: today(),
    dueDate:   '',
    currency:  d.currency   ?? 'EUR',
    status:    'PENDING',
    category:  d.category   ?? '',
    notes:     d.notes      ?? '',
  };
}

function linesFromInitial(lines, items) {
  if (!lines?.length) return [emptyLine()];
  return lines.map((l) => {
    const matched = items.find((it) => it.name === l.description);
    return {
      itemId:      matched ? matched.id : '',
      description: l.description ?? '',
      quantity:    String(l.quantity  ?? '1'),
      unitPrice:   String(l.unitPrice ?? ''),
      vatRate:     String(l.vatRate   ?? '0'),
    };
  });
}

export default function BillDialog({ open, onClose, onSuccess, initialData, duplicateData }) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [form, setForm]         = useState(EMPTY());
  const [lines, setLines]       = useState([emptyLine()]);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [contacts, setContacts] = useState([]);
  const [items, setItems]       = useState([]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-nested-ternary
      setForm(duplicateData ? fromDuplicate(duplicateData) : isEdit ? fromInitial(initialData) : EMPTY());
      setErrors({});
      setApiError('');
      Promise.all([
        getContacts().catch(() => ({ data: { content: [] } })),
        getItems().catch(() => ({ data: [] })),
      ]).then(([contactsRes, itemsRes]) => {
        setContacts(contactsRes.data.content);
        const loadedItems = itemsRes.data;
        setItems(loadedItems);
        // eslint-disable-next-line no-nested-ternary
        setLines(duplicateData ? linesFromInitial(duplicateData.lines, loadedItems) : isEdit ? linesFromInitial(initialData.lines, loadedItems) : [emptyLine()]);
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField   = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));
  const setLine    = (i, f) => (e) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [f]: e.target.value } : l));
  const addLine    = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const handleItemSelect = (i) => (e) => {
    const itemId = e.target.value;
    const item = items.find((it) => it.id === itemId);
    setLines((prev) => prev.map((l, idx) => idx === i
      ? { ...l, itemId, description: item ? item.name : '', unitPrice: item ? String(item.defaultPrice) : '', vatRate: item ? String(item.defaultVatRate) : '0' }
      : l));
  };

  const handleCurrencyChange = (e) => {
    const currency = e.target.value;
    setForm((prev) => ({ ...prev, currency }));
    setLines((prev) => prev.map((l) => {
      if (!l.itemId) return l;
      const item = items.find((it) => it.id === l.itemId);
      if (item && item.currency !== currency) return emptyLine();
      return l;
    }));
  };

  const handleContactChange = (e) => {
    const id = e.target.value;
    setForm((prev) => ({ ...prev, contactId: id }));
    if (id) {
      const contact = contacts.find((c) => c.id === id);
      if (contact?.defaultCurrency) setForm((prev) => ({ ...prev, contactId: id, currency: contact.defaultCurrency }));
    }
  };

  const hasValidLines = lines.some((l) => l.itemId && parseFloat(l.unitPrice) > 0);
  const subtotal = lines.reduce((s, l) => s + lineNet(l), 0);
  const vatTotal = lines.reduce((s, l) => s + lineVat(l), 0);
  const total    = subtotal + vatTotal;

  const validate = () => {
    const e = {};
    if (!form.reference.trim()) e.reference = t('bills.referenceRequired');
    if (!form.issueDate)        e.issueDate  = t('bills.issueDateRequired');
    if (!form.currency)         e.currency   = t('bills.currencyRequired');
    if (!form.status)           e.status     = t('bills.statusRequired');
    if (!hasValidLines)         e.lines      = t('bills.linesRequired');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError('');
    const payload = {
      reference: form.reference.trim(),
      contactId: form.contactId || null,
      issueDate: form.issueDate,
      dueDate:   form.dueDate   || null,
      currency:  form.currency,
      status:    form.status,
      category:  form.category  || null,
      notes:     form.notes     || null,
      lines: lines
        .filter((l) => l.itemId && parseFloat(l.unitPrice) > 0)
        .map((l) => ({
          description: l.description.trim(),
          quantity:    parseFloat(l.quantity)  || 1,
          unitPrice:   parseFloat(l.unitPrice),
          vatRate:     parseFloat(l.vatRate)   || 0,
        })),
    };
    try {
      if (isEdit) {
        await updateBill(initialData.id, payload);
      } else {
        await createBill(payload);
      }
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {/* eslint-disable-next-line no-nested-ternary */}
        {duplicateData ? t('bills.duplicateBill') : isEdit ? t('bills.editBill') : t('bills.newBill')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}

          <Stack direction="row" spacing={2}>
            <TextField
              label={t('common.reference')} required fullWidth autoFocus
              value={form.reference} onChange={setField('reference')}
              error={!!errors.reference} helperText={errors.reference}
              placeholder={t('bills.referencePlaceholder')}
            />
            <FormControl fullWidth required error={!!errors.status}>
              <InputLabel>{t('common.status')}</InputLabel>
              <Select value={form.status} label={t('common.status')} onChange={setField('status')}>
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{t(`billStatus.${s}`)}</MenuItem>
                ))}
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>{t('bills.supplier')}</InputLabel>
              <Select value={form.contactId} label={t('bills.supplier')} onChange={handleContactChange}>
                <MenuItem value=""><em>{t('common.none')}</em></MenuItem>
                {contacts.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth required error={!!errors.currency}>
              <InputLabel>{t('common.currency')}</InputLabel>
              <Select value={form.currency} label={t('common.currency')} onChange={handleCurrencyChange}>
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
              {errors.currency && <FormHelperText>{errors.currency}</FormHelperText>}
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label={t('common.issueDate')} type="date" required fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.issueDate} onChange={setField('issueDate')}
              error={!!errors.issueDate} helperText={errors.issueDate}
            />
            <TextField
              label={t('common.dueDate')} type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.dueDate} onChange={setField('dueDate')}
            />
            <TextField
              label={t('bills.category')} fullWidth
              value={form.category} onChange={setField('category')}
              placeholder={t('bills.categoryPlaceholder')}
            />
          </Stack>

          <Box>
            <Stack direction="row" alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={700} flexGrow={1}>
                {t('common.lineItems')}
              </Typography>
              {errors.lines && (
                <Typography variant="caption" color="error">{errors.lines}</Typography>
              )}
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.25 } }}>
                    <TableCell sx={{ width: '38%' }}>{t('items.item')}</TableCell>
                    <TableCell sx={{ width: '12%' }}>{t('common.qty')}</TableCell>
                    <TableCell sx={{ width: '16%' }}>{t('common.unitPrice')}</TableCell>
                    <TableCell sx={{ width: '10%' }}>{t('common.vatPercent')}</TableCell>
                    <TableCell sx={{ width: '16%' }} align="right">{t('common.total')}</TableCell>
                    <TableCell sx={{ width: '8%' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, i) => (
                    <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.15s' }}>
                      <TableCell>
                        <Select
                          size="small" fullWidth variant="standard" displayEmpty
                          value={line.itemId} onChange={handleItemSelect(i)}
                          renderValue={(val) => {
                            if (!val) return <em style={{ color: '#aaa' }}>{t('items.selectItem')}</em>;
                            const it = items.find((x) => x.id === val);
                            return it ? it.name : line.description || val;
                          }}
                        >
                          {items.filter((it) => it.currency === form.currency).map((it) => (
                            <MenuItem key={it.id} value={it.id}>{it.name}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth variant="standard" type="number"
                          inputProps={{ min: 0.0001, step: 1 }}
                          value={line.quantity} onChange={setLine(i, 'quantity')}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth variant="standard" type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}>{form.currency}</InputAdornment> }}
                          value={line.unitPrice} onChange={setLine(i, 'unitPrice')}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth variant="standard" type="number"
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          value={line.vatRate} onChange={setLine(i, 'vatRate')}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {parseFloat(line.unitPrice) > 0 ? fmt(lineTotal(line), form.currency) : '—'}
                      </TableCell>
                      <TableCell align="center" sx={{ pr: 0.5 }}>
                        <Tooltip title={t('common.remove')}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={lines.length === 1}
                              onClick={() => removeLine(i)}
                              sx={{ color: 'text.disabled', transition: 'color 0.15s', '&:not(.Mui-disabled):hover': { color: 'error.main' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={(theme) => ({ borderTop: `1px dashed ${theme.palette.divider}`, px: 1.5, py: 0.75 })}>
                <Button
                  fullWidth size="small" startIcon={<AddIcon />} onClick={addLine}
                  sx={{ color: 'text.secondary', justifyContent: 'flex-start', '&:hover': { color: 'primary.main' } }}
                >
                  {t('common.addLine')}
                </Button>
              </Box>

              {hasValidLines && (
                <Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'grey.50', px: 2.5, py: 2, display: 'flex', justifyContent: 'flex-end' })}>
                  <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{t('common.subtotal')}</Typography>
                      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(subtotal, form.currency)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{t('common.vat')}</Typography>
                      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(vatTotal, form.currency)}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle2">{t('common.total')}</Typography>
                      <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(total, form.currency)}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Paper>
          </Box>

          <TextField label={t('common.notes')} multiline rows={2} value={form.notes} onChange={setField('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('bills.createBill')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

BillDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  duplicateData: PropTypes.object,
};

BillDialog.defaultProps = {
  initialData: null,
  duplicateData: null,
};
