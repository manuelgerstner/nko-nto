import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Button, CircularProgress, Stack, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { createBill, createContact, createInvoice, getContacts } from '../../../../utils/api';

const SUPPORTED_CURRENCIES = new Set(['EUR', 'USD', 'ZAR']);

function toIsoDate(value) {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') {
    // Excel serial: days since 1899-12-30
    return new Date(Math.round((value - 25569) * 86400000)).toISOString().split('T')[0];
  }
  const s = String(value).trim();
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function mapInvoiceStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'sent') return 'SENT';
  if (s === 'paid') return 'PAID';
  if (s === 'overdue') return 'OVERDUE';
  if (s === 'cancelled') return 'CANCELLED';
  if (s === 'partial') return 'SENT';
  return 'DRAFT';
}

function mapBillStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'paid') return 'PAID';
  if (s === 'overdue') return 'OVERDUE';
  if (s === 'cancelled') return 'CANCELLED';
  return 'PENDING';
}

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws, { defval: '' }));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function useImportPanel() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('idle');
  const [created, setCreated] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleFile = async (f) => {
    setFile(f);
    setStatus('idle');
    setCreated(0);
    setErrors([]);
    try {
      setRows(await parseXlsx(f));
    } catch {
      setRows([]);
    }
  };

  return { file, rows, status, created, errors, handleFile, setStatus, setCreated, setErrors };
}

function FilePicker({ panel, inputRef }) {
  const { t } = useTranslation();
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<UploadFileIcon />}
        onClick={() => inputRef.current.click()}
        disabled={panel.status === 'importing'}
      >
        {t('dataImport.chooseFile')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) panel.handleFile(e.target.files[0]); }}
      />
      <Typography variant="body2" color="text.secondary">
        {panel.file
          ? `${panel.file.name} (${t('dataImport.rowsFound', { count: panel.rows.length })})`
          : t('dataImport.noFile')}
      </Typography>
    </Stack>
  );
}

function ImportButton({ panel, onClick }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="contained"
      size="small"
      disabled={!panel.file || panel.rows.length === 0 || panel.status === 'importing'}
      onClick={onClick}
      startIcon={panel.status === 'importing' ? <CircularProgress size={16} /> : null}
      sx={{ alignSelf: 'flex-start' }}
    >
      {panel.status === 'importing' ? t('dataImport.importing') : t('dataImport.import')}
    </Button>
  );
}

function ResultDisplay({ panel }) {
  const { t } = useTranslation();
  if (panel.status !== 'done') return null;
  return (
    <Box>
      <Typography variant="body2" color={panel.errors.length ? 'warning.main' : 'success.main'}>
        {t('dataImport.result', { created: panel.created, errors: panel.errors.length })}
      </Typography>
      {panel.errors.map((e, i) => (
        <Typography key={i} variant="caption" color="error" display="block">
          {t('dataImport.errorDetail', { row: e.row, message: e.message })}
        </Typography>
      ))}
    </Box>
  );
}

async function loadContactMap() {
  const res = await getContacts({ size: 10000, sort: 'name,asc' });
  const list = res.data?.content ?? [];
  const map = new Map();
  for (const c of list) map.set(c.name.toLowerCase(), c);
  return map;
}

async function findOrCreateContact(name, row, map, contactType) {
  if (!name) return null;
  const key = name.toLowerCase();
  if (map.has(key)) return map.get(key).id;
  const payload = {
    name,
    type: contactType,
    ...(row.contact_email && { email: String(row.contact_email) }),
    ...(row.contact_phone && { phone: String(row.contact_phone) }),
    ...(row.contact_address && { street: String(row.contact_address) }),
    ...(row.contact_zip_code && { postalCode: String(row.contact_zip_code) }),
    ...(row.contact_state && { state: String(row.contact_state) }),
    ...(row.contact_country && { country: String(row.contact_country) }),
  };
  const res = await createContact(payload);
  map.set(key, res.data);
  return res.data.id;
}

// ---------- Contacts ----------

