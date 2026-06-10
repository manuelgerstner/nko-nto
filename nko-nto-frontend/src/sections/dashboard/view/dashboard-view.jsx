import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { alpha } from '@mui/material/styles';
import {
  Box, Button, Card, CardContent, Chip, Skeleton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { getDashboardSummary, getInvoices, getBills, getDashboardMonthlyChart } from '../../../utils/api';

function StatCard({ label, value, sub, icon, color, loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={44} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {value}
              </Typography>
            )}
            {loading ? (
              <Skeleton variant="text" width={80} height={20} />
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 52, height: 52, flexShrink: 0, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(color, 0.12), color,
            '& svg': { fontSize: 26 },
          }}>
            {icon}
          </Box>
        </Stack>
        <Box sx={{
          mt: 2.5, height: 3, borderRadius: 2, bgcolor: alpha(color, 0.15),
          position: 'relative', overflow: 'hidden',
          '&::after': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', bgcolor: color, borderRadius: 2 },
        }} />
      </CardContent>
    </Card>
  );
}

function fmtEur(value) {
  return Number(value ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const INVOICE_STATUS_COLORS = {
  DRAFT: 'default', SENT: 'info', PAID: 'success', OVERDUE: 'error', CANCELLED: 'warning',
};

const BILL_STATUS_COLORS = {
  PENDING: 'warning', PAID: 'success', OVERDUE: 'error', CANCELLED: 'default',
};

function fmtEurShort(value) {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k €`;
  return `${n.toFixed(0)} €`;
}

function EarningsChart({ data, loading }) {
  const { t } = useTranslation();
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          {t('dashboard.monthlyOverview')}
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1 }} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtEurShort} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(value) => fmtEur(value)} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="earnings" name={t('dashboard.earnings')} fill="#10B981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="spendings" name={t('dashboard.spendings')} fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTable({ title, rows, loading, columns, onRowClick, viewAllPath, emptyKey }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
          <Button size="small" onClick={() => navigate(viewAllPath)} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
            {t('common.viewAll')}
          </Button>
        </Stack>
      </CardContent>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id}><Skeleton variant="text" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.disabled">{t(emptyKey)}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => onRowClick(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align}>{col.render(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export default function DashboardView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));

    getInvoices({ page: 0, size: 5, sort: 'issueDate,desc' })
      .then((res) => setRecentInvoices(res.data.content))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false));

    getBills({ page: 0, size: 5, sort: 'issueDate,desc' })
      .then((res) => setRecentBills(res.data.content))
      .catch(() => {})
      .finally(() => setBillsLoading(false));

    getDashboardMonthlyChart()
      .then((res) => {
        const formatted = res.data.map(({ year, month, earnings, spendings }) => ({
          label: new Date(year, month - 1).toLocaleString(undefined, { month: 'short', year: '2-digit' }),
          earnings: Number(earnings),
          spendings: Number(spendings),
        }));
        setChartData(formatted);
      })
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, []);

  const summaryCards = [
    {
      label: t('dashboard.outstandingInvoices'),
      value: fmtEur(summary?.outstandingInvoiceTotal),
      sub: t('dashboard.invoiceCount', { count: summary?.outstandingInvoiceCount ?? 0 }),
      icon: <ReceiptIcon />, color: '#6366F1',
    },
    {
      label: t('dashboard.unpaidBills'),
      value: fmtEur(summary?.unpaidBillTotal),
      sub: t('dashboard.billCount', { count: summary?.unpaidBillCount ?? 0 }),
      icon: <RequestPageIcon />, color: '#EF4444',
    },
    {
      label: t('dashboard.contacts'),
      value: String(summary?.totalContacts ?? 0),
      sub: t('dashboard.customersSuppliers'),
      icon: <PeopleIcon />, color: '#10B981',
    },
    {
      label: t('dashboard.netBalance'),
      value: fmtEur(summary?.netBalance),
      sub: t('dashboard.invoicedMinusBills'),
      icon: <AccountBalanceWalletIcon />, color: '#F59E0B',
    },
  ];

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700}>{t('dashboard.title')}</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {t('dashboard.subtitle')}
        </Typography>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4,
      }}>
        {summaryCards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </Box>

      <EarningsChart data={chartData} loading={chartLoading} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <RecentTable
          title={t('dashboard.recentInvoices')}
          rows={recentInvoices}
          loading={invoicesLoading}
          viewAllPath="/invoices"
          emptyKey="dashboard.noInvoicesPlaceholder"
          onRowClick={(row) => navigate(`/invoices/${row.id}`)}
          columns={[
            { id: 'number', label: t('invoices.invoiceNumber'), render: (r) => <strong>{r.number}</strong> },
            { id: 'contact', label: t('common.contact'), render: (r) => r.contact?.name ?? '—' },
            { id: 'dueDate', label: t('common.dueDate'), render: (r) => formatDate(r.dueDate) },
            {
              id: 'amount', label: t('common.amount'), align: 'right',
              render: (r) => `${Number(r.amount).toFixed(2)} ${r.currency ?? 'EUR'}`,
            },
            {
              id: 'status', label: t('common.status'),
              render: (r) => (
                <Chip label={t(`invoiceStatus.${r.status}`)} color={INVOICE_STATUS_COLORS[r.status] ?? 'default'} size="small" />
              ),
            },
          ]}
        />
        <RecentTable
          title={t('dashboard.recentBills')}
          rows={recentBills}
          loading={billsLoading}
          viewAllPath="/bills"
          emptyKey="dashboard.noBillsPlaceholder"
          onRowClick={(row) => navigate(`/bills/${row.id}`)}
          columns={[
            { id: 'reference', label: t('common.reference'), render: (r) => <strong>{r.reference ?? '—'}</strong> },
            { id: 'contact', label: t('common.contact'), render: (r) => r.contact?.name ?? '—' },
            { id: 'dueDate', label: t('common.dueDate'), render: (r) => formatDate(r.dueDate) },
            {
              id: 'amount', label: t('common.amount'), align: 'right',
              render: (r) => `${Number(r.amount).toFixed(2)} ${r.currency ?? 'EUR'}`,
            },
            {
              id: 'status', label: t('common.status'),
              render: (r) => (
                <Chip label={t(`billStatus.${r.status}`)} color={BILL_STATUS_COLORS[r.status] ?? 'default'} size="small" />
              ),
            },
          ]}
        />
      </Box>
    </Box>
  );
}
