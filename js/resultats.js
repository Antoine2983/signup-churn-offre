/* Page Résultats · calcule et affiche le rapport, joue l'animation d'analyse,
   capture le lead (Formspree). Données reçues via querystring depuis analyse.html */

/* ---------- Lecture des paramètres ---------- */

const qs = new URLSearchParams(location.search);
const num = k => { const v = parseFloat(qs.get(k)); return isNaN(v) ? null : v; };
const data = {
  model: qs.get('model'),
  visitors: num('visitors'), signups: num('signups'),
  paid: num('paid'), arpa: num('arpa'),
  e2p: num('e2p'), activations: num('activations'), retention: num('retention')
};

if (!MODELS[data.model] || data.visitors == null || data.signups == null || data.paid == null || data.arpa == null) {
  location.replace('analyse.html');
}

const m = MODELS[data.model];
document.getElementById('editLink').href = 'analyse.html?' + qs.toString();

/* ---------- Rendu des lignes ---------- */

function verdict(v, med) {
  if (v >= med * 1.1) return ['ok',   'AU-DESSUS'];
  if (v >= med * 0.9) return ['mid',  'DANS LA MOYENNE'];
  if (v >= med * 0.7) return ['warn', 'JUSTE EN DESSOUS'];
  return ['ko', 'SOUS LE MARCHÉ'];
}
const CHIP = { ok: 'chip--ok', mid: 'chip--ok', warn: 'chip--warn', ko: 'chip--ko' };

function scaleHTML(v, med, cls) {
  const W = 300, ZONE_W = 90;
  const x = r => Math.max(4, Math.min(W - 8, (r / (med * 2)) * W));
  const medX = W / 2;
  return `<div class="scale">
    <div class="track"></div>
    <div class="zone" style="left:${medX - ZONE_W / 2}px;width:${ZONE_W}px"></div>
    <div class="med" style="left:${medX}px"></div>
    <div class="dot ${cls}" style="left:${x(v) - 6.5}px"></div>
  </div>`;
}
function lectureHTML(v, med) {
  const diff = v - med;
  const better = diff >= 0;
  return `<div class="rlecture"><span class="b ${better ? 'ok' : 'ko'}">${pts(Math.abs(diff))} pt${Math.abs(diff) >= 2 ? 's' : ''}</span><span class="c">${better ? 'de mieux' : 'à récupérer'} · moyenne ${pc(med)}</span></div>`;
}
function rowHTML(name, sub, v, med) {
  const [cls, label] = verdict(v, med);
  return `<div class="rrow">
    <div class="rmark"><div class="n">${name}</div><div class="s">${sub}</div></div>
    <div class="rval ${cls}">${pc(v)}</div>
    <div class="rflag"><span class="chip ${CHIP[cls]}">${label}</span></div>
    <div class="rscale">${scaleHTML(v, med, cls)}${lectureHTML(v, med)}</div>
  </div>`;
}
function lockedRowHTML(name, sub, focusField) {
  const back = new URLSearchParams(qs); back.set('refine', '1'); back.set('focus', focusField);
  return `<div class="rrow locked">
    <div class="rmark"><div class="n">${name}</div><div class="s">${sub}</div></div>
    <div class="rval">00,0&nbsp;%</div>
    <div class="rflag"><span class="chip chip--locked">🔒 Verrouillé</span></div>
    <div class="rscale"><a href="analyse.html?${back.toString()}" class="unlock">Renseigne ce chiffre pour débloquer →</a></div>
  </div>`;
}

/* ---------- Contexte lead + objectifs CTA ---------- */

let leadContext = { subject: '', report: '' };

function setGoalCtas(label) {
  document.querySelectorAll('[data-goal-label]').forEach(el => el.textContent = label);
  document.querySelectorAll('[data-goal-cta]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => document.getElementById('leadPhone')?.focus({ preventScroll: true }), 600);
    });
  });
}

