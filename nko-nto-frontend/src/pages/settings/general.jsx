import { Helmet } from 'react-helmet-async';
import GeneralSettingsView from '../../sections/settings/general/view/general-settings-view';

export default function GeneralSettingsPage() {
  return (
    <>
      <Helmet><title>General Settings | nko-nto</title></Helmet>
      <GeneralSettingsView />
    </>
  );
}
