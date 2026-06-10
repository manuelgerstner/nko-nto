import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import PeopleIcon from '@mui/icons-material/People';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const navConfig = [
  { title: 'nav.dashboard',    path: '/',                          icon: <DashboardIcon /> },
  { title: 'nav.invoices',     path: '/invoices',                  icon: <ReceiptIcon /> },
  { title: 'nav.bills',        path: '/bills',                     icon: <RequestPageIcon /> },
  { title: 'nav.contacts',     path: '/contacts',                  icon: <PeopleIcon /> },
  { title: 'nav.items',        path: '/items',                     icon: <Inventory2Icon /> },
  {
    title: 'nav.settings',
    icon: <SettingsIcon />,
    children: [
      { title: 'nav.generalSettings', path: '/settings/general', icon: <TuneIcon /> },
      { title: 'nav.exchangeRates', path: '/settings/exchange-rates', icon: <CurrencyExchangeIcon /> },
      { title: 'nav.dataImport', path: '/settings/data-import', icon: <UploadFileIcon /> },
      { title: 'nav.team', path: '/settings/team', icon: <GroupAddIcon />, adminOnly: true },
    ],
  },
];

export default navConfig;
