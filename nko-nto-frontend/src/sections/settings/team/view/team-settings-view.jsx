import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { useTranslation } from 'react-i18next';
import { createInvitation, getInvitations } from '../../../../utils/api';

export default function TeamSettingsView() {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getInvitations()
      .then((r) => setInvitations(r.data))
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const { data } = await createInvitation();
      const { data: list } = await getInvitations();
      setInvitations(list);
      await navigator.clipboard.writeText(buildLink(data.token));
      setCopyFeedback(data.token);
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setError(t('common.error'));
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(token) {
    await navigator.clipboard.writeText(buildLink(token));
    setCopyFeedback(token);
    setTimeout(() => setCopyFeedback(null), 2000);
  }

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">{t('team.pageTitle')}</Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={600}>{t('team.inviteLinks')}</Typography>
              <Button
                variant="contained"
                startIcon={<GroupAddIcon />}
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? t('team.generating') : t('team.generateLink')}
              </Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            {invitations.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                {t('team.noLinksYet')}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {invitations.map((inv) => (
                  <InviteRow
                    key={inv.token}
                    inv={inv}
                    copied={copyFeedback === inv.token}
                    onCopy={handleCopy}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function InviteRow({ inv, copied, onCopy }) {
  const { t } = useTranslation();
  const expired = new Date(inv.expiresAt) < new Date();

  const statusChip = inv.used
    ? <Chip label={t('team.statusUsed')} size="small" color="default" />
    : expired
      ? <Chip label={t('team.statusExpired')} size="small" color="warning" />
      : <Chip label={t('team.statusActive')} size="small" color="success" />;

  const disabled = inv.used || expired;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
      <Typography
        variant="body2"
        sx={{ fontFamily: 'monospace', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {buildLink(inv.token)}
      </Typography>
      {statusChip}
      <Tooltip title={copied ? t('team.copied') : t('team.copyLink')}>
        <span>
          <IconButton size="small" onClick={() => onCopy(inv.token)} disabled={disabled}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {t('team.expires', { date: new Date(inv.expiresAt).toLocaleDateString() })}
      </Typography>
    </Box>
  );
}

function buildLink(token) {
  return `${window.location.origin}/accept-invite/${token}`;
}
