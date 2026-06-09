import { Helmet } from 'react-helmet-async';
import DashboardView from '../sections/dashboard/view/dashboard-view';

export default function DashboardPage() {
  return (
    <>
      <Helmet><title>Dashboard | Accounts</title></Helmet>
      <DashboardView />
    </>
  );
}
