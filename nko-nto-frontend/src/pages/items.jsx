import { Helmet } from 'react-helmet-async';
import ItemsView from '../sections/items/view/items-view';

export default function ItemsPage() {
  return (
    <>
      <Helmet><title>Items | Accounts</title></Helmet>
      <ItemsView />
    </>
  );
}
