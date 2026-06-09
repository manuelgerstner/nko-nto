import { Helmet } from 'react-helmet-async';
import DataImportView from '../../sections/settings/data-import/view/data-import-view';

export default function DataImportPage() {
  return (
    <>
      <Helmet><title>Data Import | nko-nto</title></Helmet>
      <DataImportView />
    </>
  );
}
