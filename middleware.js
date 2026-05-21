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

export default async function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname !== '/') return;

  const s1 = url.searchParams.get('s1');
  if (!s1) return;

  const secret = process.env.QUIZ_SHARED_SECRET;
  if (!secret) return; // env not configured — fall through

  // Resolve child slug map via authed server-side endpoint
  let childSlug = null;
  try {
    const res = await fetch(
      `${AFFILIATE_API}/api/quiz/resolve-links?parentSlug=${encodeURIComponent(s1)}`,
      { headers: { authorization: `Bearer ${secret}` } }
    );
    if (res.ok) {
      const map = await res.json();
      childSlug = map[DIRECT_OFFER_BASE] ?? null;
    }
  } catch {
    // resolve failed — fall through to quiz
  }

  // No direct_offer link for this slug → open quiz normally
  if (!childSlug) return;

  // 50/50: pass through to quiz
  if (Math.random() >= 0.5) return;

  // Track + redirect
  const redirectUrl = `${DIRECT_OFFER_BASE}&s1=${encodeURIComponent(childSlug)}`;

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
  }).catch(() => {});

  return Response.redirect(redirectUrl, 302);
}

export const config = { matcher: '/' };
