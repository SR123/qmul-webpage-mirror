// The bibliography itself is static. Filtering only enhances it.
(() => {
  const form = document.getElementById('publication-filters');
  const query = document.getElementById('paper-query');
  const topic = document.getElementById('paper-topic');
  const type = document.getElementById('paper-type');
  const entries = [...document.querySelectorAll('.publication')];
  const groups = [...document.querySelectorAll('.year-group')];
  const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const searchText = new Map(entries.map(p => [p, fold(p.textContent + ' ' + p.dataset.search)]));
  function filter() {
    const terms = fold(query.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    entries.forEach(p => {
      p.hidden = !terms.every(t => searchText.get(p).includes(t)) || Boolean(topic.value && p.dataset.topic !== topic.value) || Boolean(type.value && p.dataset.type !== type.value);
      if (!p.hidden) visible++;
    });
    groups.forEach(g => { g.hidden = ![...g.querySelectorAll('.publication')].some(p => !p.hidden); });
    document.getElementById('filter-status').textContent = `${visible} of ${entries.length} records shown.`;
    document.getElementById('no-results').hidden = visible > 0;
  }
  form.hidden = false;
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('reset', () => setTimeout(filter, 0));
  // A paper anchor must remain reachable after filtering.
  function revealAnchor() {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.closest('.year-group') && (target.hidden || target.closest('.year-group').hidden)) {
      form.reset(); query.value = ''; topic.value = ''; type.value = ''; filter(); target.scrollIntoView();
    }
  }
  window.addEventListener('hashchange', revealAnchor);
})();
