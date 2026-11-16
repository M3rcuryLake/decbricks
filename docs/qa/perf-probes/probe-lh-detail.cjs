// Phase 1: extract LCP/CLS/a11y/render-blocking/long-tasks/JS-attribution details from battery JSONs.
const fs = require('fs');
const DIR = '/home/ankit/GitHub/decbricks/docs/qa/perf-before';
const routes = ['home', 'services', 'about', 'contact', 'terms', 'notfound'];

for (const r of routes) {
  console.log('\n########## ' + r.toUpperCase());
  for (const p of [1, 2, 3]) {
    const f = `${DIR}/${r}-p${p}.json`;
    if (!fs.existsSync(f)) { console.log('missing ' + f); continue; }
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const a = j.audits;
    const net = a['network-requests'];
    const items = net && net.details && net.details.items ? net.details.items : [];
    if (p === 1) {
      const by = {};
      for (const i of items) { const t = i.resourceType || 'Other'; by[t] = by[t] || { n: 0, kb: 0 }; by[t].n++; by[t].kb += (i.transferSize || 0) / 1024; }
      console.log('network: ' + items.length + ' req | ' + Object.entries(by).map(([t, v]) => `${t}:${v.n}/${Math.round(v.kb)}KB`).join(' '));
      const rb = a['render-blocking-resources'];
      if (rb && rb.details && rb.details.items) console.log('render-blocking: ' + rb.details.items.map(i => i.url.replace(/^https?:\/\/[^/]+/, '')).join(', ') + ` (${Math.round(rb.numericValue)}ms)`);
      const lcpEl = a['largest-contentful-paint-element'];
      const el = lcpEl && lcpEl.details && lcpEl.details.items && lcpEl.details.items[0];
      if (el) console.log('LCP elem: ' + JSON.stringify(el).slice(0, 260));
      const lazy = a['lcp-lazy-loaded'];
      if (lazy && lazy.score !== null && lazy.score < 1) console.log('lcp-lazy-loaded score ' + lazy.score);
    }
    const cls = a['cumulative-layout-shift'];
    const ls = a['layout-shifts'];
    if (cls && cls.numericValue > 0.005) {
      console.log(`p${p} CLS=${cls.numericValue.toFixed(4)}`);
      const li = ls && ls.details && ls.details.items ? ls.details.items : [];
      for (const it of li.slice(0, 6)) {
        console.log('   shift ' + (it.score || '').toString().slice(0, 6) + ' | ' + JSON.stringify(it.node || {}).slice(0, 150) + ' | ' + (it.extra ? String(it.extra).slice(0, 90) : ''));
      }
    }
  }
  // a11y + long tasks from median pass
  const j = JSON.parse(fs.readFileSync(`${DIR}/${r}-p2.json`, 'utf8'));
  const a = j.audits;
  for (const id of ['aria-allowed-role', 'color-contrast', 'label-content-name-mismatch', 'image-redundant-alt', 'listitem', 'definition-list']) {
    const au = a[id];
    if (au && au.score !== null && au.score < 1) {
      const nodes = au.details && au.details.items ? au.details.items : [];
      console.log(`a11y ${id}: score=${au.score} weight? items=${nodes.length}`);
      for (const n of nodes.slice(0, 4)) console.log('   - ' + JSON.stringify(n.node ? { sel: n.node.selector, label: (n.node.nodeLabel || '').slice(0, 60), explain: (n.node.explanation || '').slice(0, 90) } : n).slice(0, 200));
    }
  }
  const lt = a['long-tasks'];
  if (lt && lt.details && lt.details.items) {
    console.log('long-tasks total=' + Math.round(lt.numericValue) + 'ms, top:');
    for (const t of lt.details.items.slice(0, 5)) console.log(`   ${Math.round(t.duration)}ms @${Math.round(t.startTime)}ms ${String(t.scriptEvaluator || '').slice(0, 40)} ${(t.url || '').replace(/^https?:\/\/[^/]+/, '').slice(0, 60)}`);
  }
  const boot = a['bootup-time'];
  if (boot && boot.details && boot.details.items) {
    console.log('bootup top:');
    for (const b of boot.details.items.slice(0, 4)) console.log(`   total=${Math.round(b.total)}ms ${(b.url || '').replace(/^https?:\/\/[^/]+/, '').slice(0, 70)}`);
  }
  const mt = a['mainthread-work-breakdown'];
  if (mt && mt.details && mt.details.items) {
    const top = mt.details.items.filter(i => i.group && !['parseHTML', 'styleLayout', 'paintCompositeRender', 'compositeLayers', 'other'].includes(i.group)).slice(0, 5);
    console.log('mainthread: ' + top.map(i => `${i.group}=${Math.round(i.duration)}ms`).join(' '));
  }
  const tm = a['script-treemap-data'];
  console.log('treemap-data: ' + (tm && tm.details ? 'present' : 'absent'));
}
