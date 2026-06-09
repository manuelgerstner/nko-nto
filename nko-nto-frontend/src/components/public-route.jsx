import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/use-auth';

export default function PublicRoute({ children }) {
  const { user, loading, emailVerified } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user && emailVerified) return <Navigate to="/" replace />;

  return children;
}
