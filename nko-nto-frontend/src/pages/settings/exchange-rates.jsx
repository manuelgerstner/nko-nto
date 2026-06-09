import { Helmet } from 'react-helmet-async';
import ExchangeRatesView from '../../sections/settings/exchange-rates/view/exchange-rates-view';

export default function ExchangeRatesPage() {
  return (
    <>
      <Helmet><title>Exchange Rates | nko-nto</title></Helmet>
      <ExchangeRatesView />
    </>
  );
}
