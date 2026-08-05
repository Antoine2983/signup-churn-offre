/* Page Analyse · formulaire "Entre tes chiffres"
   Valide, adapte les libellés au modèle, puis envoie vers resultats.html?… */

const modelSelect = document.getElementById('model');
const refineToggle = document.getElementById('refineToggle');

refineToggle.addEventListener('click', () => {
  refineToggle.classList.toggle('open');
  document.getElementById('refine').classList.toggle('open');
});

function isDemoModel() { return modelSelect.value === 'demo'; }
function isTrialModel() { return !!MODELS[modelSelect.value]?.trial; }

function syncModelUI() {
  const demo = isDemoModel();
  const trial = isTrialModel();
  document.getElementById('lblSignups').textContent = demo ? 'Demandes de démo / mois' : 'Inscrits / mois';
  document.getElementById('lblPaid').textContent = demo ? 'Clients signés / mois' : 'Inscrits → payants / mois';
  document.getElementById('signups').placeholder = demo ? '180' : '1200';
  document.getElementById('paid').placeholder = demo ? '40' : '30';
  document.getElementById('arpa').placeholder = demo ? '350' : '80';
  // Essai → payant : seulement pour les modèles à essai
  document.getElementById('rowE2p').style.display = trial ? '' : 'none';
  if (!trial) document.getElementById('e2p').value = '';
  document.getElementById('refineCount').textContent = trial ? '3' : '2';
  // En démo commerciale, les marqueurs self-serve n'ont pas de sens
  refineToggle.style.display = demo ? 'none' : '';
  if (demo) {
    refineToggle.classList.remove('open');
    document.getElementById('refine').classList.remove('open');
    ['e2p', 'activations', 'retention'].forEach(id => document.getElementById(id).value = '');
  }
}
modelSelect.addEventListener('change', syncModelUI);

document.getElementById('simForm').addEventListener('submit', e => {
  e.preventDefault();
  const num = id => {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? null : v;
  };
  const d = {
    model: modelSelect.value,
    visitors: num('visitors'), signups: num('signups'),
    paid: num('paid'), arpa: num('arpa'),
    e2p: num('e2p'), activations: num('activations'), retention: num('retention')
  };
  if (d.visitors == null || d.signups == null || d.paid == null || d.arpa == null) {
    ['visitors', 'signups', 'paid', 'arpa'].forEach(k => {
      document.getElementById(k).style.borderColor = d[k] == null ? '#8c0f02' : '';
    });
    return;
  }
  const qs = new URLSearchParams({ model: d.model, visitors: d.visitors, signups: d.signups, paid: d.paid, arpa: d.arpa });
  if (d.e2p != null && isTrialModel()) qs.set('e2p', d.e2p);
  if (d.activations != null) qs.set('activations', d.activations);
  if (d.retention != null) qs.set('retention', d.retention);
  location.href = 'resultats.html?' + qs.toString();
});

/* Pré-remplissage (retour depuis le rapport, liens landing, déblocage) */
const qs = new URLSearchParams(location.search);
['visitors', 'signups', 'paid', 'arpa', 'e2p', 'activations', 'retention'].forEach(k => {
  if (qs.has(k)) document.getElementById(k).value = qs.get(k);
});
if (qs.has('model') && MODELS[qs.get('model')]) modelSelect.value = qs.get('model');
syncModelUI();
if (qs.get('refine') === '1' && !isDemoModel()) {
  refineToggle.classList.add('open');
  document.getElementById('refine').classList.add('open');
  const target = qs.get('focus');
  const el = document.getElementById(target && ['e2p', 'activations', 'retention'].includes(target) ? target : 'activations');
  setTimeout(() => el.focus(), 150);
}
