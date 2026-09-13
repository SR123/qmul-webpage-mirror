/* Exact, small-domain calculations. No dependencies or network access. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CondorcetModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function parseDomain(text, size) {
    const orders = text.trim().split(/\s+/);
    if (orders.length !== size || new Set(orders).size !== size ||
        orders.some(s => s.split('').sort().join('') !== '1234567') || !orders.includes('1234567')) {
      throw new Error('The selected domain has invalid or duplicate rankings.');
    }
    return orders;
  }
  function inversions(order) {
    let count = 0;
    for (let i = 0; i < order.length; i++)
      for (let j = i + 1; j < order.length; j++) if (order[i] > order[j]) count++;
    return count;
  }
  function graph(orders) {
    const index = new Map(orders.map((s, i) => [s, i]));
    const edges = [], neighbours = orders.map(() => []);
    orders.forEach((s, i) => {
      for (let k = 0; k < s.length - 1; k++) {
        const next = s.slice(0, k) + s[k + 1] + s[k] + s.slice(k + 2);
        const j = index.get(next);
        if (j !== undefined && i < j) {
          edges.push([i, j]); neighbours[i].push(j); neighbours[j].push(i);
        }
      }
    });
    const components = [], seen = new Set();
    orders.forEach((_, i) => {
      if (seen.has(i)) return;
      const part = [i]; seen.add(i);
      for (let k = 0; k < part.length; k++) {
        for (const j of neighbours[part[k]]) if (!seen.has(j)) { seen.add(j); part.push(j); }
      }
      components.push(part);
    });
    return {edges, neighbours, components, levels: orders.map(inversions)};
  }
  function triples() {
    const result = [];
    for (let a = 1; a <= 5; a++) for (let b = a + 1; b <= 6; b++)
      for (let c = b + 1; c <= 7; c++) result.push('' + a + b + c);
    return result;
  }
  function restriction(orders, triple) {
    const positions = Array.from({length: 3}, () => [0, 0, 0]), patterns = new Map();
    for (const order of orders) {
      const local = order.split('').filter(a => triple.includes(a)).join('');
      patterns.set(local, (patterns.get(local) || 0) + 1);
      local.split('').forEach((a, rank) => positions[triple.indexOf(a)][rank]++);
    }
    const absent = [];
    positions.forEach((counts, a) => counts.forEach((n, rank) => {
      if (n === 0) absent.push({alternative: triple[a], rank});
    }));
    return {positions, patterns: [...patterns].sort(), absent};
  }
  return {parseDomain, inversions, graph, triples, restriction};
});
