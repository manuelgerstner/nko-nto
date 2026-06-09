import { Helmet } from 'react-helmet-async';
import BillDetailView from '../sections/bills/view/bill-detail-view';

export default function BillDetailPage() {
  return (
    <>
      <Helmet><title>Bill | Accounts</title></Helmet>
      <BillDetailView />
    </>
  );
}
