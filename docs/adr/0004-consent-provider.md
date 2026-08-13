# ADR 0004 — Consentimiento RGPD mediante patrón provider (CMP-agnóstico)

**Fecha:** 2026-07-17 · **Estado:** Aceptada (CMP concreto pendiente de decisión)

## Contexto

El boilerplate traía `getConsent()` como stub que devolvía siempre `true`: analítica de Adobe e historial de navegación corrían sin consentimiento real, incumpliendo RGPD/ePrivacy para una tienda que opera en la UE. Sports Emotion aún no ha decidido qué CMP (Consent Management Platform: OneTrust, Didomi, Cookiebot…) usará.

## Decisión

`scripts/core/consent.js` implementa un patrón provider: define el contrato `ConsentProvider` (`getConsent(topic)` + `subscribe(notify)` opcional), los topics del proyecto (`CONSENT_TOPICS`), y las APIs `setConsentProvider()`, `getConsent()`, `onConsentChange()` y `whenConsented()`. Los cambios de consentimiento se propagan además por el event bus (`se/consent-changed`).

Los consumidores son reactivos y no conocen el CMP: `delayed.js` (events SDK/collector) y `domain/analytics.js` (historial) arrancan vía `whenConsented()` y re-comprueban el consentimiento en cada escritura para respetar la revocación. Integrar el CMP futuro = escribir un provider en `scripts/core/consent-providers/` y registrarlo (ver README de esa carpeta); cero cambios en consumidores.

Hasta entonces rige un provider por defecto **permisivo** (comportamiento idéntico al boilerplate), señalizado con warning en consola.

## Consecuencias

La decisión del CMP queda desacoplada del código y puede tomarse cuando el cliente quiera. Riesgo aceptado temporalmente: en producción sin CMP se seguiría trackeando sin consentimiento — es un bloqueo legal para el go-live, no técnico. Limitación conocida: una vez cargado el events SDK no se descarga al revocar; el gating por topic evita nuevas escrituras propias y el CMP habitualmente gestiona el bloqueo de cookies de terceros.
