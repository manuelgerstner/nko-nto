import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Card, Chip, CircularProgress, Divider, Grid,
  IconButton, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" py={1}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>{value || '—'}</Typography>
    </Stack>
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

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={t('common.back')}>
          <IconButton onClick={() => navigate('/bills')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" sx={{ flex: 1 }}>{bill.reference}</Typography>
        <Chip
          label={t(`billStatus.${bill.status}`)}
          color={STATUS_COLORS[bill.status] ?? 'default'}
        />
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
          {t('common.edit')}
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('common.reference')}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <InfoRow label={t('bills.supplier')} value={bill.contact?.name} />
            <Divider />
            <InfoRow label={t('common.issueDate')} value={formatDate(bill.issueDate)} />
            <Divider />
            <InfoRow label={t('common.dueDate')} value={formatDate(bill.dueDate)} />
            <Divider />
            <InfoRow label={t('bills.category')} value={bill.category} />
            <Divider />
            <InfoRow label={t('common.currency')} value={bill.currency} />
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('common.total')}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <InfoRow label={t('common.subtotal')} value={`${subtotal.toFixed(2)} ${bill.currency ?? 'EUR'}`} />
            <Divider />
            <InfoRow label={t('common.vat')} value={`${vatTotal.toFixed(2)} ${bill.currency ?? 'EUR'}`} />
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center" py={1}>
              <Typography variant="body1" fontWeight={600}>{t('common.total')}</Typography>
              <Typography variant="body1" fontWeight={600}>
                {grandTotal.toFixed(2)} {bill.currency ?? 'EUR'}
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {lines.length > 0 && (
        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2">{t('common.lineItems')}</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('common.description')}</TableCell>
                  <TableCell align="right">{t('common.qty')}</TableCell>
                  <TableCell align="right">{t('common.unitPrice')}</TableCell>
                  <TableCell align="right">{t('common.vatPercent')}</TableCell>
                  <TableCell align="right">{t('common.total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, i) => {
                  const net = Number(line.quantity) * Number(line.unitPrice);
                  const total = net * (1 + Number(line.vatRate) / 100);
                  return (
                    <TableRow key={line.id ?? i}>
                      <TableCell>{line.description}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {Number(line.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {Number(line.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {Number(line.vatRate).toFixed(2)}%
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {bill.notes && (
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('common.notes')}
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{bill.notes}</Typography>
        </Card>
      )}

      <BillDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); }}
        initialData={bill}
      />
    </Stack>
  );
}
