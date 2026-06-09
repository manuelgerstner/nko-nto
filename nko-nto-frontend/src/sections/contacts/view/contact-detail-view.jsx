import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar, Box, Button, Card, Chip, CircularProgress, Divider, Grid,
  IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import { getContact } from '../../../utils/api';
import ContactDialog from '../contact-dialog';

const TYPE_COLORS = { CUSTOMER: 'primary', SUPPLIER: 'secondary', BOTH: 'default' };

function initials(name) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" py={1}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>{value || '—'}</Typography>
    </Stack>
  );
}

export default function ContactDetailView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getContact(id)
      .then((res) => setContact(res.data))
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

  if (error || !contact) {
    return (
      <Stack spacing={2}>
        <IconButton onClick={() => navigate('/contacts')} sx={{ alignSelf: 'flex-start' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography color="error">{t('common.notFound')}</Typography>
      </Stack>
    );
  }

  const hasAddress = contact.street || contact.postalCode || contact.state || contact.country;

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={t('common.back')}>
          <IconButton onClick={() => navigate('/contacts')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Avatar sx={{ width: 40, height: 40, fontSize: 15, bgcolor: 'primary.light' }}>
          {initials(contact.name)}
        </Avatar>
        <Typography variant="h4" sx={{ flex: 1 }}>{contact.name}</Typography>
        <Chip
          label={t(`contactType.${contact.type}`)}
          color={TYPE_COLORS[contact.type] ?? 'default'}
          variant="outlined"
        />
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
          {t('common.edit')}
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('contacts.pageTitle')}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <InfoRow label={t('common.email')} value={contact.email} />
            <Divider />
            <InfoRow label={t('common.phone')} value={contact.phone} />
            <Divider />
            <InfoRow label={t('contacts.vatId')} value={contact.vatId} />
            <Divider />
            <InfoRow label={t('contacts.defaultCurrency')} value={contact.defaultCurrency} />
          </Card>
        </Grid>

        {hasAddress && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('common.address')}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow label={t('contacts.streetAddress')} value={contact.street} />
              <Divider />
              <InfoRow label={t('contacts.postalCode')} value={contact.postalCode} />
              <Divider />
              <InfoRow label={t('contacts.stateProvince')} value={contact.state} />
              <Divider />
              <InfoRow label={t('contacts.country')} value={contact.country} />
            </Card>
          </Grid>
        )}
      </Grid>

      {contact.notes && (
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('common.notes')}
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contact.notes}</Typography>
        </Card>
      )}

      <ContactDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); }}
        initialData={contact}
      />
    </Stack>
  );
}
