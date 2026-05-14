// Auth + billing UI.
//
// Two surfaces:
//   1. Landing page (/) — full account experience: inline sign-in/sign-up
//      forms, Upgrade button, Manage Subscription. Lives in `landing.html`,
//      mounted by landing.js. This is where users acquire / manage Pro.
//   2. Editor (/editor) — read-only. Just a small badge in the top-right
//      showing FREE / PRO. Anonymous users see nothing (or a "Sign in"
//      link routing to home). The editor never opens an auth form.

import * as auth from './auth.js';

function el(tag, attrs, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'class') node.className = v;
        else if (k === 'style') node.style.cssText = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
        if (c == null) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
}

// ============================================================
// EDITOR: read-only badge in the top-right.
// ============================================================
export function mountEditorBadge(container) {
    if (!container) return;
    const render = ({ user, plan }) => {
        container.innerHTML = '';
        if (!auth.isConfigured()) return;

        if (!user) {
            // Anonymous: a small "Not signed in" chip linking to the
            // landing-page account section. Same visual slot as FREE/PRO
            // so the badge spot is always populated.
            const chip = el('a', {
                href: '/#account',
                title: 'Sign in on the home page',
                style: `display:inline-flex; align-items:center; font-size:0.7rem; font-weight:700;
                        letter-spacing:0.08em; padding:0.3rem 0.6rem; line-height:1;
                        background:rgba(30,41,59,0.7); color:#94a3b8;
                        border:1px solid rgba(148,163,184,0.3);
                        border-radius:6px; text-decoration:none;
                        text-transform:uppercase;`
            }, 'Not Signed In');
            container.appendChild(chip);
            return;
        }

        const isPro = plan === 'pro';
        // Compact PRO/FREE chip only. Full account details (email, plan
        // management) live on the landing page; clicking the chip routes
        // there. `title` shows the email on hover for quick reference.
        const badge = el('a', {
            href: '/#account',
            title: `${isPro ? 'Pro' : 'Free'} plan — ${user.email || ''}`,
            style: `display:inline-flex; align-items:center; font-size:0.7rem; font-weight:700;
                    letter-spacing:0.08em; padding:0.3rem 0.6rem; line-height:1;
                    background:${isPro ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'rgba(30,41,59,0.7)'};
                    color:${isPro ? '#fff' : '#cbd5e1'};
                    border:1px solid ${isPro ? 'rgba(168,85,247,0.6)' : 'rgba(99,102,241,0.3)'};
                    border-radius:6px; text-decoration:none;
                    box-shadow:${isPro ? '0 2px 10px rgba(168,85,247,0.3)' : 'none'};`
        }, isPro ? 'PRO' : 'FREE');
        container.appendChild(badge);
    };
    auth.onChange(render);
}

// ============================================================
// EDITOR: toggle the AI panel between "locked" and "unlocked" views.
// The locked view replaces the prompt UI with a Pro-upsell pointing home.
// ============================================================
// Generic locked/unlocked toggle keyed on Pro plan. Used by both the AI
// Generation panel and the Algorithms panel — same UX in both spots.
export function bindEditorAiPanel({ lockedEl, unlockedEl }) {
    bindProGatedPanel({ lockedEl, unlockedEl });
}

export function bindProGatedPanel({ lockedEl, unlockedEl }) {
    if (!lockedEl || !unlockedEl) return;
    // Default to locked while we're waiting on the auth check so anonymous
    // users don't see a flash of the unlocked controls.
    lockedEl.style.display = '';
    unlockedEl.style.display = 'none';

    auth.onChange(({ plan }) => {
        const pro = plan === 'pro';
        lockedEl.style.display = pro ? 'none' : '';
        unlockedEl.style.display = pro ? '' : 'none';
    });
}

