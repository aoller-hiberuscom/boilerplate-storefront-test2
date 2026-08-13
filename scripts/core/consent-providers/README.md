# Consent providers (CMP)

Aquí vivirá la integración con el CMP que elija Sports Emotion (OneTrust,
Didomi, Cookiebot…). El contrato está definido en `scripts/core/consent.js`
(`ConsentProvider`): un objeto con `getConsent(topic)` y, opcionalmente,
`subscribe(notify)` para avisar de cambios de preferencias.

Hasta que exista un provider real, rige el provider por defecto (permisivo,
con warning en consola). **Resolver antes de salir a producción.**

## Cómo integrar el CMP cuando se decida

1. Crear `scripts/core/consent-providers/<cmp>.js`:

```js
// Ejemplo orientativo (adaptar a la API real del CMP elegido)
import { CONSENT_TOPICS } from '../consent.js';

// Mapeo de topics del proyecto → categorías del CMP
const TOPIC_TO_CATEGORY = {
  [CONSENT_TOPICS.COMMERCE_COLLECTION]: 'analytics',
  [CONSENT_TOPICS.COMMERCE_RECOMMENDATIONS]: 'personalization',
};

export default {
  getConsent(topic) {
    const category = TOPIC_TO_CATEGORY[topic];
    // return window.<CmpApi>.hasConsent(category);
    return false; // denegar por defecto hasta respuesta del usuario
  },
  subscribe(notify) {
    // window.<CmpApi>.onConsentChanged(notify);
  },
};
```

2. Cargar el script del CMP donde exija su documentación legal (normalmente
   en `head.html` con bloqueo previo, o en `scripts/delayed.js` si es
   no bloqueante) y, cuando esté listo, registrar el provider:

```js
import { setConsentProvider } from '../consent.js';
import cmpProvider from './consent-providers/<cmp>.js';

setConsentProvider(cmpProvider);
```

3. No hay que tocar los consumidores: `domain/analytics.js` y `delayed.js`
   ya son reactivos vía `whenConsented()` — arrancan cuando el usuario
   otorga consentimiento y re-comprueban en cada escritura para respetar
   la revocación.

Ver `docs/adr/0004-consent-provider.md` para el razonamiento completo.
