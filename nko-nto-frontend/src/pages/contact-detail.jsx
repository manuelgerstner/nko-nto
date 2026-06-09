import { Helmet } from 'react-helmet-async';
import ContactDetailView from '../sections/contacts/view/contact-detail-view';

export default function ContactDetailPage() {
  return (
    <>
      <Helmet><title>Contact | Accounts</title></Helmet>
      <ContactDetailView />
    </>
  );
}