// Collapse a panel's expandable-content by default for non-Pro users so
// locked panels don't take up sidebar space on first paint. Only runs once
// — once we've made the initial decision based on plan, the user is free
// to expand/collapse manually after.
//
// Mirrors what setupExpandableSections() does when a user clicks to
// collapse: remove `show` from content, swap chevron icon down → right.
export function collapsePanelForNonPro(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const header = section.querySelector('.expandable-header');
    const content = section.querySelector('.expandable-content');
    const icon = header && header.querySelector('.expand-icon');
    if (!header || !content) return;

    let applied = false;
    auth.onChange(({ plan }) => {
        if (applied) return;
        applied = true;
        if (plan !== 'pro') {
            content.classList.remove('show');
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        }
    });
}

// ============================================================
// LANDING: small account widget in the top-right of the landing page.
// Has interactive elements (sign in / sign out) but no form — the form
// lives in the account section below.
// ============================================================
export function mountLandingHeader(container) {
    if (!container) return;

    // Shared pill style — matches the page's glass-morphism aesthetic so the
    // widget feels like part of the design, not a floating bookmark.
    const pillBase = `
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        font-size: 0.85rem;
        font-weight: 500;
        padding: 0.55rem 0.9rem;
        background: rgba(30, 41, 59, 0.55);
        border: 1px solid rgba(99, 102, 241, 0.25);
        border-radius: 12px;
        color: #e2e8f0;
        text-decoration: none;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.25);
        transition: all 0.2s ease;
        line-height: 1;
    `;

    const render = ({ user, plan }) => {
        container.innerHTML = '';
        if (!auth.isConfigured()) {
            container.appendChild(el('span', { style: 'font-size:0.75rem; color:#94a3b8;' }, 'Auth not configured'));
            return;
        }
        if (!user) {
            const btn = el('a', {
                href: '#account',
                style: pillBase,
                onmouseenter: function() {
                    this.style.background = 'rgba(99, 102, 241, 0.2)';
                    this.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    this.style.transform = 'translateY(-1px)';
                },
                onmouseleave: function() {
                    this.style.background = 'rgba(30, 41, 59, 0.55)';
                    this.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                    this.style.transform = 'translateY(0)';
                }
            }, [
                el('span', { style: 'font-size:1rem; line-height:1;' }, '👤'),
                el('span', null, 'Sign in')
            ]);
            container.appendChild(btn);
            return;
        }

        const isPro = plan === 'pro';
        const badge = el('span', {
            style: `font-size:0.65rem; font-weight:700; letter-spacing:0.08em; padding:0.25rem 0.5rem; border-radius:6px; line-height:1;
                    background:${isPro ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'rgba(148,163,184,0.18)'};
                    color:${isPro ? '#fff' : '#cbd5e1'};
                    ${isPro ? 'box-shadow: 0 2px 10px rgba(168,85,247,0.35);' : ''}`
        }, isPro ? 'PRO' : 'FREE');

        const email = el('span', {
            style: 'color:#cbd5e1; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'
        }, user.email || '');

        const divider = el('span', { style: 'width:1px; height:14px; background:rgba(148,163,184,0.25);' });

        const accountLink = el('a', {
            href: '#account',
            style: 'color:#94a3b8; font-size:0.8rem; text-decoration:none; cursor:pointer; transition: color 0.15s ease;',
            onmouseenter: function() { this.style.color = '#e2e8f0'; },
            onmouseleave: function() { this.style.color = '#94a3b8'; }
        }, 'Account');

        const pill = el('div', { style: pillBase }, [badge, email, divider, accountLink]);
        container.appendChild(pill);
    };
    auth.onChange(render);
}

// ============================================================
// LANDING: rich account panel — two-column layout that mirrors the
// other landing sections. Left column = plan comparison with per-plan
// CTAs; right column = auth form (signed out) or account actions
// (signed in).
//
// Pending-checkout flow: when an anonymous user clicks "Subscribe to
// Pro" we drop a sessionStorage flag and steer them to the signup form;
// once their auth state flips from anonymous → signed-in we auto-call
// startCheckout() so the click feels like one continuous action.
// ============================================================
const PENDING_CHECKOUT_KEY = 'pending_checkout_after_signup';
let publicConfig = null;
let publicConfigPromise = null;

