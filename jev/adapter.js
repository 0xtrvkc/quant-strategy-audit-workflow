/* Application adapter; all writes require an explicit action button. */
(function () {
  'use strict';
  function init() {
    JevUI.mount({
      title: 'Check my evidence',
      description:
        'Compare up to eight bounded claims with text evidence. AI findings are advisory and do not change your audit verdict.',
      fields: [
        {
          key: 'claims',
          label: 'Claims — one per line',
          max: 2400,
          placeholder:
            'Commission is included in this test\nSignals use confirmed higher-timeframe bars',
        },
        {
          key: 'evidence',
          label: 'Additional evidence — paste test output or observations',
          max: 15000,
          rows: 4,
        },
      ],
      runLabel: 'Check my evidence',
      input(v) {
        const claims = v.claims
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean);
        const source = document.getElementById('pineEditor').value;
        const context = window.JevApp.auditContext();
        if (source.length > 20000)
          throw new Error(
            'Pine source exceeds 20,000 characters. Use selected excerpts in Additional evidence.',
          );
        const evidence = [];
        function chunks(text, prefix) {
          const lines = text.split('\n');
          for (let start = 0; start < lines.length; start += 10) {
            const text = lines
              .slice(start, start + 10)
              .map((x, i) => prefix + ' line ' + (start + i + 1) + ': ' + x)
              .join('\n');
            if (lines.slice(start, start + 10).some((x) => x.trim()))
              evidence.push({
                title: prefix + ' lines ' + (start + 1) + '–' + Math.min(start + 10, lines.length),
                text,
              });
          }
        }
        chunks(source, 'Pine');
        chunks(v.evidence, 'Evidence');
        context.evidenceRows
          .filter((row) => row.symbol)
          .forEach((row, i) =>
            evidence.push({ title: 'Self-reported market ' + (i + 1), text: JSON.stringify(row) }),
          );
        if (evidence.length > 50)
          throw new Error('More than 50 source chunks. Select relevant evidence excerpts.');
        return { claims, evidence };
      },
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
