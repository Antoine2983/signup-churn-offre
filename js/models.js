/* Signup Churn — données partagées (moyennes marché + config)
   Moyennes self-serve : ChartMogul × ProductLed × Poyar 2026, 200 SaaS B2B self-serve
   Benchmarks sales-led (démo commerciale) : First Page Sage × HubSpot */

const MODELS = {
  freemium: { label: 'Freemium',         v2s: 9.0, s2p: 4.1,  trial: false },
  ungated:  { label: 'Produit ouvert',   v2s: 6.5, s2p: 12.0, trial: false },
  optin:    { label: 'Essai sans CB',    v2s: 3.2, s2p: 45.0, trial: true  },
  cb:       { label: 'Essai avec CB',    v2s: 2.1, s2p: 22.0, trial: true  },
  demo:     { label: 'Démo commerciale', v2s: 2.1, s2p: 22.0, trial: false, demo: true }
};

// Marqueurs indépendants du modèle
const ACT_MED = 36;   // activation à J7 (%)
const RET_MED = 75;   // rétention à M1 (%)
// Essai → payant en fin d'essai (%) — À VALIDER : pas couvert par l'étude
const E2P_MED = { optin: 25, cb: 60 };

// Référence de projection self-serve pour les SaaS sales-led
const PROJ_MODEL = 'optin';

const CALENDLY = 'https://calendly.com/signup-churn/call-15min';
const FORMSPREE = 'https://formspree.io/f/xrennrdp';

const eu = n => Math.round(n).toLocaleString('fr-FR') + ' €';
const pc = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR') + ' %';
const pts = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
const nf = n => n.toLocaleString('fr-FR');