// Open the Stripe Embedded Checkout in a modal overlay. Keeps the user on
// graphvisualizer.com throughout — no redirect to checkout.stripe.com.
// On successful payment, Stripe redirects the entire page to the session's
// return_url (`/editor?checkout=success`) and our auth.init() polling
// handles the plan-flip detection from there.
async function openCheckoutModal() {
    const overlay = el('div', {
        style: 'position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; align-items:flex-start; justify-content:center; padding:2rem 1rem; overflow-y:auto;'
    });
    const card = el('div', {
        style: 'background:#fff; color:#111827; border-radius:14px; width:100%; max-width:560px; position:relative; padding:1.5rem; box-shadow:0 25px 60px rgba(0,0,0,0.45); margin:auto 0;'
    });
    const closeBtn = el('button', {
        type: 'button',
        'aria-label': 'Close checkout',
        style: 'position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius:50%; background:#f3f4f6; border:none; cursor:pointer; font-size:1.2rem; line-height:1; color:#374151; display:flex; align-items:center; justify-content:center; z-index:1;'
    }, '×');
    const statusMsg = el('div', {
        style: 'padding:3rem 1rem; text-align:center; color:#6b7280; font-size:0.95rem;'
    }, 'Loading secure checkout…');
    const checkoutTarget = el('div');

    card.appendChild(closeBtn);
    card.appendChild(statusMsg);
    card.appendChild(checkoutTarget);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let checkout = null;
    let destroyed = false;
    const onKey = (e) => { if (e.key === 'Escape') destroy(); };
    const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        document.removeEventListener('keydown', onKey);
        if (checkout) {
            try { checkout.destroy(); } catch (e) { /* noop */ }
        }
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    closeBtn.addEventListener('click', destroy);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) destroy(); });
    document.addEventListener('keydown', onKey);

    try {
        checkout = await auth.mountStripeCheckout(checkoutTarget);
        statusMsg.style.display = 'none';
    } catch (err) {
        statusMsg.style.color = '#ef4444';
        statusMsg.textContent = err?.message || 'Could not load checkout.';
    }
    return destroy;
}

function loadPublicConfig() {
    if (publicConfig) return Promise.resolve(publicConfig);
    if (publicConfigPromise) return publicConfigPromise;
    publicConfigPromise = fetch('/api/public-config')
        .then(r => r.ok ? r.json() : {})
        .then(cfg => { publicConfig = cfg || {}; return publicConfig; })
        .catch(() => { publicConfig = {}; return publicConfig; });
    return publicConfigPromise;
}

function formatPrice(p) {
    if (!p || typeof p.amount !== 'number') return null;
    const dollars = p.amount / 100;
    const symbol = p.currency === 'usd' ? '$' : (p.currency?.toUpperCase() + ' ');
    const interval = p.intervalCount === 1
        ? `/${p.interval}`
        : `/${p.intervalCount} ${p.interval}s`;
    // Avoid trailing .00 for whole-dollar prices.
    const amountStr = dollars % 1 === 0 ? String(dollars) : dollars.toFixed(2);
    return `${symbol}${amountStr}${interval}`;
}

