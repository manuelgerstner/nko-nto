import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import xh from './locales/xh.json';
import zu from './locales/zu.json';

const savedLng = localStorage.getItem('nko-lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      es: { translation: es },
      pt: { translation: pt },
      xh: { translation: xh },
      zu: { translation: zu },
    },
    lng: savedLng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