function ContactsPanel() {
  const { t } = useTranslation();
  const inputRef = useRef();
  const panel = useImportPanel();

  const handleImport = async () => {
    panel.setStatus('importing');
    panel.setCreated(0);
    panel.setErrors([]);
    let createdCount = 0;
    const errs = [];

    for (let i = 0; i < panel.rows.length; i++) {
      const row = panel.rows[i];
      const enabled = row.enabled;
      if (enabled === 0 || enabled === false || String(enabled).toLowerCase() === 'false') continue;
      if (!row.name) continue;

      const currency = SUPPORTED_CURRENCIES.has(String(row.currency_code).toUpperCase())
        ? String(row.currency_code).toUpperCase()
        : undefined;

      const payload = {
        name: String(row.name),
        type: 'CUSTOMER',
        ...(row.email && { email: String(row.email) }),
        ...(row.phone && { phone: String(row.phone) }),
        ...(row.address && { street: String(row.address) }),
        ...(row.zip_code && { postalCode: String(row.zip_code) }),
        ...(row.state && { state: String(row.state) }),
        ...(row.country && { country: String(row.country) }),
        ...(row.tax_number && { vatId: String(row.tax_number) }),
        ...(currency && { defaultCurrency: currency }),
      };

      try {
        await createContact(payload);
        createdCount++;
      } catch (err) {
        errs.push({ row: i + 2, message: err.response?.data?.message ?? err.message });
      }
    }

    panel.setCreated(createdCount);
    panel.setErrors(errs);
    panel.setStatus('done');
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={500}>{t('dataImport.contacts')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <FilePicker panel={panel} inputRef={inputRef} />
          <ImportButton panel={panel} onClick={handleImport} />
          <ResultDisplay panel={panel} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// ---------- Invoices ----------

function InvoicesPanel() {
  const { t } = useTranslation();
  const inputRef = useRef();
  const panel = useImportPanel();

  const handleImport = async () => {
    panel.setStatus('importing');
    panel.setCreated(0);
    panel.setErrors([]);
    let createdCount = 0;
    const errs = [];

    let contactMap;
    try {
      contactMap = await loadContactMap();
    } catch {
      contactMap = new Map();
    }

    for (let i = 0; i < panel.rows.length; i++) {
      const row = panel.rows[i];
      if (!row.invoice_number) continue;

      const issueDate = toIsoDate(row.invoiced_at);
      if (!issueDate) {
        errs.push({ row: i + 2, message: 'Missing or invalid invoiced_at date' });
        continue;
      }

      const currency = SUPPORTED_CURRENCIES.has(String(row.currency_code).toUpperCase())
        ? String(row.currency_code).toUpperCase()
        : 'EUR';

      let contactId = null;
      if (row.contact_name) {
        try {
          contactId = await findOrCreateContact(String(row.contact_name), row, contactMap, 'CUSTOMER');
        } catch (err) {
          errs.push({ row: i + 2, message: `Contact: ${err.response?.data?.message ?? err.message}` });
          continue;
        }
      }

      const amount = parseFloat(row.amount) || 0;
      const payload = {
        number: String(row.invoice_number),
        issueDate,
        ...(toIsoDate(row.due_at) && { dueDate: toIsoDate(row.due_at) }),
        currency,
        status: mapInvoiceStatus(row.status),
        ...(contactId && { contactId }),
        ...(row.notes && { notes: String(row.notes) }),
        lines: [{ description: String(row.invoice_number), quantity: 1, unitPrice: amount, vatRate: 0 }],
      };

      try {
        await createInvoice(payload);
        createdCount++;
      } catch (err) {
        errs.push({ row: i + 2, message: err.response?.data?.message ?? err.message });
      }
    }

    panel.setCreated(createdCount);
    panel.setErrors(errs);
    panel.setStatus('done');
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={500}>{t('dataImport.invoices')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <FilePicker panel={panel} inputRef={inputRef} />
          <ImportButton panel={panel} onClick={handleImport} />
          <ResultDisplay panel={panel} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// ---------- Bills ----------

function BillsPanel() {
  const { t } = useTranslation();
  const inputRef = useRef();
  const panel = useImportPanel();

  const handleImport = async () => {
    panel.setStatus('importing');
    panel.setCreated(0);
    panel.setErrors([]);
    let createdCount = 0;
    const errs = [];

    let contactMap;
    try {
      contactMap = await loadContactMap();
    } catch {
      contactMap = new Map();
    }

    for (let i = 0; i < panel.rows.length; i++) {
      const row = panel.rows[i];
      if (!row.bill_number) continue;

      const issueDate = toIsoDate(row.billed_at);
      if (!issueDate) {
        errs.push({ row: i + 2, message: 'Missing or invalid billed_at date' });
        continue;
      }

      const currency = SUPPORTED_CURRENCIES.has(String(row.currency_code).toUpperCase())
        ? String(row.currency_code).toUpperCase()
        : 'EUR';

      let contactId = null;
      if (row.contact_name) {
        try {
          contactId = await findOrCreateContact(String(row.contact_name), row, contactMap, 'SUPPLIER');
        } catch (err) {
          errs.push({ row: i + 2, message: `Contact: ${err.response?.data?.message ?? err.message}` });
          continue;
        }
      }

      const amount = parseFloat(row.amount) || 0;
      const payload = {
        reference: String(row.bill_number),
        issueDate,
        ...(toIsoDate(row.due_at) && { dueDate: toIsoDate(row.due_at) }),
        currency,
        status: mapBillStatus(row.status),
        ...(contactId && { contactId }),
        ...(row.category_name && { category: String(row.category_name) }),
        ...(row.notes && { notes: String(row.notes) }),
        lines: [{ description: String(row.bill_number), quantity: 1, unitPrice: amount, vatRate: 0 }],
      };

      try {
        await createBill(payload);
        createdCount++;
      } catch (err) {
        errs.push({ row: i + 2, message: err.response?.data?.message ?? err.message });
      }
    }

    panel.setCreated(createdCount);
    panel.setErrors(errs);
    panel.setStatus('done');
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={500}>{t('dataImport.bills')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <FilePicker panel={panel} inputRef={inputRef} />
          <ImportButton panel={panel} onClick={handleImport} />
          <ResultDisplay panel={panel} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function DataImportView() {
  const { t } = useTranslation();
  return (
    <Stack spacing={3}>
      <Typography variant="h4">{t('dataImport.pageTitle')}</Typography>
      <ContactsPanel />
      <InvoicesPanel />
      <BillsPanel />
    </Stack>
  );
}