/* ---------- Rapport self-serve ---------- */

function renderStandard() {
  const r1 = data.signups / data.visitors * 100;
  const r2 = data.signups ? data.paid / data.signups * 100 : 0;

  const deriv = [];
  let extraSignups = 0, extraPaid = 0, s2pPaid = 0, convPaid = 0;
  if (r1 < m.v2s) {
    extraSignups = Math.round((m.v2s - r1) / 100 * data.visitors);
    deriv.push(['Face au marché · Visiteurs → Inscrits', `${pts(m.v2s - r1)} pt${m.v2s - r1 >= 2 ? 's' : ''} × ${nf(data.visitors)}`, `+${nf(extraSignups)} inscrits`]);
  }
  if (r2 < m.s2p) {
    s2pPaid = Math.round((m.s2p - r2) / 100 * data.signups);
    extraPaid += s2pPaid;
    deriv.push(['Face au marché · Inscrits → Payants', `${pts(m.s2p - r2)} pt${m.s2p - r2 >= 2 ? 's' : ''} × ${nf(data.signups)}`, `+${nf(s2pPaid)} payants`]);
  }
  if (extraSignups > 0) {
    convPaid = Math.round(extraSignups * Math.max(r2, 0) / 100);
    if (convPaid > 0) {
      extraPaid += convPaid;
      deriv.push(['Nouveaux inscrits convertis', `${nf(extraSignups)} × ${pc(r2)}`, `+${nf(convPaid)} payants`]);
    }
  }
  const annual = extraPaid * data.arpa * 12;
  if (extraPaid > 0) deriv.push(['Prix moyen payé', `${nf(extraPaid)} × ${nf(data.arpa)} € × 12`, eu(annual)]);

  // Lignes
  const rows = [];
  rows.push(rowHTML('Visiteurs → Inscrits', 'Landing → compte créé', r1, m.v2s));
  if (data.activations != null && data.signups) {
    rows.push(rowHTML('Activation à J7', 'Compte → première valeur', data.activations / data.signups * 100, ACT_MED));
  } else {
    rows.push(lockedRowHTML('Activation à J7', 'Compte → première valeur', 'activations'));
  }
  if (m.trial) {
    if (data.e2p != null) {
      rows.push(rowHTML('Essai → Payant', "Fin d'essai → carte saisie", data.e2p, E2P_MED[data.model]));
    } else {
      rows.push(lockedRowHTML('Essai → Payant', "Fin d'essai → carte saisie", 'e2p'));
    }
  }
  rows.push(rowHTML('Inscrits → Payants', 'Bout en bout du funnel', r2, m.s2p));
  if (data.retention != null) {
    rows.push(rowHTML('Rétention à 1 mois', 'Payants encore là après 30 j', data.retention, RET_MED));
  } else {
    rows.push(lockedRowHTML('Rétention à 1 mois', 'Payants encore là après 30 j', 'retention'));
  }
  document.getElementById('rows').innerHTML = rows.join('');

  const totalEl = document.getElementById('totalAmount');
  const capTitle = document.getElementById('capTitle');
  const capBody = document.getElementById('capBody');

  if (annual > 0) {
    document.getElementById('interpEyebrow').textContent = 'CE QUE TU PEUX RÉCUPÉRER';
    document.getElementById('totalLabel').textContent = 'Manque à gagner annuel';
    totalEl.dataset.amount = String(annual);
    document.getElementById('derivation').style.display = '';
    document.getElementById('derivLines').innerHTML = deriv.map(([k, c, v]) =>
      `<div class="deriv-line"><span class="k">${k}</span><span class="c">${c}</span><span class="v">${v}</span></div>`).join('');
    capTitle.innerHTML = `Récupère ${eu(Math.round(annual / 12))} par&nbsp;mois.<br>Et c'est l'estimation basse&nbsp;!`;
    capBody.textContent = 'On examine en call plus précisément ton résultat avec le contexte de ton produit.';
    setGoalCtas(`Récupérer mes ${eu(annual)}`);
  } else {
    document.getElementById('interpEyebrow').textContent = 'TON FUNNEL TIENT LA ROUTE';
    document.getElementById('totalLabel').textContent = 'Manque à gagner annuel';
    totalEl.dataset.amount = '0';
    document.getElementById('derivation').style.display = 'none';
    capTitle.textContent = 'Au-dessus des moyennes. Et maintenant ?';
    capBody.textContent = 'La moyenne situe, elle ne prescrit pas : la bande haute de ton segment fait 1,5× la moyenne. On regarde ensemble où passer le prochain palier.';
    setGoalCtas('Viser la bande haute');
  }

  leadContext = {
    subject: annual > 0 ? `${eu(annual)} de manque à gagner` : 'au-dessus des moyennes',
    report: [
      `Modèle : ${m.label}`,
      `Visiteurs / mois : ${nf(data.visitors)}`,
      `Inscrits / mois : ${nf(data.signups)} (${pc(r1)} · moyenne ${pc(m.v2s)})`,
      `Payants / mois : ${nf(data.paid)} (${pc(r2)} · moyenne ${pc(m.s2p)})`,
      data.e2p != null && m.trial ? `Essai → payant : ${pc(data.e2p)} (réf. ${pc(E2P_MED[data.model])})` : null,
      data.activations != null ? `Activations à J7 : ${nf(data.activations)}` : null,
      data.retention != null ? `Rétention à 1 mois : ${pc(data.retention)}` : null,
      `ARPA : ${nf(data.arpa)} €/mois`,
      `Manque à gagner annuel estimé : ${eu(annual)}`
    ].filter(Boolean).join('\n')
  };
  return annual;
}

