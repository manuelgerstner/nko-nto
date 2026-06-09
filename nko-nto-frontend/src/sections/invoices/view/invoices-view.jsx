import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Card, Chip, CircularProgress, IconButton, InputAdornment,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TableSortLabel, TextField,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import { getInvoices, getExchangeRatesForDates } from '../../../utils/api';
import InvoiceDialog from '../invoice-dialog';
import { useSettings } from '../../../contexts/settings-context';

const STATUS_COLORS = {
  DRAFT: 'default', SENT: 'info', PAID: 'success', OVERDUE: 'error', CANCELLED: 'warning',
};

const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function convertAmount(amount, rowCurrency, date, rateMap, primary, secondary) {
  if (!rateMap || rowCurrency === secondary) return amount;
  const secRate = rateMap[secondary]?.[date];
  if (!secRate) return null;
  if (rowCurrency === primary) return Number(amount) * Number(secRate);
  const rowRate = rateMap[rowCurrency]?.[date];
  if (!rowRate) return null;
  return (Number(amount) / Number(rowRate)) * Number(secRate);
}

export default function InvoicesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [rows, setRows]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rateMap, setRateMap]       = useState({});

  const [page, setPage]                   = useState(0);
  const [rowsPerPage, setRowsPerPage]     = useState(20);
  const [orderBy, setOrderBy]             = useState('issueDate');
  const [order, setOrder]                 = useState('desc');

  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  const { primaryCurrency, secondaryCurrencyEnabled, secondaryCurrency } = settings;

  const columns = [
    { id: 'number',    label: t('invoices.invoiceNumber'), sortable: true  },
    { id: 'contact',   label: t('common.contact'),         sortable: false },
    { id: 'issueDate', label: t('common.issueDate'),       sortable: true  },
    { id: 'dueDate',   label: t('common.dueDate'),         sortable: true  },
    { id: 'amount',    label: t('common.amount'),          sortable: true, align: 'right' },
    { id: 'currency',  label: t('common.currency'),        sortable: true  },
    ...(secondaryCurrencyEnabled && secondaryCurrency
      ? [{ id: 'amountSecondary', label: `Amount (${secondaryCurrency})`, sortable: false, align: 'right' }]
      : []),
    { id: 'status',    label: t('common.status'),          sortable: true  },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: rowsPerPage,
        sort: `${orderBy},${order}`,
        ...(search && { search }),
        ...(status && { status }),
        ...(from   && { from }),
        ...(to     && { to }),
      };
      const res = await getInvoices(params);
      const content = res.data.content;
      setRows(content);
      setTotal(res.data.page.totalElements);

      if (secondaryCurrencyEnabled && secondaryCurrency && content.length > 0) {
        const dates = [...new Set(content.map((r) => r.issueDate).filter(Boolean))];
        const extraCurrencies = [...new Set(content.map((r) => r.currency).filter(
          (c) => c && c !== primaryCurrency && c !== secondaryCurrency,
        ))];
        const currencies = [secondaryCurrency, ...extraCurrencies];
        try {
          const ratesRes = await getExchangeRatesForDates({ currencies, dates });
          setRateMap(ratesRes.data);
        } catch {
          setRateMap({});
        }
      } else {
        setRateMap({});
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, orderBy, order, search, status, from, to, secondaryCurrencyEnabled, secondaryCurrency, primaryCurrency]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(field);
      setOrder('asc');
    }
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setFrom('');
    setTo('');
    setPage(0);
  };

  const hasFilter = search || status || from || to;

  const handleSuccess = () => { setDialogOpen(false); load(); };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h4" sx={{ flex: 1 }}>{t('invoices.pageTitle')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('invoices.newInvoice')}
        </Button>
      </Stack>

      <Card>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('invoices.invoiceNumber')}</Typography>
            <TextField
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="INV-2024"
              sx={{ width: 160 }}
              InputProps={search ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(''); setPage(0); }}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
              } : undefined}
            />
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('common.status')}</Typography>
            <Select
              size="small"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              displayEmpty
              sx={{ width: 140 }}
            >
              <MenuItem value="">{t('common.none')}</MenuItem>
              {INVOICE_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{t(`invoiceStatus.${s}`)}</MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('exchangeRates.from')}</Typography>
            <TextField
              size="small"
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(0); }}
              sx={{ width: 160 }}
            />
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('exchangeRates.to')}</Typography>
            <TextField
              size="small"
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(0); }}
              sx={{ width: 160 }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ pb: 0.25 }}>
            {hasFilter && (
              <Tooltip title={t('exchangeRates.clearFilters')}>
                <IconButton size="small" onClick={handleClearFilters}><ClearIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            {hasFilter && (
              <Chip label={t('exchangeRates.results', { count: total })} size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </Box>

        <TableContainer sx={{ position: 'relative', minHeight: 120 }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }}>
              <CircularProgress />
            </Box>
          )}
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align} sortDirection={orderBy === col.id ? order : false}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('invoices.noInvoicesYet')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${row.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.number}</TableCell>
                    <TableCell>{row.contact?.name ?? '—'}</TableCell>
                    <TableCell>{formatDate(row.issueDate)}</TableCell>
                    <TableCell>{formatDate(row.dueDate)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(row.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{row.currency ?? 'EUR'}</TableCell>
                    {secondaryCurrencyEnabled && secondaryCurrency && (() => {
                      const converted = convertAmount(row.amount, row.currency ?? primaryCurrency, row.issueDate, rateMap, primaryCurrency, secondaryCurrency);
                      return (
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {converted != null ? Number(converted).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                        </TableCell>
                      );
                    })()}
                    <TableCell>
                      <Chip
                        label={t(`invoiceStatus.${row.status}`)}
                        color={STATUS_COLORS[row.status] ?? 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Card>

      <InvoiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </Stack>
  );
}