export function mountLandingAccountPanel(container) {
    if (!container) return;

    loadPublicConfig();

    // Watch for the anonymous → signed-in transition. When it happens with
    // PENDING_CHECKOUT_KEY set, auto-redirect to Stripe Checkout. The user
    // clicked "Subscribe to Pro" earlier — completing the sign-up is the
    // last barrier; from their perspective it's a single action.
    let lastUserId = null;
    auth.onChange(async ({ user }) => {
        const uid = user?.id || null;
        if (uid && uid !== lastUserId && sessionStorage.getItem(PENDING_CHECKOUT_KEY)) {
            sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
            // Defer so the just-signed-up render pass finishes before the
            // modal overlay appears on top of it.
            setTimeout(() => openCheckoutModal(), 100);
        }
        lastUserId = uid;
    });

    // ---------- shared visual primitives ----------
    const gridStyle = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: stretch;
    `;
    const cardStyle = `
        background: rgba(30, 41, 59, 0.45);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(99, 102, 241, 0.22);
        border-radius: 20px;
        padding: 36px;
        display: flex;
        flex-direction: column;
    `;
    const sectionLabel = (text, color) => el('div', {
        style: `font-size:0.7rem; font-weight:700; letter-spacing:0.12em; color:${color}; text-transform:uppercase; margin-bottom:0.85rem;`
    }, text);
    const planFeature = (text, included = true) => el('div', {
        style: `display:flex; align-items:flex-start; gap:0.6rem; padding:0.4rem 0; color:${included ? '#e2e8f0' : '#64748b'}; font-size:0.95rem; line-height:1.45;`
    }, [
        el('span', { style: `flex-shrink:0; width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.7rem; line-height:1; margin-top:1px; ${included ? 'background:rgba(168,85,247,0.18); color:#a855f7;' : 'background:rgba(100,116,139,0.12); color:#64748b;'}` },
            included ? '✓' : '–'),
        el('span', null, text)
    ]);

    // ---------- left column: plan comparison + per-plan CTAs ----------
    const planComparisonCol = (user, plan) => {
        const isPro = plan === 'pro';
        const isSignedIn = !!user;
        const proPriceLabel = formatPrice(publicConfig?.proPrice) || 'Monthly';

        // --- Free card CTA -------------------------------------------------
        // Signed out → focus the signup form.
        // Signed in (any plan) → "Launch editor" (the free feature set is
        // always available).
        let freeCta;
        if (!isSignedIn) {
            freeCta = el('button', {
                class: 'cta cta-secondary',
                style: 'width:100%; justify-content:center; margin-top:1rem; font-size:0.95rem; padding:0.85rem 1rem;',
                onclick: () => focusAuthForm('signup')
            }, 'Start free →');
        } else {
            freeCta = el('a', {
                href: '/editor',
                class: 'cta cta-secondary',
                style: 'width:100%; justify-content:center; margin-top:1rem; font-size:0.95rem; padding:0.85rem 1rem; text-decoration:none;'
            }, 'Launch editor →');
        }

        const freeCard = el('div', {
            style: `${cardStyle} flex:1; padding:24px;`
        }, [
            el('div', { style: 'display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.4rem;' }, [
                el('div', { style: 'font-size:1.1rem; font-weight:600; color:#e2e8f0;' }, 'Free'),
                el('div', { style: 'font-size:0.85rem; color:#94a3b8;' }, isSignedIn && !isPro ? 'Current plan' : 'Always')
            ]),
            el('div', { style: 'font-size:0.85rem; color:#94a3b8; margin-bottom:0.85rem;' }, 'Full editor, no sign-up required'),
            planFeature('Unlimited graphs, local-first auto-save'),
            planFeature('BFS & DFS animations'),
            planFeature('PNG, JPG, JSON export'),
            planFeature('AI graph generation', false),
            planFeature('AI hierarchy export', false),
            freeCta
        ]);

        // --- Pro card CTA --------------------------------------------------
        // Signed out → drop pending-checkout flag, scroll to signup. After
        //   they sign up, the auth.onChange listener above triggers
        //   startCheckout() automatically.
        // Signed in free → straight to Stripe Checkout.
        // Signed in pro → Manage subscription via portal.
        const proCta = el('button', {
            class: 'cta',
            style: 'width:100%; justify-content:center; margin-top:1rem; font-size:0.95rem; padding:0.85rem 1rem;'
        }, isPro ? 'Manage subscription' : 'Subscribe to Pro →');

        proCta.addEventListener('click', async () => {
            const original = proCta.innerHTML;
            proCta.disabled = true;
            try {
                if (isPro) {
                    // Customer Portal can't be embedded (Stripe doesn't
                    // offer that), so we still redirect for management.
                    proCta.innerHTML = 'Opening portal…';
                    const url = await auth.openPortal();
                    window.location.href = url;
                } else if (isSignedIn) {
                    // Embedded checkout keeps the user on graphvisualizer.com.
                    openCheckoutModal();
                    proCta.disabled = false;
                    proCta.innerHTML = original;
                } else {
                    sessionStorage.setItem(PENDING_CHECKOUT_KEY, '1');
                    focusAuthForm('signup');
                    proCta.disabled = false;
                    proCta.innerHTML = original;
                }
            } catch (err) {
                alert(err?.message || 'Could not start billing');
                proCta.disabled = false;
                proCta.innerHTML = original;
            }
        });

        const proCard = el('div', {
            style: `${cardStyle} flex:1; padding:24px; border-color: rgba(168, 85, 247, 0.4); background: linear-gradient(180deg, rgba(168,85,247,0.08) 0%, rgba(30,41,59,0.45) 100%);`
        }, [
            el('div', { style: 'display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.4rem;' }, [
                el('div', { style: 'display:flex; align-items:center; gap:0.5rem;' }, [
                    el('span', { style: 'font-size:1.1rem; font-weight:600; color:#e2e8f0;' }, 'Pro'),
                    el('span', { style: 'font-size:0.6rem; font-weight:700; letter-spacing:0.08em; padding:0.2rem 0.45rem; border-radius:4px; background:linear-gradient(135deg,#a855f7,#ec4899); color:#fff;' }, 'AI')
                ]),
                el('div', { style: `font-size:0.95rem; font-weight:600; color:${isPro ? '#a855f7' : '#e2e8f0'};` }, isPro ? 'Current plan' : proPriceLabel)
            ]),
            el('div', { style: 'font-size:0.85rem; color:#94a3b8; margin-bottom:0.85rem;' }, 'Everything in Free, plus:'),
            planFeature('AI graph generation from plain English'),
            planFeature('AI hierarchy export (image → tree)'),
            planFeature('Priority OpenAI access'),
            planFeature('Cancel anytime'),
            proCta
        ]);

        return el('div', { style: 'display:flex; flex-direction:column; gap:16px;' }, [
            sectionLabel('Choose a plan', '#a855f7'),
            freeCard,
            proCard
        ]);
    };

    // Focus the signup/signin form on the right column. Scrolls into view
    // and switches the form mode to whatever's requested.
    function focusAuthForm(mode) {
        const formEl = container.querySelector('[data-auth-form]');
        if (!formEl) return;
        formEl.dataset.requestedMode = mode;
        formEl.dispatchEvent(new CustomEvent('setmode', { detail: mode }));
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const emailInput = formEl.querySelector('input[type="email"]');
        if (emailInput) setTimeout(() => emailInput.focus(), 300);
    }

    // ---------- right column: signed-out auth form ----------
    const authFormCol = () => {
        let mode = 'signin';
        const wantsPro = !!sessionStorage.getItem(PENDING_CHECKOUT_KEY);

        // Default to signup mode if user clicked "Subscribe to Pro" first.
        if (wantsPro) mode = 'signup';

        const emailInput = el('input', { type: 'email', placeholder: 'you@example.com', autocomplete: 'email', style: inputStyle() });
        const passInput = el('input', { type: 'password', placeholder: 'Password (min 6 chars)', autocomplete: wantsPro ? 'new-password' : 'current-password', style: inputStyle() + ' padding-right: 2.75rem;' });

        // Eye-icon toggle for password visibility. Sits over the right edge of
        // the password input via the wrapper's relative positioning below.
        const EYE_OPEN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        const EYE_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        const passToggle = el('button', {
            type: 'button',
            'aria-label': 'Show password',
            style: 'position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:transparent; border:none; cursor:pointer; padding:0.25rem; color:#94a3b8; display:flex; align-items:center; transition:color 0.15s;',
            onmouseenter: function() { this.style.color = '#e2e8f0'; },
            onmouseleave: function() { this.style.color = '#94a3b8'; },
            html: EYE_OFF
        });
        passToggle.addEventListener('click', () => {
            const visible = passInput.type === 'text';
            passInput.type = visible ? 'password' : 'text';
            passToggle.innerHTML = visible ? EYE_OFF : EYE_OPEN;
            passToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
        });
        const passWrapper = el('div', { style: 'position:relative;' }, [passInput, passToggle]);
        const errorEl = el('div', { style: 'display:none; color:#ef4444; font-size:0.85rem; margin-top:0.5rem;' });
        const submitBtn = el('button', { class: 'cta', style: 'width:100%; justify-content:center;' }, wantsPro ? 'Sign up & continue to checkout' : 'Sign in');
        // Secondary CTA — visually subordinate to the Sign in button (outlined
        // rather than filled) so it doesn't compete as a primary action, but
        // big and clearly labeled so users without an account can find it.
        const toggleBtn = el('button', {
            class: 'cta cta-secondary',
            style: 'width:100%; justify-content:center; margin-top:0.65rem; font-size:0.95rem; padding:0.85rem 1rem;'
        }, mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up");
        const title = el('h3', { style: 'font-size:1.5rem; margin:0 0 0.4rem; color:#e2e8f0;' }, mode === 'signup' ? 'Create your account' : 'Sign in');
        const sub = el('p', { style: 'color:#94a3b8; margin-bottom:1rem; font-size:0.95rem; line-height:1.5;' },
            mode === 'signup'
                ? 'Free to create. Choose a plan above to subscribe.'
                : 'Sign in to manage your account. AI features require a Pro plan.');

        const pendingBanner = el('div', {
            style: `display:${wantsPro ? 'flex' : 'none'}; align-items:center; gap:0.5rem; padding:0.7rem 0.85rem; background:rgba(168,85,247,0.12); border:1px solid rgba(168,85,247,0.3); border-radius:8px; margin-bottom:1rem; font-size:0.85rem; color:#e2e8f0; line-height:1.4;`
        }, [
            el('span', null, '⚡'),
            el('span', null, "After signing up you'll go straight to Stripe Checkout to subscribe to Pro.")
        ]);

        const setMode = (next) => {
            mode = next;
            title.textContent = next === 'signup' ? 'Create your account' : 'Sign in';
            const stillWantsPro = !!sessionStorage.getItem(PENDING_CHECKOUT_KEY);
            sub.textContent = next === 'signup'
                ? 'Free to create. Choose a plan above to subscribe.'
                : 'Sign in to manage your account. AI features require a Pro plan.';
            submitBtn.textContent = next === 'signup'
                ? (stillWantsPro ? 'Sign up & continue to checkout' : 'Sign up')
                : 'Sign in';
            toggleBtn.textContent = next === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up";
            passInput.autocomplete = next === 'signup' ? 'new-password' : 'current-password';
            errorEl.style.display = 'none';
        };
        toggleBtn.addEventListener('click', (e) => { e.preventDefault(); setMode(mode === 'signin' ? 'signup' : 'signin'); });

        const submit = async () => {
            errorEl.style.display = 'none';
            submitBtn.disabled = true;
            const original = submitBtn.textContent;
            submitBtn.textContent = mode === 'signup' ? 'Signing up…' : 'Signing in…';
            try {
                if (mode === 'signup') await auth.signUp(emailInput.value.trim(), passInput.value);
                else await auth.signIn(emailInput.value.trim(), passInput.value);
                // On success, auth.onChange will either re-render to the
                // account view OR (if pending-checkout was set) redirect to
                // Stripe Checkout — handled at the top of mountLandingAccountPanel.
            } catch (err) {
                errorEl.textContent = err?.message || 'Failed';
                errorEl.style.display = '';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = original;
            }
        };
        submitBtn.addEventListener('click', submit);
        emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') passInput.focus(); });
        passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

        const card = el('div', { style: cardStyle, 'data-auth-form': '' }, [
            sectionLabel('Get started', '#a855f7'),
            title, sub,
            pendingBanner,
            el('div', { style: 'display:flex; flex-direction:column; gap:0.85rem; margin-bottom:1.25rem;' }, [emailInput, passWrapper]),
            submitBtn,
            toggleBtn,
            errorEl
        ]);

        // External callers (the Pro/Free CTAs on the plan cards) use this
        // event to flip the form into signup mode and scroll into view.
        card.addEventListener('setmode', (e) => setMode(e.detail || 'signup'));

        return card;
    };

    // ---------- right column: signed-in account actions ----------
    const accountCol = (user, plan) => {
        const isPro = plan === 'pro';

        const badge = el('span', {
            style: `display:inline-flex; align-items:center; font-size:0.7rem; font-weight:700; letter-spacing:0.1em; padding:0.3rem 0.65rem; border-radius:6px; line-height:1;
                    background:${isPro ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'rgba(148,163,184,0.18)'};
                    color:${isPro ? '#fff' : '#cbd5e1'};
                    ${isPro ? 'box-shadow: 0 2px 12px rgba(168,85,247,0.4);' : ''}`
        }, isPro ? 'PRO' : 'FREE');

        const title = el('h3', { style: 'font-size:1.4rem; margin:0 0 0.25rem; color:#e2e8f0;' }, 'Your account');
        const email = el('p', { style: 'color:#94a3b8; margin:0 0 1.5rem; font-size:0.95rem;' }, user.email || '');

        const statusBox = el('div', {
            style: `padding:1rem 1.1rem; border-radius:12px; margin-bottom:1.5rem; line-height:1.55; font-size:0.92rem;
                    background:${isPro ? 'rgba(168,85,247,0.08)' : 'rgba(30,41,59,0.5)'};
                    border:1px solid ${isPro ? 'rgba(168,85,247,0.25)' : 'rgba(148,163,184,0.15)'};
                    color:#cbd5e1;`
        }, isPro
            ? 'You\'re on the Pro plan. AI features are unlocked in the editor.'
            : 'You\'re on the Free plan. Upgrade to unlock AI generation in the editor.');

        // Pro users get a deliberately understated "Manage" link — we don't
        // want to make unsubscribing feel like a primary action. Free users
        // get the full-width upgrade CTA.
        const primaryBtn = isPro
            ? el('button', {
                style: `background:transparent; border:none; color:#94a3b8; cursor:pointer;
                        font-size:0.8rem; padding:0.25rem 0; text-decoration:underline;
                        text-underline-offset:3px; align-self:flex-start;`
            }, 'Manage subscription')
            : el('button', { class: 'cta', style: 'width:100%; justify-content:center; margin-bottom:0.75rem;' }, '⚡ Upgrade to Pro');

        primaryBtn.addEventListener('click', async () => {
            primaryBtn.disabled = true;
            const original = primaryBtn.innerHTML;
            try {
                if (isPro) {
                    // Customer Portal still requires a redirect (not embeddable).
                    primaryBtn.innerHTML = 'Opening portal…';
                    const url = await auth.openPortal();
                    window.location.href = url;
                } else {
                    // Embedded checkout — opens a modal over the landing page.
                    openCheckoutModal();
                    primaryBtn.disabled = false;
                    primaryBtn.innerHTML = original;
                }
            } catch (err) {
                alert(err?.message || 'Could not open billing');
                primaryBtn.disabled = false;
                primaryBtn.innerHTML = original;
            }
        });

        const launchBtn = el('a', { href: '/editor', class: 'cta cta-secondary', style: 'width:100%; justify-content:center;' }, 'Launch editor →');

        // Prominent sign-out so users can find it easily — styled as a
        // proper secondary button rather than a buried text link.
        const signOutBtn = el('button', {
            class: 'cta cta-secondary',
            style: 'width:100%; justify-content:center;',
            onclick: () => auth.signOut()
        }, 'Sign out');

        // Delete account — destructive, so styled as a small understated
        // red link at the very bottom. Two-step confirmation: prompt
        // requires the user to type their email to proceed.
        const deleteBtn = el('button', {
            style: `background:transparent; border:none; color:#ef4444; cursor:pointer;
                    font-size:0.8rem; padding:0.25rem 0; text-decoration:underline;
                    text-underline-offset:3px;`
        }, 'Delete account');
        deleteBtn.addEventListener('click', async () => {
            const typed = prompt(
                `This permanently deletes your account, cancels any active subscription, and removes all your saved canvases. This cannot be undone.\n\nType your email (${user.email}) to confirm:`
            );
            if (typed == null) return; // cancelled
            if (typed.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
                alert('Email did not match. Account NOT deleted.');
                return;
            }
            deleteBtn.disabled = true;
            const original = deleteBtn.textContent;
            deleteBtn.textContent = 'Deleting…';
            try {
                await auth.deleteAccount();
                alert('Account deleted.');
                window.location.href = '/';
            } catch (err) {
                alert(err?.message || 'Could not delete account.');
                deleteBtn.disabled = false;
                deleteBtn.textContent = original;
            }
        });

        // For Pro: status → Launch editor → Sign out → small Manage subscription link → Delete account
        // For Free: status → Upgrade → Launch editor → Sign out → Delete account
        const dangerZone = el('div', {
            style: 'margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(148,163,184,0.12); text-align:center;'
        }, [deleteBtn]);
        const actions = isPro
            ? [launchBtn, signOutBtn, el('div', { style: 'margin-top:1rem;' }, [primaryBtn]), dangerZone]
            : [primaryBtn, launchBtn, el('div', { style: 'margin-top:0.75rem;' }, [signOutBtn]), dangerZone];

        return el('div', { style: cardStyle }, [
            el('div', { style: 'display:flex; align-items:center; justify-content:space-between; margin-bottom:0.25rem;' }, [
                sectionLabel('Account', '#a855f7'),
                badge
            ]),
            title, email,
            statusBox,
            ...actions
        ]);
    };

    // ---------- render ----------
    let lastState = { user: null, plan: 'free' };
    const renderAll = () => {
        const { user, plan } = lastState;
        if (!auth.isConfigured()) {
            container.innerHTML = '';
            container.appendChild(el('div', {
                style: `${cardStyle} max-width:560px; margin:0 auto; text-align:center;`
            }, [
                el('h3', { style: 'font-size:1.4rem; margin-bottom:0.5rem; color:#e2e8f0;' }, 'Accounts unavailable'),
                el('p', { style: 'color:#94a3b8;' }, 'The site is missing Supabase configuration. The editor still works without an account.')
            ]));
            return;
        }

        container.innerHTML = '';
        const grid = el('div', { class: 'account-grid', style: gridStyle }, [
            planComparisonCol(user, plan),
            user ? accountCol(user, plan) : authFormCol()
        ]);
        container.appendChild(grid);
    };

    auth.onChange((s) => { lastState = s; renderAll(); });

    // Re-render once Stripe price resolves so the Pro card shows actual
    // dollars instead of the "Monthly" fallback.
    loadPublicConfig().then(() => renderAll());
}

function inputStyle() {
    return `
        width: 100%;
        padding: 0.85rem 1rem;
        background: rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(99, 102, 241, 0.25);
        border-radius: 10px;
        color: #f8fafc;
        font-size: 1rem;
        font-family: inherit;
        transition: border-color 0.15s ease, background 0.15s ease;
        outline: none;
    `;
}
