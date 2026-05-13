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
            // Anonymous: no badge in the editor. Account is reached from
            // the landing page.
            return;
        }

        const isPro = plan === 'pro';
        const badge = el('a', {
            href: '/',
            title: 'Account on home page',
            style: `display:flex; align-items:center; gap:0.4rem; font-size:0.75rem; padding:0.35rem 0.65rem;
                    background:${isPro ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'rgba(30,41,59,0.7)'};
                    color:${isPro ? '#fff' : '#cbd5e1'};
                    border:1px solid ${isPro ? 'rgba(168,85,247,0.6)' : 'rgba(99,102,241,0.3)'};
                    border-radius:6px; text-decoration:none; backdrop-filter:blur(4px);
                    box-shadow:${isPro ? '0 2px 12px rgba(168,85,247,0.35)' : 'none'};`
        }, [
            el('span', { style: 'font-weight:700; letter-spacing:0.06em;' }, isPro ? 'PRO' : 'FREE'),
            el('span', { style: 'opacity:0.8; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;' }, user.email || '')
        ]);
        container.appendChild(badge);
    };
    auth.onChange(render);
}

// ============================================================
// EDITOR: toggle the AI panel between "locked" and "unlocked" views.
// The locked view replaces the prompt UI with a Pro-upsell pointing home.
// ============================================================
export function bindEditorAiPanel({ lockedEl, unlockedEl }) {
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
// other landing sections. Left column = plan comparison; right column =
// auth form (signed out) or account actions (signed in).
// ============================================================
export function mountLandingAccountPanel(container) {
    if (!container) return;

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

    // ---------- left column: plan comparison (same in every state) ----------
    const planComparisonCol = () => {
        const freeCard = el('div', {
            style: `${cardStyle} flex:1; padding:24px;`
        }, [
            el('div', { style: 'display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.4rem;' }, [
                el('div', { style: 'font-size:1.1rem; font-weight:600; color:#e2e8f0;' }, 'Free'),
                el('div', { style: 'font-size:0.85rem; color:#94a3b8;' }, 'Always')
            ]),
            el('div', { style: 'font-size:0.85rem; color:#94a3b8; margin-bottom:0.85rem;' }, 'Full editor, no sign-up required'),
            planFeature('Unlimited graphs, local-first auto-save'),
            planFeature('BFS & DFS animations'),
            planFeature('PNG, JPG, JSON export'),
            planFeature('AI graph generation', false),
            planFeature('AI hierarchy export', false)
        ]);

        const proCard = el('div', {
            style: `${cardStyle} flex:1; padding:24px; border-color: rgba(168, 85, 247, 0.4); background: linear-gradient(180deg, rgba(168,85,247,0.08) 0%, rgba(30,41,59,0.45) 100%);`
        }, [
            el('div', { style: 'display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.4rem;' }, [
                el('div', { style: 'display:flex; align-items:center; gap:0.5rem;' }, [
                    el('span', { style: 'font-size:1.1rem; font-weight:600; color:#e2e8f0;' }, 'Pro'),
                    el('span', { style: 'font-size:0.6rem; font-weight:700; letter-spacing:0.08em; padding:0.2rem 0.45rem; border-radius:4px; background:linear-gradient(135deg,#a855f7,#ec4899); color:#fff;' }, 'AI')
                ]),
                el('div', { style: 'font-size:0.85rem; color:#94a3b8;' }, 'Monthly')
            ]),
            el('div', { style: 'font-size:0.85rem; color:#94a3b8; margin-bottom:0.85rem;' }, 'Everything in Free, plus:'),
            planFeature('AI graph generation from plain English'),
            planFeature('AI hierarchy export (image → tree)'),
            planFeature('Priority OpenAI access'),
            planFeature('Cancel anytime')
        ]);

        return el('div', { style: 'display:flex; flex-direction:column; gap:16px;' }, [
            sectionLabel('What you get', '#a855f7'),
            freeCard,
            proCard
        ]);
    };

    // ---------- right column: signed-out auth form ----------
    const authFormCol = () => {
        let mode = 'signin';
        const emailInput = el('input', { type: 'email', placeholder: 'you@example.com', autocomplete: 'email', style: inputStyle() });
        const passInput = el('input', { type: 'password', placeholder: 'Password (min 6 chars)', autocomplete: 'current-password', style: inputStyle() });
        const errorEl = el('div', { style: 'display:none; color:#ef4444; font-size:0.85rem; margin-top:0.5rem;' });
        const submitBtn = el('button', { class: 'cta', style: 'width:100%; justify-content:center;' }, 'Sign in');
        const toggleLink = el('a', { href: '#', style: 'color:#a855f7; cursor:pointer; font-size:0.9rem; text-decoration:none;' }, 'Need an account? Sign up');
        const title = el('h3', { style: 'font-size:1.5rem; margin:0 0 0.4rem; color:#e2e8f0;' }, 'Sign in');
        const sub = el('p', { style: 'color:#94a3b8; margin-bottom:1.75rem; font-size:0.95rem; line-height:1.5;' },
            'Sign in to manage your account. AI features require a Pro plan.');

        const setMode = (next) => {
            mode = next;
            title.textContent = next === 'signup' ? 'Create your account' : 'Sign in';
            sub.textContent = next === 'signup'
                ? 'Free to create. Upgrade to Pro after sign-up to unlock AI features.'
                : 'Sign in to manage your account. AI features require a Pro plan.';
            submitBtn.textContent = next === 'signup' ? 'Sign up' : 'Sign in';
            toggleLink.textContent = next === 'signup' ? 'Have an account? Sign in' : 'Need an account? Sign up';
            passInput.autocomplete = next === 'signup' ? 'new-password' : 'current-password';
            errorEl.style.display = 'none';
        };
        toggleLink.addEventListener('click', (e) => { e.preventDefault(); setMode(mode === 'signin' ? 'signup' : 'signin'); });

        const submit = async () => {
            errorEl.style.display = 'none';
            submitBtn.disabled = true;
            const original = submitBtn.textContent;
            submitBtn.textContent = mode === 'signup' ? 'Signing up…' : 'Signing in…';
            try {
                if (mode === 'signup') await auth.signUp(emailInput.value.trim(), passInput.value);
                else await auth.signIn(emailInput.value.trim(), passInput.value);
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

        return el('div', { style: cardStyle }, [
            sectionLabel('Get started', '#a855f7'),
            title, sub,
            el('div', { style: 'display:flex; flex-direction:column; gap:0.85rem; margin-bottom:1.25rem;' }, [emailInput, passInput]),
            submitBtn,
            errorEl,
            el('div', { style: 'flex:1;' }), // spacer to push toggle to bottom
            el('div', { style: 'text-align:center; padding-top:1.25rem; border-top:1px solid rgba(148,163,184,0.12); margin-top:1.25rem;' }, [toggleLink])
        ]);
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

        const primaryBtn = isPro
            ? el('button', { class: 'cta cta-secondary', style: 'width:100%; justify-content:center; margin-bottom:0.75rem;' }, '💳 Manage subscription')
            : el('button', { class: 'cta', style: 'width:100%; justify-content:center; margin-bottom:0.75rem;' }, '⚡ Upgrade to Pro');

        primaryBtn.addEventListener('click', async () => {
            primaryBtn.disabled = true;
            const original = primaryBtn.innerHTML;
            primaryBtn.innerHTML = isPro ? 'Opening portal…' : 'Opening Stripe…';
            try {
                const url = isPro ? await auth.openPortal() : await auth.startCheckout();
                window.location.href = url;
            } catch (err) {
                alert(err?.message || 'Could not open billing');
                primaryBtn.disabled = false;
                primaryBtn.innerHTML = original;
            }
        });

        const launchBtn = el('a', { href: '/editor', class: 'cta cta-secondary', style: 'width:100%; justify-content:center;' }, 'Launch editor →');

        const signOutBtn = el('button', {
            style: 'background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:0.85rem; padding:0; text-decoration:underline; text-underline-offset:3px;',
            onclick: () => auth.signOut()
        }, 'Sign out');

        return el('div', { style: cardStyle }, [
            el('div', { style: 'display:flex; align-items:center; justify-content:space-between; margin-bottom:0.25rem;' }, [
                sectionLabel('Account', '#a855f7'),
                badge
            ]),
            title, email,
            statusBox,
            primaryBtn,
            launchBtn,
            el('div', { style: 'flex:1;' }),
            el('div', { style: 'text-align:center; padding-top:1.25rem; border-top:1px solid rgba(148,163,184,0.12); margin-top:1.25rem;' }, [signOutBtn])
        ]);
    };

    // ---------- render ----------
    auth.onChange(({ user, plan }) => {
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
            planComparisonCol(),
            user ? accountCol(user, plan) : authFormCol()
        ]);
        container.appendChild(grid);
    });
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
