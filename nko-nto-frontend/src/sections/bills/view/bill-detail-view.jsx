import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Card, Chip, CircularProgress, Divider,
  IconButton, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';

import { getBill } from '../../../utils/api';
import BillDialog from '../bill-dialog';

const STATUS_COLORS = {
  PENDING: 'warning', PAID: 'success', OVERDUE: 'error', CANCELLED: 'default',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(amount, currency) {
  return `${Number(amount).toFixed(2)} ${currency ?? 'EUR'}`;
}

function AddressBlock({ contact, label }) {
  if (!contact) return null;
  const lines = [
    contact.street,
    [contact.postalCode, contact.state].filter(Boolean).join(' '),
    contact.country,
  ].filter(Boolean);

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.1em', fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>{contact.name}</Typography>
      {lines.map((line, i) => (
        <Typography key={i} variant="body2" color="text.secondary">{line}</Typography>
      ))}
      {contact.email && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{contact.email}</Typography>
      )}
      {contact.phone && (
        <Typography variant="body2" color="text.secondary">{contact.phone}</Typography>
      )}
      {contact.vatId && (
        <Typography variant="body2" color="text.secondary">VAT: {contact.vatId}</Typography>
      )}
    </Box>
  );
}

export default function BillDetailView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getBill(id)
      .then((res) => setBill(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !bill) {
    return (
      <Stack spacing={2}>
        <IconButton onClick={() => navigate('/bills')} sx={{ alignSelf: 'flex-start' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography color="error">{t('common.notFound')}</Typography>
      </Stack>
    );
  }

  const lines = bill.lines ?? [];
  const subtotal = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
  const vatTotal = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice) * (Number(l.vatRate) / 100), 0);
  const grandTotal = subtotal + vatTotal;
  const currency = bill.currency ?? 'EUR';

  return (
    <Stack spacing={2}>
      {/* Toolbar */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={t('common.back')}>
          <IconButton onClick={() => navigate('/bills')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => setDuplicateOpen(true)} sx={{ mr: 1 }}>
          {t('common.duplicate')}
        </Button>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
          {t('common.edit')}
        </Button>
      </Stack>

      {/* Bill Document */}
      <Card sx={{ p: { xs: 3, sm: 5 }, position: 'relative' }}>
        <Chip
          label={t(`billStatus.${bill.status}`)}
          color={STATUS_COLORS[bill.status] ?? 'default'}
          sx={{ position: 'absolute', top: { xs: 24, sm: 40 }, right: { xs: 24, sm: 40 } }}
        />
        {/* Bill Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
              {t('bills.bill').toUpperCase()}
            </Typography>
            <Typography variant="h5" color="text.secondary" fontWeight={400} sx={{ mt: 0.5 }}>
              {bill.reference}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { sm: 'right' }, mt: { sm: 5 } }}>
            <Stack spacing={0.5} alignItems={{ sm: 'flex-end' }}>
              <Stack direction="row" spacing={2} justifyContent={{ sm: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">{t('common.issueDate')}:</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(bill.issueDate)}</Typography>
              </Stack>
              <Stack direction="row" spacing={2} justifyContent={{ sm: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">{t('common.dueDate')}:</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(bill.dueDate)}</Typography>
              </Stack>
              {bill.category && (
                <Stack direction="row" spacing={2} justifyContent={{ sm: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">{t('bills.category')}:</Typography>
                  <Typography variant="body2" fontWeight={500}>{bill.category}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={2} justifyContent={{ sm: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary">{t('common.currency')}:</Typography>
                <Typography variant="body2" fontWeight={500}>{currency}</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* Bill From */}
        <Box sx={{ mb: 4 }}>
          <AddressBlock contact={bill.contact} label={t('bills.billFrom')} />
        </Box>

        <Divider sx={{ mb: 0 }} />

        {/* Line Items */}
        <TableContainer sx={{ mb: 0 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '2px solid', borderColor: 'divider', py: 1.5 } }}>
                <TableCell sx={{ pl: 0 }}><Typography variant="overline" color="text.secondary">{t('common.description')}</Typography></TableCell>
                <TableCell align="right"><Typography variant="overline" color="text.secondary">{t('common.qty')}</Typography></TableCell>
                <TableCell align="right"><Typography variant="overline" color="text.secondary">{t('common.unitPrice')}</Typography></TableCell>
                <TableCell align="right"><Typography variant="overline" color="text.secondary">{t('common.vatPercent')}</Typography></TableCell>
                <TableCell align="right" sx={{ pr: 0 }}><Typography variant="overline" color="text.secondary">{t('common.total')}</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ pl: 0, pr: 0, py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">{t('common.noLineItems')}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {lines.map((line, i) => {
                const net = Number(line.quantity) * Number(line.unitPrice);
                const total = net * (1 + Number(line.vatRate) / 100);
                return (
                  <TableRow key={line.id ?? i} sx={{ '& td': { py: 1.5 } }}>
                    <TableCell sx={{ pl: 0 }}>{line.description}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(line.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(line.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(line.vatRate).toFixed(2)}%
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', pr: 0 }}>
                      {total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        {/* Totals */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Box sx={{ width: 320 }}>
            <Stack direction="row" py={0.75} gap={3}>
              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{t('common.subtotal')}</Typography>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal, currency)}</Typography>
            </Stack>
            <Stack direction="row" py={0.75} gap={3}>
              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{t('common.vat')}</Typography>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(vatTotal, currency)}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" py={0.75} gap={3}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ flexShrink: 0 }}>{t('common.total')}</Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(grandTotal, currency)}
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Notes */}
        {bill.notes && (
          <>
            <Divider sx={{ mt: 4, mb: 3 }} />
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.1em', fontSize: '0.7rem' }}>
                {t('common.notes')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{bill.notes}</Typography>
            </Box>
          </>
        )}
      </Card>

      <BillDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); }}
        initialData={bill}
      />
      <BillDialog
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        onSuccess={() => { setDuplicateOpen(false); navigate('/bills'); }}
        duplicateData={bill}
      />
    </Stack>
  );
}
