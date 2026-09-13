/* The atlas is static until the visitor explicitly loads one selected file. */
(function () {
  'use strict';
  const M = window.CondorcetModel;
  if (!M) return;
  const $ = id => document.getElementById(id);
  const base = 'datasets/condorcet/';
  const rows = new Map([...document.querySelectorAll('#census-table tbody tr')].map(row => [Number(row.dataset.size), {...row.dataset, count: Number(row.dataset.count)}]));
  const number = n => n.toLocaleString('en-GB');
  const weight = n => n < 1000000 ? `${(n / 1000).toFixed(1)} KB` : `${(n / 1000000).toFixed(2)} MB`;
  const orderText = s => s.split('').join(' ≻ ');
  const cache = new Map(); // At most three small selected collections.
  let selectedSize = 100, collection = null, currentIndex = 0, orders = [], structure = null;
  let request = null, sequence = 0, desiredIndex = 0;
  const params = new URLSearchParams(location.search);
  if (/^\d+$/.test(params.get('size') || '') && rows.has(Number(params.get('size')))) selectedSize = Number(params.get('size'));
  if (/^\d+$/.test(params.get('domain') || '')) desiredIndex = Math.max(0, Number(params.get('domain')) - 1);
  if (!Number.isSafeInteger(desiredIndex)) desiredIndex = 0;
  $('domain-size').value = String(selectedSize);

  function svg(tag, attrs, text) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs || {}).forEach(([k, v]) => element.setAttribute(k, v));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function setStatus(message, error = false) {
    $('load-status').textContent = message;
    $('load-status').classList.toggle('atlas-error', error);
  }
  function compact(n) {
    if (n >= 1000000) return `${+(n / 1000000).toFixed(1)}m`;
    if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`;
    return String(n);
  }
  function drawChart() {
    const chart = $('census-chart'), range = $('chart-range').value;
    const first = range === 'large' ? 88 : 1, last = range === 'small' ? 16 : 100;
    const log = $('chart-scale').value === 'log';
    const count = last - first + 1, max = Math.max(...[...rows].filter(([s]) => s >= first && s <= last).map(([, r]) => r.count));
    const ceiling = log ? 10 ** Math.ceil(Math.log10(max)) : Math.ceil(max / 10 ** Math.floor(Math.log10(max))) * 10 ** Math.floor(Math.log10(max));
    const width = 960, height = 350, left = 65, right = 20, top = 24, bottom = 45;
    const pw = width - left - right, ph = height - top - bottom;
    chart.replaceChildren(svg('title', {}, 'Seven-alternative Condorcet domain size distribution'), svg('desc', {}, 'Exact values and collection downloads are in the table below. Use the size selector for keyboard access.'));
    const y = n => top + ph * (1 - (log ? Math.log10(Math.max(1, n)) / Math.log10(ceiling) : n / ceiling));
    const ticks = log ? Array.from({length: Math.log10(ceiling) + 1}, (_, k) => 10 ** k) : Array.from({length: 5}, (_, k) => ceiling * k / 4);
    for (const value of ticks) {
      chart.append(svg('path', {d: `M${left} ${y(value)}H${width-right}`, stroke: '#e0e7e8'}), svg('text', {x: left - 9, y: y(value) + 4, 'text-anchor': 'end', fill: '#53636b', 'font-size': 12}, compact(value)));
    }
    for (let size = first; size <= last; size++) {
      const row = rows.get(size), x = left + (size - first) * pw / count;
      if (row.count) {
        const rect = svg('rect', {x, y: y(row.count), width: pw / count * .83, height: top + ph - y(row.count), fill: size === selectedSize ? '#a95027' : row.file ? '#11636a' : '#b8c9cd', 'data-size': size, style: 'cursor:pointer'});
        rect.append(svg('title', {}, `Size ${size}: ${number(row.count)} representatives${row.file ? ', examples included' : ', summary only'}`));
        chart.append(rect);
      }
      if (count <= 16 || size === first || size === last || size % 10 === 0) chart.append(svg('text', {x: x + pw / count / 2, y: height - 24, 'text-anchor': 'middle', fill: '#53636b', 'font-size': 12}, size));
    }
    chart.append(svg('text', {x: left, y: 13, fill: '#53636b', 'font-size': 12}, 'Representatives'), svg('text', {x: width / 2, y: height - 3, fill: '#53636b', 'font-size': 12, 'text-anchor': 'middle'}, 'Domain size · number of rankings'));
    $('chart-description').textContent = log ? 'Logarithmic scale: equal vertical steps represent tenfold increases in count. Zero counts have no bar. Select a bar or use the size selector; exact counts are in the table below.' : 'Linear scale: bar height is proportional to the number of representatives. Select a bar or use the size selector; exact counts are in the table below.';
  }
  function chooseSize(size, updateAddress = true) {
    selectedSize = size; $('domain-size').value = String(size);
    sequence++; if (request) request.abort(); request = null;
    collection = null; orders = []; structure = null;
    $('domain-panel').hidden = true;
    $('domain-panel').removeAttribute('aria-busy');
    const row = rows.get(size), available = Boolean(row.file);
    $('load-domains').disabled = !available;
    $('load-domains').textContent = available ? 'Load this collection' : 'Summary only';
    $('size-detail').textContent = row.count ? `${number(row.count)} archived representative${row.count === 1 ? '' : 's'} with ${size} rankings each. ${available ? 'Every one is included here.' : 'The full archive provides this collection.'}` : `There are no archived representatives with ${size} rankings.`;
    setStatus(available ? `Loads ${weight(Number(row.bytes))} of browser data for this size only. No collection has been loaded.` : row.count ? 'This size is summarized here. Its domain file has not been downloaded to this website.' : 'Choose another size to inspect examples.');
    $('size-source').href = row.sourceFile ? base + row.sourceFile : 'http://abel.math.umu.se/~klasm/Data/CONDORCET/MUCDS/';
    $('size-source').textContent = row.sourceFile ? `Original compressed file · ${weight(Number(row.sourceBytes))}` : 'Full source archive ↗';
    if (row.sourceFile) $('size-source').setAttribute('download', ''); else $('size-source').removeAttribute('download');
    if (updateAddress) {
      const url = new URL(location.href); url.search = new URLSearchParams({size}); url.hash = '';
      try { history.replaceState(null, '', url); } catch (_) { /* Selection still works. */ }
    }
    drawChart();
  }
  async function load() {
    const size = selectedSize, row = rows.get(size);
    if (!row.file) return;
    const token = ++sequence;
    if (request) request.abort();
    const controller = new AbortController(); request = controller;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    $('load-domains').disabled = true;
    $('load-domains').textContent = 'Loading…';
    setStatus(`Loading and checking the size-${size} collection…`);
    try {
      let payload = cache.get(size);
      if (!payload) {
        const response = await fetch(base + row.file, {signal: controller.signal});
        if (!response.ok) throw new Error(`The collection could not be loaded (HTTP ${response.status}).`);
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength !== Number(row.bytes)) throw new Error('The downloaded file is incomplete or does not match this edition of the page.');
        // Secure contexts (including localhost) additionally check the frozen hash.
        if (window.crypto && crypto.subtle) {
          const digest = await crypto.subtle.digest('SHA-256', buffer);
          const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
          if (hash !== row.sha256) throw new Error('The file checksum does not match this edition of the page.');
        }
        payload = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(buffer));
        if (payload.n !== 7 || payload.size !== size || !Array.isArray(payload.domains) || payload.domains.length !== row.count || payload.domains.some(s => typeof s !== 'string')) throw new Error('The collection does not match the selected size and count.');
        // Validate every record once, before exposing the collection.
        payload.domains.forEach(s => M.parseDomain(s, size));
        if (cache.size >= 3) cache.delete(cache.keys().next().value);
        cache.set(size, payload);
      }
      if (token !== sequence) return;
      collection = payload;
      currentIndex = Math.min(desiredIndex, payload.domains.length - 1); desiredIndex = 0;
      $('domain-panel').hidden = false;
      showDomain(currentIndex);
      setStatus(`Loaded all ${number(row.count)} representatives of size ${size}. Choose a domain below.`);
      $('load-domains').textContent = 'Collection loaded';
    } catch (error) {
      if (token !== sequence) return;
      setStatus(timedOut ? 'The download timed out. Check the connection, then retry.' : `${error.message || 'The collection could not be loaded.'} Retry below; the original compressed file is also available.`, true);
      $('load-domains').textContent = 'Retry loading';
      $('load-domains').disabled = false;
    } finally {
      clearTimeout(timer);
      if (token === sequence) request = null;
    }
  }
  function showDomain(index) {
    if (!collection) return;
    currentIndex = index;
    orders = M.parseDomain(collection.domains[index], selectedSize); structure = M.graph(orders);
    $('domain-title').textContent = `A domain with ${selectedSize} rankings`;
    $('domain-ordinal').textContent = `Representative ${number(index + 1)} of ${number(collection.domains.length)}`;
    $('domain-status').textContent = `Showing representative ${number(index + 1)} of size ${selectedSize}. Numbering follows the source file.`;
    $('domain-number').max = String(collection.domains.length); $('domain-number').value = String(index + 1);
    $('previous-domain').disabled = index === 0; $('next-domain').disabled = index === collection.domains.length - 1;
    $('domain-stats').replaceChildren(...[[orders.length, 'rankings'], [structure.edges.length, 'adjacent-swap edges'], [structure.components.length, structure.components.length === 1 ? 'component' : 'components']].map(([n, label]) => {
      const span = element('span'); span.append(element('strong', number(n)), ` ${label}`); return span;
    }));
    const list = $('rankings-list'); list.replaceChildren();
    orders.forEach((order, i) => {
      const button = element('button', order.split('').join(' '), 'ranking-button');
      button.type = 'button'; button.dataset.index = i; button.setAttribute('aria-label', `Ranking ${i + 1}: ${orderText(order)}, best to worst`); button.setAttribute('aria-pressed', 'false'); list.append(button);
    });
    $('ranking-summary').textContent = `Select from all ${orders.length} rankings`;
    drawGraph(); selectRanking(0); showTriple();
    const url = new URL(location.href); url.search = new URLSearchParams({size: selectedSize, domain: index + 1}); url.hash = '';
    $('domain-permalink').href = url.href;
    try { history.replaceState(null, '', url); } catch (_) { /* The link still works if history is unavailable. */ }
    const row = rows.get(selectedSize), details = $('domain-source-details');
    details.replaceChildren(element('p', `Source file: ${row.sourceFile.split('/').pop()}. Representative ${index + 1}, numbered from 1 in source order. Alternatives 0–6 have been relabelled 1–7.`));
    const digest = element('p', 'Original gzip SHA-256: '); digest.append(element('code', row.sourceSha256)); details.append(digest);
    details.append(element('p', 'All included domains were checked for distinct valid rankings, the natural order, the Condorcet triple condition, and maximality among all 7! rankings. The archive supplies the isomorphism classification and completeness claim.'));
  }
  function drawGraph() {
    const graph = $('domain-graph');
    [...graph.children].filter(n => !['title', 'desc'].includes(n.tagName)).forEach(n => n.remove());
    const layers = Array.from({length: 22}, () => []);
    structure.levels.forEach((level, i) => layers[level].push(i));
    const points = orders.map(() => ({}));
    layers.forEach((indices, level) => {
      indices.sort((a, b) => orders[a].localeCompare(orders[b]));
      indices.forEach((i, k) => { points[i] = {x: 34 + level * 41.5, y: 163 + (k - (indices.length - 1) / 2) * Math.min(28, 260 / Math.max(1, indices.length - 1))}; });
    });
    for (let level = 0; level <= 21; level++) {
      const x = 34 + level * 41.5;
      graph.append(svg('path', {d: `M${x} 22V307`, stroke: '#e7eded', 'stroke-dasharray': '2 5'}), svg('text', {x, y: 330, 'text-anchor': 'middle', fill: '#63777c', 'font-size': 12}, level));
    }
    graph.append(svg('text', {x: 470, y: 351, 'text-anchor': 'middle', fill: '#53636b', 'font-size': 12}, 'Inversions relative to the natural order'));
    for (const [a, b] of structure.edges) graph.append(svg('line', {x1: points[a].x, y1: points[a].y, x2: points[b].x, y2: points[b].y, class: 'graph-edge', 'data-a': a, 'data-b': b}));
    points.forEach((p, i) => {
      const circle = svg('circle', {cx: p.x, cy: p.y, r: 6.5, class: 'graph-node', 'data-index': i});
      circle.append(svg('title', {}, orderText(orders[i]))); graph.append(circle);
    });
  }
  function selectRanking(i) {
    if (!orders[i]) return;
    const neighbours = new Set(structure.neighbours[i]);
    $('chosen-order').textContent = orderText(orders[i]);
    $('chosen-neighbours').textContent = neighbours.size ? `${neighbours.size} neighbouring ranking${neighbours.size === 1 ? '' : 's'} can be reached by one adjacent swap within this domain. They are highlighted in ochre.` : 'This ranking has no adjacent-swap neighbour in the domain. It is an isolated node.';
    $('domain-graph').querySelectorAll('.graph-node').forEach(node => { const k = Number(node.dataset.index); node.classList.toggle('node-active', k === i); node.classList.toggle('node-neighbour', neighbours.has(k)); });
    $('domain-graph').querySelectorAll('.graph-edge').forEach(edge => edge.classList.toggle('edge-active', Number(edge.dataset.a) === i || Number(edge.dataset.b) === i));
    $('rankings-list').querySelectorAll('button').forEach((button, k) => { button.setAttribute('aria-pressed', String(k === i)); button.classList.toggle('is-neighbour', neighbours.has(k)); });
  }
  function showTriple() {
    if (!orders.length) return;
    const triple = $('triple-choice').value, result = M.restriction(orders, triple), rankNames = ['first', 'second', 'third'];
    const table = element('table', undefined, 'triple-table'), caption = element('caption', 'Position counts within the chosen triple');
    table.append(caption);
    const head = element('thead'), hr = element('tr');
    ['Alternative', 'First', 'Second', 'Third'].forEach(text => { const th = element('th', text); th.scope = 'col'; hr.append(th); }); head.append(hr); table.append(head);
    const body = element('tbody');
    result.positions.forEach((counts, i) => { const tr = element('tr'), th = element('th', triple[i]); th.scope = 'row'; tr.append(th); counts.forEach(n => tr.append(element('td', n ? String(n) : 'Never', n ? '' : 'never'))); body.append(tr); });
    table.append(body); $('triple-table').replaceChildren(table);
    const explanation = $('triple-explanation');
    explanation.replaceChildren(element('h4', 'A restriction that rules out cycles'));
    explanation.append(element('p', result.absent.map(a => `${a.alternative} is never ${rankNames[a.rank]}`).join('; ') + ` within the triple {${triple.split('').join(', ')}}.`));
    explanation.append(element('p', 'The counts record how many of this domain’s rankings put an alternative in each position after the other four alternatives are removed. They are counts of rankings, not voter frequencies.'));
    const patterns = element('p'); patterns.append(element('strong', `${result.patterns.length} distinct restricted rankings: `)); patterns.append(result.patterns.map(([order, count]) => `${orderText(order)} (${count})`).join('; ')); explanation.append(patterns);
    explanation.append(element('p', 'The same absence condition holds on each of the 35 triples. Together these conditions certify the Condorcet property of the domain.'));
  }
  $('domain-size').addEventListener('change', () => { desiredIndex = 0; chooseSize(Number($('domain-size').value)); });
  $('chart-range').addEventListener('change', drawChart); $('chart-scale').addEventListener('change', drawChart);
  $('census-chart').addEventListener('click', event => { const bar = event.target.closest('[data-size]'); if (bar) { desiredIndex = 0; chooseSize(Number(bar.dataset.size)); } });
  $('load-domains').addEventListener('click', load);
  $('previous-domain').addEventListener('click', () => { if (currentIndex > 0) showDomain(currentIndex - 1); });
  $('next-domain').addEventListener('click', () => { if (collection && currentIndex + 1 < collection.domains.length) showDomain(currentIndex + 1); });
  $('random-domain').addEventListener('click', () => {
    if (!collection || collection.domains.length < 2) return;
    const offset = 1 + Math.floor(Math.random() * (collection.domains.length - 1));
    showDomain((currentIndex + offset) % collection.domains.length);
  });
  $('domain-jump').addEventListener('submit', event => { event.preventDefault(); const index = Number($('domain-number').value) - 1; if (collection && Number.isInteger(index) && index >= 0 && index < collection.domains.length) showDomain(index); });
  $('domain-graph').addEventListener('click', event => { const node = event.target.closest('[data-index]'); if (node) selectRanking(Number(node.dataset.index)); });
  $('rankings-list').addEventListener('click', event => { const node = event.target.closest('button'); if (node) selectRanking(Number(node.dataset.index)); });
  $('triple-choice').addEventListener('change', showTriple);
  M.triples().forEach(triple => { const option = element('option', triple.split('').join(', ')); option.value = triple; $('triple-choice').append(option); });
  $('download-domain').addEventListener('click', () => {
    if (!collection) return;
    const csv = 'rank_1,rank_2,rank_3,rank_4,rank_5,rank_6,rank_7\r\n' + orders.map(order => order.split('').join(',')).join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const a = element('a'); a.href = url; a.download = `mucd-n7-size-${selectedSize}-domain-${currentIndex + 1}.csv`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('chart-tools').hidden = false; $('atlas-interactive').hidden = false;
  chooseSize(selectedSize, false);
})();
