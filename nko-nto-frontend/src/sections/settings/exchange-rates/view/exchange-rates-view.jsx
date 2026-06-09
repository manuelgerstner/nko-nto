import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Card, Chip, CircularProgress, IconButton, InputAdornment,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, TextField, Tooltip,
  Typography,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ClearIcon from '@mui/icons-material/Clear';

import { getExchangeRates, triggerExchangeRateFetch } from '../../../../utils/api';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ExchangeRatesView() {
  const { t } = useTranslation();
  const [rows, setRows]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);

  const [page, setPage]           = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [orderBy, setOrderBy]     = useState('rateDate');
  const [order, setOrder]         = useState('desc');

  const [currency, setCurrency]   = useState('');
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');

  const columns = [
    { id: 'rateDate',  label: t('common.issueDate').replace('Issue ', ''), sortable: true  },
    { id: 'currency',  label: t('common.currency'),                        sortable: true  },
    { id: 'rate',      label: t('exchangeRates.eurRate'),                  sortable: true  },
    { id: 'fetchedAt', label: t('exchangeRates.fetchedAt'),                sortable: false },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: rowsPerPage,
        sort: `${orderBy},${order}`,
        ...(currency && { currency }),
        ...(from     && { from }),
        ...(to       && { to }),
      };
      const res = await getExchangeRates(params);
      setRows(res.data.content);
      setTotal(res.data.page.totalElements);
    } catch (err) {
      console.error('Failed to load exchange rates', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, orderBy, order, currency, from, to]);

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
    setCurrency('');
    setFrom('');
    setTo('');
    setPage(0);
  };

  const handleFetchNow = async () => {
    setFetching(true);
    try {
      await triggerExchangeRateFetch();
      await load();
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      setFetching(false);
    }
  };

  const hasFilter = currency || from || to;

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h4" sx={{ flex: 1 }}>{t('exchangeRates.pageTitle')}</Typography>
        <Tooltip title={t('exchangeRates.fetchTooltip')}>
          <Button
            variant="outlined"
            startIcon={fetching ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={handleFetchNow}
            disabled={fetching}
          >
            {t('exchangeRates.fetchNow')}
          </Button>
        </Tooltip>
      </Stack>

      <Card>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('common.currency')}</Typography>
            <TextField
              size="small"
              value={currency}
              onChange={(e) => { setCurrency(e.target.value.toUpperCase()); setPage(0); }}
              placeholder="USD"
              sx={{ width: 120 }}
              inputProps={{ maxLength: 6 }}
            />
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
                <IconButton size="small" onClick={handleClearFilters}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasFilter && (
              <Chip label={t('exchangeRates.results', { count: total })} size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </Box>

        <TableContainer sx={{ position: 'relative', minHeight: 200 }}>
          {loading && (
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1,
            }}>
              <CircularProgress />
            </Box>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} sortDirection={orderBy === col.id ? order : false}>
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
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('exchangeRates.noRatesYet')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{formatDate(row.rateDate)}</TableCell>
                    <TableCell>
                      <Chip label={row.currency} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Number(row.rate).toFixed(4)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {formatDateTime(row.fetchedAt)}
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
    </Stack>
  );
}
