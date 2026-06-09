import { Helmet } from 'react-helmet-async';
import InvoiceDetailView from '../sections/invoices/view/invoice-detail-view';

export default function InvoiceDetailPage() {
  return (
    <>
      <Helmet><title>Invoice | Accounts</title></Helmet>
      <InvoiceDetailView />
    </>
  );
}
