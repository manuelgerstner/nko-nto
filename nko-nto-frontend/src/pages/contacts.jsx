import { Helmet } from 'react-helmet-async';
import ContactsView from '../sections/contacts/view/contacts-view';

export default function ContactsPage() {
  return (
    <>
      <Helmet><title>Contacts | Accounts</title></Helmet>
      <ContactsView />
    </>
  );
}
