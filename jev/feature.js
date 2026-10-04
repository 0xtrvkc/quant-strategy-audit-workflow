/* Bounded decisions for this application. */
(function (root, factory) {
  const api = factory(
    root.JevContract || (typeof require === 'function' ? require('./contract.js') : null),
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JevFeature = api;
})(globalThis, function (C) {
  'use strict';

  const F = {
    id: 'evidence-audit',
    private: true,
    build(input) {
      const claims = C.list(input.claims, 'Claims', 8).map((x) => C.text(x, 'Claim', 300));
      const evidence = C.candidates(input.evidence, 'Evidence');
      const questions = {};
      claims.forEach((claim, i) => {
        questions['relation' + i] = C.choice(
          'Using only `evidence`, how does the supplied evidence relate to this claim: ' +
            claim +
            '? Statements that a check passed are self-reports, not independent proof. Missing execution or testing evidence is insufficient. Source code can reveal a contradiction but cannot establish universal absence of repainting.',
          {
            supported: 'Explicit supplied evidence establishes this bounded claim',
            contradicted: 'Supplied evidence directly conflicts with the claim',
            insufficient: 'Missing, ambiguous, self-reported or inadequate evidence',
          },
        );
        questions['source' + i] = C.choice(
          'Which evidence item most directly supports your assessment of the claim: ' +
            claim +
            '? Select none if no item directly bears on it.',
          Object.fromEntries([
            ...evidence.map((x) => [x.id, x.title]),
            ['none', 'No relevant evidence'],
          ]),
        );
      });
      return { state: { claims, evidence }, questions };
    },
    present(input, answers) {
      return input.claims.map((claim, i) => {
        const relation = C.decision(answers['relation' + i]),
          source = C.decision(answers['source' + i]);
        const index = Number(source.replace('item', ''));
        const item = input.evidence[index];
        return {
          title: claim,
          label:
            relation === 'review' || source === 'review'
              ? 'Needs review'
              : !item
                ? 'Insufficient evidence'
                : {
                    supported: 'Supported',
                    contradicted: 'Contradicted',
                    insufficient: 'Insufficient evidence',
                  }[relation] || 'Needs review',
          detail: item ? item.title + ': ' + item.text : 'No relevant evidence selected.',
          nextStep:
            relation === 'supported' && item
              ? 'Preserve this excerpt and reproduce the same bounded check.'
              : relation === 'contradicted' && item
                ? 'Resolve the conflict between this claim and the supplied evidence.'
                : 'Supply a reproducible test or direct observation that addresses this claim.',
          confidence: Math.min(
            answers['relation' + i].confidence,
            answers['source' + i].confidence,
          ),
        };
      });
    },
  };

  return Object.freeze(F);
});
