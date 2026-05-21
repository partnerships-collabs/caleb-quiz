/**
 * Vercel Edge Middleware — caleb-hammer quiz
 *
 * On every root page load with an ?s1= param:
 *  1. Resolve the slug map from the affiliate platform.
 *  2. If no direct_offer child link exists for this slug → open quiz normally.
 *  3. Otherwise 50/50:
 *     - 50%: pass through to quiz.
 *     - 50%: post analytics + redirect to bankrate direct-offer URL with child slug.
 */

const DIRECT_OFFER_BASE = 'https://oc.brcclx.com/t?lid=26768553';
const AFFILIATE_API     = 'https://partners.moneymatchup.com';
const CALLER_ORIGIN     = 'https://cards.calebhammer.com';

// File extensions that are never quiz slugs
const ASSET_RE = /\.(?:ico|png|jpg|jpeg|svg|webp|js|css|json|txt|woff2?)$/i;

export default async function middleware(request) {
  const url = new URL(request.url);

  // Skip static asset requests
  if (ASSET_RE.test(url.pathname)) return;

  // Slug comes from path (/website-resources) or ?s1= query param
  const pathSlug = url.pathname.replace(/^\//, '').split('/')[0];
  const s1 = pathSlug || url.searchParams.get('s1');
  const dev = url.searchParams.get('dev') === 'true';

  const log = dev
    ? (...args) => console.log('[caleb-mw]', ...args)
    : () => {};

  if (!s1) {
    log('no slug found in path or ?s1= — passing through');
    return;
  }

  log(`slug="${s1}" path="${url.pathname}"`);

  const secret = process.env.QUIZ_SHARED_SECRET;
  if (!secret) {
    log('QUIZ_SHARED_SECRET not set — fallback: quiz');
    return;
  }

  // Resolve child slug map via authed server-side endpoint
  let childSlug = null;
  let resolveStatus = null;
  try {
    const res = await fetch(
      `${AFFILIATE_API}/api/quiz/resolve-links?parentSlug=${encodeURIComponent(s1)}`,
      { headers: { authorization: `Bearer ${secret}` } }
    );
    resolveStatus = res.status;
    if (res.ok) {
      const map = await res.json();
      childSlug = map[DIRECT_OFFER_BASE] ?? null;
      log(`resolve-links status=${res.status} keys=[${Object.keys(map).length}] direct_offer_slug=${childSlug ?? 'not found'}`);
    } else {
      const body = await res.text().catch(() => '');
      log(`resolve-links failed status=${res.status} body="${body.slice(0, 120)}" — fallback: quiz`);
    }
  } catch (err) {
    log(`resolve-links threw: ${err?.message ?? err} — fallback: quiz`);
  }

  // No direct_offer link for this slug → open quiz normally
  if (!childSlug) {
    log(`no direct_offer child for slug="${s1}" — fallback: quiz`);
    return;
  }

  // 50/50: pass through to quiz
  const roll = Math.random();
  if (roll >= 0.5) {
    log(`roll=${roll.toFixed(3)} → quiz`);
    return;
  }

  // Track + redirect
  const redirectUrl = `${DIRECT_OFFER_BASE}&s1=${encodeURIComponent(childSlug)}`;
  log(`roll=${roll.toFixed(3)} → redirect to ${redirectUrl}`);

  fetch(`${AFFILIATE_API}/api/quiz/submissions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: CALLER_ORIGIN },
    body: JSON.stringify({
      quizSlug:    'caleb-hammer',
      outcome:     'direct_offer',
      sessionId:   crypto.randomUUID(),
      subId:       s1,
      parentSlug:  s1,
      creatorSlug: 'caleb-hammer',
      path:        url.pathname + url.search,
      referrer:    request.headers.get('referer') ?? '',
    }),
  }).catch((err) => {
    log(`analytics POST failed: ${err?.message ?? err}`);
  });

  return Response.redirect(redirectUrl, 302);
}

export const config = { matcher: '/' };
