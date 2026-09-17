/**
 * Optional Cloudflare Worker proxy for TradingView Pine compilation.
 *
 * Configure ALLOWED_ORIGIN, for example:
 *   https://0xtrvkc.github.io
 *
 * TradingView's facade is undocumented and can change without notice.
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://0xtrvkc.github.io';
    const corsOrigin = origin === allowedOrigin ? origin : allowedOrigin;
    const headers = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ success: false, error: 'POST required.' }, 405, headers);
    if (origin && origin !== allowedOrigin) return json({ success: false, error: 'Origin not allowed.' }, 403, headers);

    let body;
    try { body = await request.json(); }
    catch (_) { return json({ success: false, error: 'Request body must be JSON.' }, 400, headers); }

    const source = typeof body?.source === 'string' ? body.source : '';
    if (!source.trim()) return json({ success: false, error: 'Pine source is required.' }, 400, headers);
    if (source.length > 200000) return json({ success: false, error: 'Source exceeds the 200 KB limit.' }, 413, headers);

    const form = new URLSearchParams({ source });
    try {
      const upstream = await fetch(
        'https://pine-facade.tradingview.com/pine-facade/translate_light?user_name=Guest&pine_id=00000000-0000-0000-0000-000000000000&v=3',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://www.tradingview.com/'
          },
          body: form.toString()
        }
      );
      const text = await upstream.text();
      if (!upstream.ok) return json({ success: false, error: `TradingView returned HTTP ${upstream.status}.` }, 502, headers);
      try { return new Response(JSON.stringify(JSON.parse(text)), { status: 200, headers }); }
      catch (_) { return json({ success: false, error: 'TradingView returned an unreadable response.' }, 502, headers); }
    } catch (error) {
      return json({ success: false, error: `Compiler request failed: ${error.message}` }, 502, headers);
    }
  }
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}
