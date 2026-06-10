import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Card, CircularProgress, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { deleteItem, getItems } from '../../../utils/api';
import ItemDialog from '../item-dialog';

function fmt(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ItemsView() {
  const { t } = useTranslation();
  const [rows, setRows]                 = useState([]);
  const [loading, setLoading]           = useState(false);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deletingId, setDeletingId]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getItems();
      setRows(res.data);
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (item) => {
    setEditTarget(item);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteItem(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditTarget(null);
    load();
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h4" sx={{ flex: 1 }}>{t('items.pageTitle')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          {t('items.newItem')}
        </Button>
      </Stack>

      <Card>
        <TableContainer sx={{ position: 'relative', minHeight: 120 }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }}>
              <CircularProgress />
            </Box>
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('items.name')}</TableCell>
                <TableCell>{t('items.currency')}</TableCell>
                <TableCell align="right">{t('items.defaultPrice')}</TableCell>
                <TableCell align="right">{t('items.defaultVatRate')}</TableCell>
                <TableCell sx={{ width: 96 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('items.noItemsYet')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
                    </TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(row.defaultPrice)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(row.defaultVatRate)} %
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small" onClick={() => handleEdit(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.remove')}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={deletingId === row.id}
                            onClick={() => handleDelete(row.id)}
                            sx={{ color: 'text.disabled', '&:not(.Mui-disabled):hover': { color: 'error.main' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ItemDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSuccess={handleSuccess}
        initialData={editTarget}
      />
    </Stack>
  );
}
