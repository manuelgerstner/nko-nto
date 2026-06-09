import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Link, TextField, Typography, Alert,
} from '@mui/material';
import { useAuth } from '../contexts/use-auth';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.companyName, form.email, form.password);
      navigate('/verify-email');
    } catch (err) {
      setError(friendlyError(err.code));
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
          <Typography variant="h5" fontWeight={700} mb={3}>Create account</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Full name" value={form.name} onChange={set('name')} required autoFocus />
            <TextField label="Company name" value={form.companyName} onChange={set('companyName')} required />
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} required />
            <TextField label="Password" type="password" value={form.password} onChange={set('password')} required inputProps={{ minLength: 6 }} />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </Box>
          <Typography variant="body2" mt={2} textAlign="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    default:
      return 'Sign-up failed. Please try again.';
  }
}
