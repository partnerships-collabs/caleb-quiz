/**
 * Vercel Edge Function — caleb-hammer quiz entry point
 *
 * Handles all /:slug requests (via vercel.json rewrite).
 * 50/50 split: quiz vs direct-offer redirect.
 * Load with ?dev=true to see server-side logs in Vercel function logs.
 */

export const config = { runtime: 'edge' };

const DIRECT_OFFER_BASE = 'https://oc.brcclx.com/t?lid=26768553';
const AFFILIATE_API     = 'https://partners.moneymatchup.com';
const CALLER_ORIGIN     = 'https://cards.calebhammer.com';

export default async function handler(request) {
  const url    = new URL(request.url);
  const slug   = url.searchParams.get('slug') || '';
  const dev    = url.searchParams.get('dev') === 'true';
  const log    = dev ? (...a) => console.log('[caleb-entry]', ...a) : () => {};

  log(`hit — slug="${slug}" path="${url.pathname}"`);

  if (!slug) {
    log('no slug — serving quiz directly');
    return serveQuiz(url, '', dev);
  }

  const secret = process.env.QUIZ_SHARED_SECRET;
  if (!secret) {
    log('QUIZ_SHARED_SECRET not set — fallback: quiz');
    return serveQuiz(url, slug, dev);
  }

  // Resolve child slug map
  let childSlug = null;
  try {
    const res = await fetch(
      `${AFFILIATE_API}/api/quiz/resolve-links?parentSlug=${encodeURIComponent(slug)}`,
      { headers: { authorization: `Bearer ${secret}` } }
    );
    if (res.ok) {
      const map = await res.json();
      childSlug = map[DIRECT_OFFER_BASE] ?? null;
      log(`resolve-links ok — keys=${Object.keys(map).length} direct_offer_slug=${childSlug ?? 'not found'}`);
    } else {
      const body = await res.text().catch(() => '');
      log(`resolve-links failed — status=${res.status} body="${body.slice(0, 120)}" — fallback: quiz`);
    }
  } catch (err) {
    log(`resolve-links threw: ${err?.message ?? err} — fallback: quiz`);
  }

  if (!childSlug) {
    log(`no direct_offer child for "${slug}" — fallback: quiz`);
    return serveQuiz(url, slug, dev);
  }

  const roll = Math.random();
  if (roll >= 0.5) {
    log(`roll=${roll.toFixed(3)} → quiz`);
    return serveQuiz(url, slug, dev);
  }

  // Redirect to direct offer
  const redirectUrl = `${DIRECT_OFFER_BASE}&s1=${encodeURIComponent(childSlug)}`;
  log(`roll=${roll.toFixed(3)} → redirect ${redirectUrl}`);

  fetch(`${AFFILIATE_API}/api/quiz/submissions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: CALLER_ORIGIN },
    body: JSON.stringify({
      quizSlug:    'caleb-hammer',
      outcome:     'direct_offer',
      sessionId:   crypto.randomUUID(),
      subId:       slug,
      parentSlug:  slug,
      creatorSlug: 'caleb-hammer',
      path:        url.pathname + url.search,
      referrer:    request.headers.get('referer') ?? '',
    }),
  }).catch((err) => log(`analytics POST failed: ${err?.message ?? err}`));

  return Response.redirect(redirectUrl, 302);
}

/** Redirect to quiz with slug as ?s1= param so the quiz JS picks it up */
function serveQuiz(url, slug, dev) {
  const qs = new URLSearchParams();
  if (slug) qs.set('s1', slug);
  if (dev)  qs.set('dev', 'true');
  const target = `${url.origin}/${qs.toString() ? '?' + qs.toString() : ''}`;
  return Response.redirect(target, 302);
}
