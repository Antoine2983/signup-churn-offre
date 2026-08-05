/* FAQ partagée (Home / Analyse / Résultats) · injectée dans #faqList */

const FAQ_ITEMS = [
  {
    q: "Je n'ai pas tous mes chiffres sous la main",
    a: "Commence avec ce que tu as : visiteurs, inscriptions et payants suffisent pour un premier verdict. Les champs optionnels ne font qu'affiner. Au call, on retrouve les chiffres manquants ensemble, dans ton outil d'analyse."
  },
  {
    q: "En combien de temps je peux espérer une amélioration ?",
    a: "Le protocole tient en un mois : audit semaine 1, sprint semaine 2, nouvelle mesure semaine 4. Les premiers effets se voient dès le sprint · et on contrôle à J+90 que les gains tiennent dans le temps."
  },
  {
    q: "Combien coûte l'audit ?",
    a: "Un forfait fixe, calé sur la taille de ton funnel · et 100 % crédité si on enchaîne sur le sprint : dans ce cas, l'audit ne te coûte rien. Le montant exact se pose en 15 min de call, une fois ton rapport lu. Pas de surprise, pas d'engagement."
  },
  {
    q: "Combien coûte le sprint ?",
    a: "Ça dépend du périmètre défini à l'audit : on chiffre d'abord ce qu'il y a à récupérer, et le prix se cale sur ce potentiel · jamais l'inverse. Au call, tu sauras exactement quoi, combien, et en combien de temps."
  },
  {
    q: "D'où sortent les intervalles de référence ?",
    a: "Des benchmarks ChartMogul × ProductLed × Poyar 2026, sur 200 produits B2B self-serve, recoupés avec les données de mes propres missions. La distribution est bimodale : la moyenne situe, elle ne prescrit pas · c'est pour ça que le rapport croise toujours le chiffre avec le contexte de ton produit. <a href=\"etude.html\">Consulter l'étude complète →</a>"
  }
];

(function renderFaq() {
  const wrap = document.getElementById('faqList');
  if (!wrap) return;
  wrap.innerHTML = FAQ_ITEMS.map((it, i) => `
    <div class="faq-item${i === 0 ? ' open' : ''}">
      <button type="button" class="faq-q">
        <span>${it.q}</span>
        <span class="faq-i" aria-hidden="true"></span>
      </button>
      <div class="faq-a"><div class="faq-a-in"><p>${it.a}</p></div></div>
    </div>`).join('');
})();
