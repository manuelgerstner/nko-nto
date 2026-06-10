import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PUBLIC_PATHS = ['/login', '/signup', '/verify-email', '/accept-invite'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicPath = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
    if (error.response?.status === 401 && !isPublicPath) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// -- Invoices --
export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);

// -- Bills --
export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const createBill = (data) => api.post('/bills', data);
export const updateBill = (id, data) => api.put(`/bills/${id}`, data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);

// -- Contacts --
export const getContacts = (params) => api.get('/contacts', { params });
export const getContact = (id) => api.get(`/contacts/${id}`);
export const createContact = (data) => api.post('/contacts', data);
export const updateContact = (id, data) => api.put(`/contacts/${id}`, data);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);

// -- Items --
export const getItems = () => api.get('/items');
export const createItem = (data) => api.post('/items', data);
export const updateItem = (id, data) => api.put(`/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/items/${id}`);

// -- Dashboard --
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getDashboardMonthlyChart = () => api.get('/dashboard/monthly-chart');

// -- Exchange Rates --
export const getExchangeRates = (params) => api.get('/exchange-rates', { params });
export const triggerExchangeRateFetch = () => api.post('/exchange-rates/fetch');
export const getExchangeRatesForDates = (params) => api.get('/exchange-rates/for-dates', { params });

// -- App Settings --
export const getAppSettings = () => api.get('/settings');
export const updateAppSettings = (data) => api.put('/settings', data);

// -- Invitations --
export const createInvitation = () => api.post('/invitations');
export const getInvitations = () => api.get('/invitations');
export const previewInvitation = (token) => api.get(`/invitations/${token}/preview`);

export default api;
