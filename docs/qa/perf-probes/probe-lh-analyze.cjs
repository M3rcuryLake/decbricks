// Phase 1: aggregate Lighthouse JSON battery -> medians + LCP/CLS/TBT/network details
const fs = require('fs');
const DIR = '/home/ankit/GitHub/decbricks/docs/qa/perf-before';
const routes = ['home', 'services', 'about', 'contact', 'terms', 'notfound'];

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const out = {};
for (const r of routes) {
  const runs = [1, 2, 3].map((p) => {
    const f = `${DIR}/${r}-p${p}.json`;
    if (!fs.existsSync(f)) return null;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const a = j.audits;
    const net = a['network-requests']?.items || [];
    const js = net.filter((n) => /\.js(\?|$)/.test(n.url) || n.resourceType === 'Script');
    const css = net.filter((n) => /\.css(\?|$)/.test(n.url) || n.resourceType === 'Stylesheet');
    const fonts = net.filter((n) => /\.(woff2?|ttf|otf)(\?|$)/.test(n.url));
    const imgs = net.filter((n) => n.resourceType === 'Image');
    const vid = net.filter((n) => n.resourceType === 'Media');
    return {
      cats: Object.fromEntries(Object.entries(j.categories).map(([k, v]) => [k, Math.round((v.score || 0) * 100)])),
      metrics: {
        fcp: a['first-contentful-paint']?.numericValue,
        lcp: a['largest-contentful-paint']?.numericValue,
        tbt: a['total-blocking-time']?.numericValue,
        cls: a['cumulative-layout-shift']?.numericValue,
        si: a['speed-index']?.numericValue,
        tti: a['interactive']?.numericValue,
      },
      lcpElement: a['largest-contentful-paint-element']?.items?.[0]?.element || a['largest-contentful-paint-element']?.items?.[0]?.node || null,
      lcpPhase: a['lcp-lazy-loaded'] ? 'lazy-check' : undefined,
      clsItems: (a['layout-shifts']?.items || []).slice(0, 4).map((i) => ({ score: i.score, node: (i.node?.nodeLabel || i.node?.selector || '').slice(0, 60), extra: (i.extra || '').slice(0, 80) })),
      longTasks: (a['long-tasks']?.items || []).length,
      longTaskTotal: a['long-tasks']?.numericValue,
      mainThread: a['mainthread-work-breakdown']?.numericValue,
      bootup: a['bootup-time']?.numericValue,
      requests: net.length,
      transferKB: Math.round(net.reduce((s, n) => s + (n.transferSize || 0), 0) / 1024),
      jsKB: Math.round(js.reduce((s, n) => s + (n.transferSize || 0), 0) / 1024),
      cssKB: Math.round(css.reduce((s, n) => s + (n.transferSize || 0), 0) / 1024),
      fontKB: Math.round(fonts.reduce((s, n) => s + (n.transferSize || 0), 0) / 1024),
      imgKB: Math.round(imgs.reduce((s, n) => s + (n.transferSize || 0), 0) / 1024),
      mediaKB: Math.round(vid.reduce((s, n) => s + (n.transferSize || 0), 0) / 1024),
      a11yFails: (j.categories['accessibility']?.auditRefs || []).filter((x) => (a[x.id]?.score ?? 1) < 1 && a[x.id]?.score !== null).map((x) => x.id).slice(0, 8),
      bpFails: (j.categories['best-practices']?.auditRefs || []).filter((x) => (a[x.id]?.score ?? 1) < 1 && a[x.id]?.score !== null).map((x) => x.id).slice(0, 8),
      seoFails: (j.categories['seo']?.auditRefs || []).filter((x) => (a[x.id]?.score ?? 1) < 1 && a[x.id]?.score !== null).map((x) => x.id).slice(0, 8),
    };
  });
  const ok = runs.filter(Boolean);
  if (!ok.length) { out[r] = null; continue; }
  out[r] = {
    scores: Object.fromEntries(Object.keys(ok[0].cats).map((k) => [k, med(ok.map((x) => x.cats[k]))])),
    metrics: Object.fromEntries(Object.keys(ok[0].metrics).map((k) => [k, Math.round(med(ok.map((x) => x.metrics[k])) * 10) / 10])),
    perRun: ok.map((x) => ({ perf: x.cats.performance, lcp: Math.round(x.metrics.lcp), tbt: Math.round(x.metrics.tbt), cls: x.metrics.cls, jsKB: x.jsKB, transferKB: x.transferKB })),
    lcpElement: ok[1].lcpElement, // median run
    clsItems: ok[1].clsItems,
    longTasks: ok[1].longTasks,
    mainThreadMs: Math.round(ok[1].mainThread || 0),
    bootupMs: Math.round(ok[1].bootup || 0),
    requests: med(ok.map((x) => x.requests)),
    transferKB: med(ok.map((x) => x.transferKB)),
    jsKB: med(ok.map((x) => x.jsKB)),
    cssKB: med(ok.map((x) => x.cssKB)),
    fontKB: med(ok.map((x) => x.fontKB)),
    imgKB: med(ok.map((x) => x.imgKB)),
    mediaKB: med(ok.map((x) => x.mediaKB)),
    a11yFails: [...new Set(ok.flatMap((x) => x.a11yFails))],
    bpFails: [...new Set(ok.flatMap((x) => x.bpFails))],
    seoFails: [...new Set(ok.flatMap((x) => x.seoFails))],
  };
}
fs.writeFileSync(`${DIR}/lh-medians.json`, JSON.stringify(out, null, 1));
for (const [r, v] of Object.entries(out)) {
  if (!v) { console.log(r + ': MISSING'); continue; }
  console.log(`== ${r}: P=${v.scores.performance} A=${v.scores.accessibility} BP=${v.scores['best-practices']} SEO=${v.scores.seo}`);
  console.log(`   FCP=${v.metrics.fcp} LCP=${v.metrics.lcp} TBT=${v.metrics.tbt} CLS=${v.metrics.cls} SI=${v.metrics.si} TTI=${v.metrics.tti}`);
  console.log(`   req=${v.requests} transfer=${v.transferKB}KB js=${v.jsKB}KB css=${v.cssKB}KB font=${v.fontKB}KB img=${v.imgKB}KB media=${v.mediaKB}KB | longTasks=${v.longTasks} main=${v.mainThreadMs}ms boot=${v.bootupMs}ms`);
  console.log(`   LCP elem: ${JSON.stringify(v.lcpElement).slice(0, 160)}`);
  if (v.clsItems.length) console.log('   CLS: ' + JSON.stringify(v.clsItems).slice(0, 200));
  if (v.a11yFails.length) console.log('   a11y: ' + v.a11yFails.join(','));
  if (v.bpFails.length) console.log('   bp: ' + v.bpFails.join(','));
  if (v.seoFails.length) console.log('   seo: ' + v.seoFails.join(','));
}
