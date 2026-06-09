import { Helmet } from 'react-helmet-async';
import InvoicesView from '../sections/invoices/view/invoices-view';

export default function InvoicesPage() {
  return (
    <>
      <Helmet><title>Invoices | Accounts</title></Helmet>
      <InvoicesView />
    </>
  );
}