/* ---------- Rapport démo commerciale (projection self-serve) ---------- */

function renderDemo() {
  const r1 = data.signups / data.visitors * 100;
  const r2 = data.signups ? data.paid / data.signups * 100 : 0;

  document.getElementById('rows').innerHTML = [
    rowHTML('Visiteurs → Démos', 'Landing → demande de démo', r1, m.v2s),
    rowHTML('Démos → Signés', 'Démo → contrat signé', r2, m.s2p)
  ].join('');

  const p = MODELS[PROJ_MODEL];
  const potSignups = Math.round(data.visitors * p.v2s / 100);
  const potPaid = Math.round(potSignups * p.s2p / 100);
  const annual = potPaid * data.arpa * 12;

  document.getElementById('interpEyebrow').textContent = 'CE QUE TON TRAFIC VAUDRAIT EN SELF-SERVE';
  document.getElementById('totalLabel').textContent = 'Potentiel self-serve annuel';
  document.getElementById('totalAmount').dataset.amount = String(annual);
  document.getElementById('derivation').style.display = '';
  document.getElementById('derivLines').innerHTML = [
    ['Ton trafic × moyenne self-serve (Essai sans CB)', `${nf(data.visitors)} × ${pc(p.v2s)}`, `≈ ${nf(potSignups)} inscrits`],
    ['Inscrits → payants self-serve', `${nf(potSignups)} × ${pc(p.s2p)}`, `≈ ${nf(potPaid)} clients`],
    ['À ton prix moyen actuel', `${nf(potPaid)} × ${nf(data.arpa)} € × 12`, eu(annual)]
  ].map(([k, c, v]) => `<div class="deriv-line"><span class="k">${k}</span><span class="c">${c}</span><span class="v">${v}</span></div>`).join('');

  document.getElementById('capTitle').innerHTML = `Va chercher ${eu(Math.round(annual / 12))} par&nbsp;mois.<br>En parallèle de ton pipe sales.`;
  document.getElementById('capBody').textContent =
    'La vente en démo plafonne avec ton équipe sales · ton trafic, lui, ne plafonne pas. On regarde en call comment ajouter un funnel self-serve à côté de ta vente en démo, sans casser ton pipe. Estimation à ton prix actuel · on affine ensemble.';
  setGoalCtas(`Débloquer ces ${eu(annual)}`);

  leadContext = {
    subject: `${eu(annual)} de potentiel self-serve (démo commerciale)`,
    report: [
      `Modèle : ${m.label}`,
      `Visiteurs / mois : ${nf(data.visitors)}`,
      `Demandes de démo / mois : ${nf(data.signups)} (${pc(r1)} · benchmark ${pc(m.v2s)})`,
      `Clients signés / mois : ${nf(data.paid)} (${pc(r2)} · benchmark ${pc(m.s2p)})`,
      `Prix moyen : ${nf(data.arpa)} €/mois`,
      `Potentiel self-serve annuel estimé : ${eu(annual)}`
    ].join('\n')
  };
  return annual;
}

