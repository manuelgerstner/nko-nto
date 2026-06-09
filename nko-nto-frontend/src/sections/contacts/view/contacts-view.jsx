import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar, Box, Button, Card, Chip, CircularProgress, IconButton, InputAdornment,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TableSortLabel, TextField,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import { getContacts } from '../../../utils/api';
import ContactDialog from '../contact-dialog';

const TYPE_COLORS = { CUSTOMER: 'primary', SUPPLIER: 'secondary', BOTH: 'default' };
const CONTACT_TYPES = ['CUSTOMER', 'SUPPLIER', 'BOTH'];

function initials(name) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function ContactsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [orderBy, setOrderBy]         = useState('name');
  const [order, setOrder]             = useState('asc');

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const columns = [
    { id: 'name',            label: t('common.name'),               sortable: true  },
    { id: 'email',           label: t('common.email'),              sortable: true  },
    { id: 'phone',           label: t('common.phone'),              sortable: false },
    { id: 'type',            label: t('common.type'),               sortable: true  },
    { id: 'defaultCurrency', label: t('contacts.defaultCurrency'),  sortable: true  },
    { id: 'vatId',           label: t('contacts.vatId'),            sortable: false },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: rowsPerPage,
        sort: `${orderBy},${order}`,
        ...(search     && { search }),
        ...(typeFilter && { type: typeFilter }),
      };
      const res = await getContacts(params);
      setRows(res.data.content);
      setTotal(res.data.page.totalElements);
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, orderBy, order, search, typeFilter]);

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
    setTypeFilter('');
    setPage(0);
  };

  const hasFilter = search || typeFilter;

  const handleSuccess = () => { setDialogOpen(false); load(); };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h4" sx={{ flex: 1 }}>{t('contacts.pageTitle')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('contacts.newContact')}
        </Button>
      </Stack>

      <Card>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('common.name')}</Typography>
            <TextField
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search…"
              sx={{ width: 200 }}
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
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{t('common.type')}</Typography>
            <Select
              size="small"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              displayEmpty
              sx={{ width: 140 }}
            >
              <MenuItem value="">{t('common.none')}</MenuItem>
              {CONTACT_TYPES.map((ct) => (
                <MenuItem key={ct} value={ct}>{t(`contactType.${ct}`)}</MenuItem>
              ))}
            </Select>
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
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('contacts.noContactsYet')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${row.id}`)}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.light' }}>
                          {initials(row.name)}
                        </Avatar>
                        <Typography variant="body2">{row.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{row.email ?? '—'}</TableCell>
                    <TableCell>{row.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`contactType.${row.type}`)}
                        color={TYPE_COLORS[row.type] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.defaultCurrency ?? '—'}</TableCell>
                    <TableCell>{row.vatId ?? '—'}</TableCell>
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

      <ContactDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </Stack>
  );
}
