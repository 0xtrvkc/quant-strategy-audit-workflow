/*
 * Pine Script browser preflight checker.
 * Inspired by erevus-cn/pinescript_syntax_checker (MIT) and adapted for a
 * static, dependency-free browser app. See THIRD_PARTY_NOTICES.md.
 */
(function () {
  'use strict';

  const VERSION_RE = /^\s*\/\/@version\s*=\s*(\d+)\s*$/;
  const DECLARATION_RE = /^\s*(indicator|strategy|library|study)\s*\(/;
  const SMART_CHARS = /[“”‘’–—…]/g;

  function issue(severity, line, column, message, category = 'syntax', source = 'preflight') {
    return { severity, line: line || null, column: column || null, message, category, source };
  }

  function splitArguments(text) {
    let depth = 0;
    let quote = null;
    let escaped = false;
    let count = text.trim() ? 1 : 0;
    for (const char of text) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (quote) { if (char === quote) quote = null; continue; }
      if (char === '"' || char === "'") { quote = char; continue; }
      if ('([{'.includes(char)) depth++;
      else if (')]}'.includes(char)) depth = Math.max(0, depth - 1);
      else if (char === ',' && depth === 0) count++;
    }
    return count;
  }

  function scanStructure(source) {
    const issues = [];
    const stack = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    let line = 1;
    let column = 0;
    let quote = null;
    let quoteLine = null;
    let quoteColumn = null;
    let escaped = false;
    let comment = false;

    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      const next = source[i + 1];
      column++;

      if (char === '\n') {
        if (quote) {
          issues.push(issue('error', quoteLine, quoteColumn, 'String is not closed before the end of the line.'));
          quote = null;
        }
        line++;
        column = 0;
        comment = false;
        escaped = false;
        continue;
      }
      if (comment) continue;
      if (!quote && char === '/' && next === '/') { comment = true; i++; column++; continue; }
      if (escaped) { escaped = false; continue; }
      if (quote && char === '\\') { escaped = true; continue; }
      if (quote) { if (char === quote) quote = null; continue; }
      if (char === '"' || char === "'") { quote = char; quoteLine = line; quoteColumn = column; continue; }
      if ('([{'.includes(char)) stack.push({ char, line, column });
      else if (')]}'.includes(char)) {
        const open = stack.pop();
        if (!open || open.char !== pairs[char]) {
          issues.push(issue('error', line, column, `Unexpected “${char}”. Check the brackets before this point.`));
          if (open) stack.push(open);
        }
      }
    }

    if (quote) issues.push(issue('error', quoteLine, quoteColumn, 'String is not closed.'));
    for (const open of stack.reverse()) {
      issues.push(issue('error', open.line, open.column, `“${open.char}” is not closed.`));
    }
    return issues;
  }

  function checkLocal(source) {
    const started = performance.now();
    const normalized = String(source || '').replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');
    const issues = [];
    const trimmedSource = normalized.trim();

    if (!trimmedSource) {
      return {
        success: false,
        status: 'empty',
        version: null,
        declaration: null,
        lines: 0,
        characters: 0,
        issues: [issue('error', 1, 1, 'Paste Pine Script code before running the check.')],
        checkedAt: new Date().toISOString(),
        durationMs: Math.round(performance.now() - started)
      };
    }

    issues.push(...scanStructure(normalized));

    const versionLines = [];
    const declarations = [];
    let firstCodeLine = null;
    lines.forEach((raw, index) => {
      const lineNumber = index + 1;
      const trimmed = raw.trim();
      const versionMatch = raw.match(VERSION_RE);
      const declarationMatch = raw.match(DECLARATION_RE);
      if (versionMatch) versionLines.push({ line: lineNumber, value: Number(versionMatch[1]) });
      if (declarationMatch) declarations.push({ line: lineNumber, value: declarationMatch[1] });
      if (!firstCodeLine && trimmed && !trimmed.startsWith('//')) firstCodeLine = lineNumber;

      SMART_CHARS.lastIndex = 0;
      let smartMatch;
      while ((smartMatch = SMART_CHARS.exec(raw)) !== null) {
        issues.push(issue('error', lineNumber, smartMatch.index + 1, `Unsupported smart character “${smartMatch[0]}”. Replace it with a normal quote, hyphen or three periods.`));
      }
      if (raw.includes('/*') || raw.includes('*/')) {
        issues.push(issue('error', lineNumber, Math.max(raw.indexOf('/*'), raw.indexOf('*/')) + 1, 'Pine comments use //. Block comments are not supported.'));
      }
      if (/;\s*(?:\/\/.*)?$/.test(raw.trim())) {
        issues.push(issue('warning', lineNumber, raw.lastIndexOf(';') + 1, 'Pine normally does not need a semicolon at the end of a statement.'));
      }
      if (/\t/.test(raw)) {
        issues.push(issue('warning', lineNumber, raw.indexOf('\t') + 1, 'Tab indentation can behave differently between editors. Use spaces for predictable Pine formatting.', 'style'));
      }
    });

    if (versionLines.length === 0) {
      issues.push(issue('error', 1, 1, 'Missing Pine version. Start the script with //@version=6.'));
    } else {
      if (versionLines.length > 1) {
        versionLines.slice(1).forEach(v => issues.push(issue('error', v.line, 1, 'Only one //@version directive is allowed.')));
      }
      if (versionLines[0].line !== 1) {
        issues.push(issue('warning', versionLines[0].line, 1, 'Put //@version on the first line so TradingView reads it reliably.'));
      }
      if (versionLines[0].value < 5) {
        issues.push(issue('info', versionLines[0].line, 1, `Pine v${versionLines[0].value} is old. Consider upgrading to v6.`, 'compatibility'));
      } else if (versionLines[0].value > 6) {
        issues.push(issue('error', versionLines[0].line, 1, `Pine v${versionLines[0].value} is not a recognized public version.`, 'compatibility'));
      }
    }

    if (declarations.length === 0) {
      issues.push(issue('error', firstCodeLine || 1, 1, 'No indicator(), strategy() or library() declaration was found.'));
    } else if (declarations.length > 1) {
      declarations.slice(1).forEach(d => issues.push(issue('error', d.line, 1, 'A Pine script can have only one main declaration.')));
    }

    const declaration = declarations[0]?.value || null;
    const strategyUse = lines.findIndex(line => /\bstrategy\.(entry|order|exit|close|close_all|cancel|cancel_all)\s*\(/.test(line));
    if (strategyUse >= 0 && declaration !== 'strategy') {
      issues.push(issue('error', strategyUse + 1, 1, 'strategy.* order functions require a strategy() declaration.'));
    }
    const plotUse = lines.findIndex(line => /^\s+(plot|plotshape|plotchar|barcolor|bgcolor|fill|hline)\s*\(/.test(line));
    if (plotUse >= 0) {
      issues.push(issue('warning', plotUse + 1, 1, 'A visual function appears indented. Plotting functions usually must stay in global scope.', 'scope'));
    }

    const arrays = new Map();
    lines.forEach((raw, index) => {
      const from = raw.match(/\b(\w+)\s*=\s*array\.from\((.*)\)/);
      if (from) arrays.set(from[1], { size: splitArguments(from[2]), line: index + 1 });
      const created = raw.match(/\b(\w+)\s*=\s*array\.new(?:<\w+>|_\w+)\(\s*(\d+)/);
      if (created) arrays.set(created[1], { size: Number(created[2]), line: index + 1 });
    });
    lines.forEach((raw, index) => {
      const access = /array\.(get|set)\(\s*(\w+)\s*,\s*(-?\d+)/g;
      let match;
      while ((match = access.exec(raw)) !== null) {
        const known = arrays.get(match[2]);
        const position = Number(match[3]);
        if (known && (position < 0 || position >= known.size)) {
          issues.push(issue('error', index + 1, match.index + 1, `array.${match[1]} uses index ${position}, but “${match[2]}” has ${known.size} item${known.size === 1 ? '' : 's'}.`, 'runtime'));
        }
      }
      const firstLast = raw.match(/\b(\w+)\.(first|last)\(\)/);
      if (firstLast && arrays.get(firstLast[1])?.size === 0) {
        issues.push(issue('warning', index + 1, firstLast.index + 1, `${firstLast[1]}.${firstLast[2]}() may run on an empty array.`, 'runtime'));
      }
    });

    lines.forEach((raw, index) => {
      if (/request\.security\s*\([^\n]*lookahead\s*=\s*barmerge\.lookahead_on/.test(raw) && !/\[[1-9]\d*\]/.test(raw)) {
        issues.push(issue('warning', index + 1, 1, 'Higher-timeframe lookahead_on appears without a historical offset. This can leak future data.', 'repainting'));
      }
      if (/\boffset\s*=\s*-\d+/.test(raw)) {
        issues.push(issue('warning', index + 1, 1, 'A negative plot offset moves visuals into the past. Do not treat the shifted marker as a tradable signal.', 'repainting'));
      }
      if (/calc_on_every_tick\s*=\s*true/.test(raw)) {
        issues.push(issue('info', index + 1, 1, 'calc_on_every_tick=true can make realtime behavior differ from historical bars.', 'repainting'));
      }
    });

    const severityRank = { error: 0, warning: 1, info: 2 };
    issues.sort((a, b) => (severityRank[a.severity] - severityRank[b.severity]) || ((a.line || 0) - (b.line || 0)) || ((a.column || 0) - (b.column || 0)));
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const infos = issues.filter(i => i.severity === 'info').length;

    return {
      success: errors === 0,
      status: errors ? 'errors' : warnings ? 'warnings' : 'passed',
      version: versionLines[0]?.value || null,
      declaration,
      lines: lines.length,
      characters: normalized.length,
      errors,
      warnings,
      infos,
      issues,
      checkedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started)
    };
  }

  function normalizeCompilerResponse(payload) {
    const result = payload?.result || payload || {};
    const inner = result.result || result;
    const rawErrors = inner.errors2 || inner.errors || result.errors || [];
    const rawWarnings = inner.warnings2 || inner.warnings || result.warnings || [];
    const map = (entry, severity) => issue(
      severity,
      entry.start?.line ?? entry.line ?? null,
      entry.start?.column ?? entry.column ?? null,
      entry.message || String(entry),
      'compiler',
      'tradingview'
    );
    const issues = [
      ...rawErrors.map(entry => map(entry, 'error')),
      ...rawWarnings.map(entry => map(entry, 'warning'))
    ];
    if (typeof payload?.error === 'string') issues.push(issue('error', null, null, payload.error, 'compiler', 'tradingview'));
    const errors = issues.filter(i => i.severity === 'error').length;
    return {
      attempted: true,
      available: true,
      compiled: errors === 0 && payload?.success !== false,
      errors,
      warnings: issues.length - errors,
      issues
    };
  }

  async function checkOfficial(source, proxyUrl) {
    const url = String(proxyUrl || '').trim();
    if (!url) return { attempted: false, available: false, compiled: null, issues: [] };
    let parsed;
    try { parsed = new URL(url); } catch (_) { throw new Error('Compiler proxy URL is invalid.'); }
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) {
      throw new Error('Use an HTTPS compiler proxy URL, or localhost during development.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ source }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Compiler proxy returned HTTP ${response.status}.`);
      return normalizeCompilerResponse(await response.json());
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Compiler proxy timed out after 15 seconds.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  window.PineSyntaxChecker = { checkLocal, checkOfficial, normalizeCompilerResponse };
})();
