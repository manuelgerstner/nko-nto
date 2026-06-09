import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { previewInvitation } from '../utils/api';
import { useAuth } from '../contexts/use-auth';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { signupWithInvite } = useAuth();

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(true);

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    previewInvitation(token)
      .then((r) => setPreview(r.data))
      .catch((err) => {
        if (err.response?.status === 410) {
          setPreviewError('This invitation link has already been used or has expired.');
        } else if (err.response?.status === 404) {
          setPreviewError('This invitation link is not valid.');
        } else {
          setPreviewError('Could not load invitation details. Please try again.');
        }
      })
      .finally(() => setPreviewLoading(false));
  }, [token]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signupWithInvite(form.name, form.email, form.password, token);
      navigate('/verify-email');
    } catch (err) {
      setError(friendlyError(err.code) ?? err.message ?? 'Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box component="img" src="/nko-nto-logo.png" alt="nko-nto" sx={{ height: 120 }} />
          </Box>

          {previewLoading && (
            <Stack alignItems="center" py={2}>
              <CircularProgress size={32} />
            </Stack>
          )}

          {!previewLoading && previewError && (
            <Alert severity="error">{previewError}</Alert>
          )}

          {!previewLoading && preview && (
            <>
              <Typography variant="h5" fontWeight={700} mb={1}>You've been invited</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BusinessIcon color="action" fontSize="small" />
                <Typography color="text.secondary">
                  Joining <strong>{preview.companyName}</strong>
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Full name" value={form.name} onChange={set('name')} required autoFocus />
                <TextField label="Email" type="email" value={form.email} onChange={set('email')} required />
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  inputProps={{ minLength: 6 }}
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? 'Creating account…' : `Join ${preview.companyName}`}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/invalid-email': return 'Invalid email address.';
    default: return null;
  }
}
