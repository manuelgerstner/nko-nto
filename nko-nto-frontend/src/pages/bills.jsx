import { Helmet } from 'react-helmet-async';
import BillsView from '../sections/bills/view/bills-view';

export default function BillsPage() {
  return (
    <>
      <Helmet><title>Bills | Accounts</title></Helmet>
      <BillsView />
    </>
  );
}