/* ---------- Adaptation overlay + rendu ---------- */

if (m.demo) {
  const lines = document.querySelectorAll('.analysis-line');
  lines[1].lastChild.textContent = 'Comparaison aux benchmarks sales-led';
  lines[3].lastChild.textContent = 'Projection de ton trafic en self-serve';
  document.getElementById('analysisSub').textContent =
    'Références : First Page Sage × HubSpot (sales-led) · ChartMogul × ProductLed × Poyar 2026';
}
const totalAnnual = m.demo ? renderDemo() : renderStandard();

/* ---------- Animation d'entrée (overlay puis reveal) ---------- */

const overlay = document.getElementById('analysisOverlay');
const page = document.getElementById('reportPage');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealReport() {
  overlay.classList.add('out');
  document.getElementById('wstep2').classList.remove('active');
  document.getElementById('wstep2').classList.add('done');
  document.getElementById('wstep3').classList.add('active');
  page.classList.add('in');
  setTimeout(() => overlay.remove(), 700);
  // Count-up du montant
  const totalEl = document.getElementById('totalAmount');
  const target = parseInt(totalEl.dataset.amount || '0', 10);
  if (reduced || target === 0) { totalEl.textContent = eu(target); }
  else { countUpAmount(totalEl, target); }
  window.scrollTo({ top: 0 });
}
function countUpAmount(el, to) {
  const t0 = performance.now(), dur = 1200;
  const ease = t => 1 - Math.pow(1 - t, 3);
  (function tick(now) {
    const p = Math.min(1, ((now || performance.now()) - t0) / dur);
    el.textContent = eu(to * ease(p));
    if (p < 1) requestAnimationFrame(tick);
  })();
  // rAF est suspendu si l'onglet est en arrière-plan : on garantit la valeur finale
  setTimeout(() => { el.textContent = eu(to); }, dur + 200);
}

if (reduced) {
  setTimeout(revealReport, 250);
} else {
  const lines = document.querySelectorAll('.analysis-line');
  lines.forEach((l, i) => setTimeout(() => l.classList.add('on'), 450 + i * 620));
  setTimeout(revealReport, 450 + lines.length * 620 + 500);
}

/* ---------- Capture lead (Formspree, sans redirection) ---------- */

document.getElementById('phoneForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('leadPhone');
  const phone = input.value.trim();
  if ((phone.match(/\d/g) || []).length < 6) { input.classList.add('err'); return; }
  input.classList.remove('err');
  const form = e.currentTarget;
  form.querySelector('button').disabled = true;
  fetch(FORMSPREE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      type: 'Rappel / message',
      telephone: phone,
      rapport: leadContext.report,
      _subject: `[Signup Churn] 📞 Contact · ${leadContext.subject}`
    })
  }).then(r => {
    if (r.ok) form.innerHTML = '<div class="lead-ok">✓ Bien reçu. Je te contacte dans la journée.</div>';
    else { form.querySelector('button').disabled = false; input.classList.add('err'); }
  }).catch(() => { form.querySelector('button').disabled = false; input.classList.add('err'); });
});
