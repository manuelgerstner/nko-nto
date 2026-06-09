import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useAuth } from '../contexts/use-auth';

export default function VerifyEmailPage() {
  const { user, emailVerified, sendVerificationEmail, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (emailVerified) {
      navigate('/');
      return;
    }
    const interval = setInterval(refreshUser, 3000);
    return () => clearInterval(interval);
  }, [emailVerified, navigate, refreshUser]);

  async function handleResend() {
    await sendVerificationEmail();
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} mb={2}>Verify your email</Typography>
          <Typography color="text.secondary" mb={3}>
            We sent a verification link to <strong>{user?.email}</strong>.
            Check your inbox and click the link to continue.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button variant="contained" onClick={handleResend}>Resend verification email</Button>
            <Button variant="text" color="inherit" onClick={handleLogout}>Sign out</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
