// ============================================================
// UTILS.JS — Micro Sharks Tank
// Loaded by: auth.html, dashboard.html, chat.html, deals.html,
//            proposals.html, proposal-details.html, offer-detail.html,
//            funding-history.html, investor-portfolio.html
//
// CONTAINS:
//   1.  showSovereignStatus()    → login/register overlay (used by auth.html)
//   2.  hideSovereignStatus()    → hides the above overlay
//   3.  handleLogout()           → animated forensic logout modal
//   4.  closeLogout()            → closes logout modal
//   5.  displayOffers()          → renders offer cards (entrepreneur + investor)
//   6.  displayDeals()           → renders deal cards (entrepreneur + investor)
//   7.  displayProposals()       → renders proposal cards
//   8.  handleOffer()            → accept / reject an offer (entrepreneur action)
//   9.  renderUnifiedNav()       → builds nav bar dynamically based on user role
//   10. showLoading()            → toggle loading spinner
//   11. showAlert()              → toast notification
//   12. getEmptyState()          → empty state HTML block
//   13. formatNumber()           → Indian locale number format
//   14. formatDate()             → readable date string
//
// LOAD ORDER: config.js → utils.js → dashboard.js (dashboard only)
//
// RULE: No dashboard-specific data fetching here.
//       No duplicate function names with dashboard.js.
// ============================================================


// ============================================================
// 1. SOVEREIGN STATUS OVERLAY
// Used by auth.html for login / register feedback.
// Types: 'loading' | 'success' | 'error'
// ============================================================
function showSovereignStatus(type, title, message) {
    console.log(`[Utils] showSovereignStatus → type: ${type}, title: ${title}`);

    const existing = document.getElementById('sovereignStatus');
    if (existing) existing.remove();

    const colorMap = {
        success: '#10b981',
        error:   '#ef4444',
        loading: '#6366f1',
    };
    const color = colorMap[type] || colorMap.loading;
    const icon  = type === 'success' ? '✓' : type === 'error' ? '✕' : '⋯';

    const progressBar = type === 'loading'
        ? `<div style="margin-top:1.5rem;height:4px;background:#e2e8f0;border-radius:10px;overflow:hidden;">
               <div style="height:100%;width:40%;background:${color};border-radius:10px;
                   animation:_sovereignPulse 1.2s ease-in-out infinite;"></div>
           </div>`
        : '';

    const html = `
        <div id="sovereignStatus" style="
            position:fixed;inset:0;z-index:99999;
            background:rgba(2,6,23,0.85);backdrop-filter:blur(8px);
            display:flex;align-items:center;justify-content:center;">
            <div style="
                background:#fff;border-radius:24px;padding:3rem 2.5rem;
                max-width:420px;width:90%;text-align:center;
                box-shadow:0 25px 60px rgba(0,0,0,0.3);">
                <div style="
                    width:64px;height:64px;border-radius:50%;margin:0 auto 1.5rem;
                    background:${color}15;color:${color};
                    display:flex;align-items:center;justify-content:center;
                    font-size:1.8rem;font-weight:900;border:2px solid ${color}30;">
                    ${icon}
                </div>
                <h2 style="font-size:1.4rem;font-weight:900;color:#020617;margin-bottom:.5rem;letter-spacing:-0.5px;">
                    ${title}
                </h2>
                <p style="font-size:.88rem;color:#64748b;line-height:1.6;margin:0;">
                    ${message}
                </p>
                ${progressBar}
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

function hideSovereignStatus() {
    console.log('[Utils] hideSovereignStatus called');
    const el = document.getElementById('sovereignStatus');
    if (el) {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s ease';
        setTimeout(() => el.remove(), 300);
    }
}


// ============================================================
// 2. ANIMATED LOGOUT MODAL
// Called from any page via handleLogout() / onclick="handleLogout()"
// closeLogout() is called by the Abort button inside the modal
// ============================================================
window.handleLogout = function() {
    console.log('[Utils] handleLogout → opening forensic modal');

    // Don't create duplicate
    if (document.getElementById('logoutOverlay')) return;

    const html = `
        <div id="logoutOverlay" style="
            position:fixed;inset:0;z-index:99999;
            background:rgba(2,6,23,0.9);backdrop-filter:blur(10px);
            display:flex;align-items:center;justify-content:center;">
            <div style="
                background:#0f172a;border:1px solid #1e293b;border-radius:24px;
                padding:3rem 2.5rem;max-width:440px;width:90%;text-align:center;
                box-shadow:0 30px 80px rgba(0,0,0,0.5);position:relative;overflow:hidden;">

                <!-- Glow -->
                <div style="
                    position:absolute;top:-60px;left:50%;transform:translateX(-50%);
                    width:200px;height:200px;border-radius:50%;
                    background:radial-gradient(circle,rgba(239,68,68,0.15),transparent 70%);
                    pointer-events:none;"></div>

                <!-- Icon -->
                <div style="
                    width:64px;height:64px;border-radius:50%;margin:0 auto 1.5rem;
                    background:rgba(239,68,68,0.1);color:#ef4444;
                    display:flex;align-items:center;justify-content:center;
                    font-size:1.6rem;font-weight:900;border:1px solid rgba(239,68,68,0.3);">
                    !
                </div>

                <h2 style="font-size:1.5rem;font-weight:900;color:#f8fafc;margin-bottom:.75rem;letter-spacing:-0.5px;">
                    Revoke Identity?
                </h2>
                <p style="font-size:.85rem;color:#94a3b8;line-height:1.7;margin-bottom:2rem;">
                    You are about to terminate your secure session.<br>
                    All local handshake tokens will be purged.
                </p>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.5rem;">
                    <button onclick="closeLogout()" style="
                        padding:14px;border-radius:12px;font-weight:800;font-size:.8rem;
                        text-transform:uppercase;letter-spacing:1px;cursor:pointer;
                        background:transparent;color:#94a3b8;border:1px solid #334155;
                        transition:all .2s;"
                        onmouseover="this.style.borderColor='#64748b';this.style.color='#f8fafc'"
                        onmouseout="this.style.borderColor='#334155';this.style.color='#94a3b8'">
                        ABORT
                    </button>
                    <button id="finalRevokeBtn" onclick="_executeLogout()" style="
                        padding:14px;border-radius:12px;font-weight:800;font-size:.8rem;
                        text-transform:uppercase;letter-spacing:1px;cursor:pointer;
                        background:#ef4444;color:#fff;border:none;
                        transition:all .2s;"
                        onmouseover="this.style.background='#dc2626'"
                        onmouseout="this.style.background='#ef4444'">
                        REVOKE_ACCESS
                    </button>
                </div>

                <div style="font-size:.6rem;color:#334155;font-family:monospace;letter-spacing:1px;">
                    SESSION_STATUS: ENCRYPTED // STANDBY_FOR_COMMAND
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
};

window.closeLogout = function() {
    console.log('[Utils] closeLogout called');
    const el = document.getElementById('logoutOverlay');
    if (el) {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s ease';
        setTimeout(() => el.remove(), 300);
    }
};

window._executeLogout = async function() {
    const btn = document.getElementById('finalRevokeBtn');
    if (btn) {
        btn.textContent = 'PURGING...';
        btn.style.opacity = '0.6';
        btn.disabled = true;
    }
    console.log('[Utils] _executeLogout → signing out...');
    try {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        console.log('[Utils] Session purged. Redirecting to index...');
        window.location.replace('index.html');
    } catch (err) {
        console.error('[Utils] Logout error:', err);
        window.location.replace('index.html');
    }
};


// ============================================================
// 3. DISPLAY OFFERS
//
// role = 'entrepreneur':
//   Supabase query must select:
//     offers.*, proposals(title), users:investor_id(full_name)
//   → Shows investor name + Accept/Decline on pending offers
//
// role = 'investor':
//   Supabase query must select:
//     offers.*, proposals(title, users:user_id(full_name))
//   → Shows ALL offers investor made, founder name, no action buttons
// ============================================================
function displayOffers(offers, containerId, role) {
    console.log(`[Utils] displayOffers → container: #${containerId}, role: ${role}, count: ${offers?.length ?? 0}`);

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[Utils] displayOffers: container #${containerId} NOT FOUND in DOM`);
        return;
    }

    if (!offers || offers.length === 0) {
        console.warn(`[Utils] displayOffers: no offers to render for role: ${role}`);
        container.innerHTML = `
            <div class="card" style="grid-column:1/-1;text-align:center;padding:3rem;">
                <p style="color:var(--shark-muted);font-weight:600;">
                    ${role === 'investor'
                        ? 'You have not submitted any offers yet. Browse the Marketplace to invest.'
                        : 'No investment offers received yet. Get your proposals verified to attract investors.'}
                </p>
            </div>`;
        return;
    }

    const statusStyle = {
        pending:   'background:#fef9c3;color:#854d0e;border:1px solid #fde047',
        accepted:  'background:#dcfce7;color:#15803d;border:1px solid #86efac',
        rejected:  'background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5',
        countered: 'background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd',
        withdrawn: 'background:#f1f5f9;color:#475569;border:1px solid #cbd5e1',
    };

    container.innerHTML = offers.map(offer => {
        const isEnt = role === 'entrepreneur';

        // Entrepreneur → investor sent the offer → offer.users (aliased as users:investor_id)
        // Investor     → founder owns the proposal → offer.proposals.users (aliased as users:user_id)
        const partnerName = isEnt
            ? (offer.users?.full_name || 'Unknown Investor')
            : (offer.proposals?.users?.full_name || 'Unknown Founder');

        if (!offer.users && isEnt) {
            console.warn(`[Utils] displayOffers: offer ${offer.id} has no users join — investor name will be Unknown`);
        }
        if (!offer.proposals?.users && !isEnt) {
            console.warn(`[Utils] displayOffers: offer ${offer.id} has no proposals.users join — founder name will be Unknown`);
        }

        const proposalTitle = offer.proposals?.title || 'Unknown Proposal';
        const amount        = parseFloat(offer.amount || 0).toLocaleString('en-IN');
        const equity        = offer.equity_percentage ?? 'N/A';
        const valuation     = offer.valuation ? '₹' + parseFloat(offer.valuation).toLocaleString('en-IN') : 'N/A';
        const sStyle        = statusStyle[offer.status] || statusStyle.pending;
        const dateStr       = offer.created_at
            ? new Date(offer.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
            : '';

        // Entrepreneur always sees "View Full Terms" link
        // If offer is pending, also show inline Accept/Decline buttons
        const viewBtn = `<a href="offer-detail.html?id=${offer.id}"
                class="btn btn-outline"
                style="flex:1;text-align:center;text-decoration:none;border-color:var(--shark-indigo);color:var(--shark-indigo);">
                🔍 Full Terms
            </a>`;

        const actionHTML = isEnt
            ? `<div style="display:flex;gap:8px;margin-top:auto;padding-top:14px;">
                   ${viewBtn}
                   ${offer.status === 'pending' ? `
                   <button onclick="handleOffer('${offer.id}','accept')"
                       class="btn btn-primary" style="flex:1;background:#10b981;border:none;">
                       ✓ Accept
                   </button>
                   <button onclick="handleOffer('${offer.id}','reject')"
                       class="btn btn-outline" style="flex:1;color:#ef4444;border-color:#ef4444;">
                       ✗ Decline
                   </button>` : ''}
               </div>`
            : `<a href="offer-detail.html?id=${offer.id}"
                   class="btn btn-primary"
                   style="display:block;text-align:center;margin-top:auto;padding-top:14px;text-decoration:none;">
                   View Offer Details
               </a>`;

        return `
            <div class="card" style="border-left:5px solid var(--shark-indigo)!important;display:flex;flex-direction:column;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.75rem;">
                    <h4 style="margin:0;font-size:1.05rem;font-weight:800;color:var(--shark-obsidian);">
                        ₹${amount} Offer
                    </h4>
                    <span style="${sStyle};padding:3px 10px;border-radius:20px;
                        font-size:.65rem;font-weight:800;text-transform:uppercase;white-space:nowrap;">
                        ${offer.status}
                    </span>
                </div>

                <div class="partner-strip" style="margin-bottom:.75rem;">
                    <div class="partner-avatar" style="background:var(--shark-indigo);">
                        ${partnerName.charAt(0).toUpperCase()}
                    </div>
                    <span class="partner-name">
                        ${isEnt ? 'From' : 'Proposal by'}: <strong>${partnerName}</strong>
                    </span>
                </div>

                <div style="font-size:.8rem;color:var(--shark-muted);margin-bottom:.6rem;">
                    📁 <strong style="color:var(--shark-obsidian);">${proposalTitle}</strong>
                </div>

                <div class="f-nodes" style="margin-bottom:.6rem;">
                    <div class="f-node highlight">
                        <span class="f-label">Equity Stake</span>
                        <span class="f-value" style="color:var(--shark-indigo);">${equity}%</span>
                    </div>
                    <div class="f-node">
                        <span class="f-label">Valuation</span>
                        <span class="f-value">${valuation}</span>
                    </div>
                </div>

                ${offer.message
                    ? `<p style="font-size:.78rem;color:var(--shark-muted);font-style:italic;
                           border-left:3px solid #e2e8f0;padding-left:8px;margin-bottom:.6rem;">
                           "${offer.message.substring(0, 100)}${offer.message.length > 100 ? '…' : ''}"
                       </p>`
                    : ''}

                <div style="font-size:.65rem;color:#94a3b8;margin-bottom:.4rem;">
                    Submitted: ${dateStr}
                </div>

                ${actionHTML}
            </div>`;
    }).join('');

    console.log(`[Utils] displayOffers → rendered ${offers.length} offer card(s) into #${containerId}`);
}


// ============================================================
// 4. DISPLAY DEALS
//
// viewerRole = 'entrepreneur':
//   Supabase query must select:
//     deals.*, proposals(title), investor_profile:investor_id(full_name)
//
// viewerRole = 'investor':
//   Supabase query must select:
//     deals.*, proposals(title), entrepreneur_profile:entrepreneur_id(full_name)
// ============================================================
function displayDeals(deals, containerId, viewerRole) {
    console.log(`[Utils] displayDeals → container: #${containerId}, role: ${viewerRole}, count: ${deals?.length ?? 0}`);

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[Utils] displayDeals: container #${containerId} NOT FOUND in DOM`);
        return;
    }

    if (!deals || deals.length === 0) {
        console.warn(`[Utils] displayDeals: no deals to render`);
        container.innerHTML = `
            <div class="card" style="grid-column:1/-1;text-align:center;padding:3rem;">
                <p style="color:var(--shark-muted);font-weight:600;">No finalized deals yet.</p>
            </div>`;
        return;
    }

    container.innerHTML = deals.map(deal => {
        const proposalTitle = deal.proposals?.title || 'Unknown Proposal';
        const amount        = parseFloat(deal.investment_amount || 0).toLocaleString('en-IN');
        const equity        = deal.equity_percentage ?? 'N/A';

        // Pick partner name based on viewer
        const partnerName = viewerRole === 'investor'
            ? (deal.entrepreneur_profile?.full_name || 'Unknown Founder')
            : (deal.investor_profile?.full_name    || 'Unknown Investor');

        if (viewerRole === 'investor' && !deal.entrepreneur_profile) {
            console.warn(`[Utils] displayDeals: deal ${deal.id} missing entrepreneur_profile join`);
        }
        if (viewerRole === 'entrepreneur' && !deal.investor_profile) {
            console.warn(`[Utils] displayDeals: deal ${deal.id} missing investor_profile join`);
        }

        const dealDate = deal.deal_date
            ? new Date(deal.deal_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
            : '';

        return `
            <div class="card" style="border-left:5px solid var(--shark-emerald)!important;display:flex;flex-direction:column;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.75rem;">
                    <h4 style="margin:0;font-size:1.05rem;font-weight:800;color:#064e3b;">${proposalTitle}</h4>
                    <span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;
                        padding:3px 10px;border-radius:20px;font-size:.65rem;font-weight:800;">
                        ACTIVE DEAL
                    </span>
                </div>

                <div class="partner-strip" style="background:#ecfdf5;border:1px solid #d1fae5;margin-bottom:.75rem;">
                    <div class="partner-avatar" style="background:var(--shark-emerald);">🤝</div>
                    <span class="partner-name" style="color:#065f46;">
                        Partner: <strong>${partnerName}</strong>
                    </span>
                </div>

                <div class="f-nodes" style="margin-bottom:.75rem;">
                    <div class="f-node highlight">
                        <span class="f-label">Capital Deployed</span>
                        <span class="f-value" style="color:#064e3b;">₹${amount}</span>
                    </div>
                    <div class="f-node">
                        <span class="f-label">Equity Stake</span>
                        <span class="f-value" style="color:#064e3b;">${equity}%</span>
                    </div>
                </div>

                ${dealDate ? `<div style="font-size:.65rem;color:#94a3b8;margin-bottom:.6rem;">Deal Date: ${dealDate}</div>` : ''}

                <div style="background:#f0fdf4;border:1px dashed #bbf7d0;padding:10px;border-radius:10px;margin-bottom:.75rem;">
                    <small style="color:#065f46;text-transform:uppercase;font-size:.6rem;font-weight:800;display:block;margin-bottom:4px;">
                        Deal Reference
                    </small>
                    <code style="font-size:.65rem;color:#047857;word-break:break-all;">
                        DEAL_${deal.id.substring(0, 16).toUpperCase()}
                    </code>
                </div>

                <div style="display:flex;gap:8px;margin-top:auto;">
                    <button onclick="window.location.href='chat.html'"
                        class="btn btn-outline" style="flex:1;border-color:#d1fae5;color:#065f46;">
                        💬 Message
                    </button>
                    <a href="proposal-details.html?id=${deal.proposal_id}"
                        class="btn btn-primary"
                        style="flex:1;background:var(--shark-emerald);border:none;text-align:center;">
                        Audit Asset
                    </a>
                </div>
            </div>`;
    }).join('');

    console.log(`[Utils] displayDeals → rendered ${deals.length} deal card(s) into #${containerId}`);
}


// ============================================================
// 5. DISPLAY PROPOSALS
// showInvestorView = true  → shows "View & Invest", hides Edit
// showInvestorView = false → shows "View Details" + Edit button
// ============================================================
function displayProposals(proposals, containerId, showInvestorView = false) {
    console.log(`[Utils] displayProposals → container: #${containerId}, investorView: ${showInvestorView}, count: ${proposals?.length ?? 0}`);

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[Utils] displayProposals: container #${containerId} NOT FOUND in DOM`);
        return;
    }

    if (!proposals || proposals.length === 0) {
        console.warn(`[Utils] displayProposals: no proposals to render`);
        container.innerHTML = `
            <div class="card" style="grid-column:1/-1;text-align:center;padding:3rem;">
                <p style="color:var(--shark-muted);font-weight:600;">No proposals found.</p>
            </div>`;
        return;
    }

    const statusStyle = {
        pending: 'background:#fef9c3;color:#854d0e',
        active:  'background:#dcfce7;color:#15803d',
        funded:  'background:#dbeafe;color:#1d4ed8',
        closed:  'background:#f1f5f9;color:#475569',
        failed:  'background:#fee2e2;color:#b91c1c',
    };

    container.innerHTML = proposals.map(p => {
        const fundingPct = p.amount_needed > 0
            ? Math.min(Math.round((parseFloat(p.funding_received || 0) / parseFloat(p.amount_needed)) * 100), 100)
            : 0;
        const score      = p.success_score || 0;
        const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b';
        const pStyle     = statusStyle[p.status] || statusStyle.pending;

        const actionsHTML = showInvestorView
            ? `<a href="proposal-details.html?id=${p.id}" class="btn btn-primary" style="flex:1;text-align:center;">View & Invest</a>`
            : `<a href="proposal-details.html?id=${p.id}" class="btn btn-primary" style="flex:2;text-align:center;">View Details</a>
               <a href="edit-proposal.html?id=${p.id}" class="btn btn-outline" style="flex:1;text-align:center;">⚙️</a>`;

        return `
            <div class="proposal-card" style="display:flex;flex-direction:column;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.5rem;">
                    <h3 style="margin:0;font-weight:800;font-size:1rem;flex:1;margin-right:.5rem;">${p.title}</h3>
                    <span style="${pStyle};padding:3px 10px;border-radius:20px;font-size:.65rem;
                        font-weight:800;text-transform:uppercase;white-space:nowrap;">${p.status}</span>
                </div>

                <p style="font-size:.82rem;color:var(--shark-muted);font-style:italic;margin-bottom:1rem;">
                    ${p.tagline || 'No tagline provided.'}
                </p>

                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem;">
                    ${p.location
                        ? `<span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:10px;font-size:.7rem;">📍 ${p.location}</span>`
                        : ''}
                    <span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:10px;font-size:.7rem;">
                        📁 ${p.category || 'Uncategorized'}
                    </span>
                    <span style="background:${scoreColor}20;color:${scoreColor};padding:3px 8px;border-radius:10px;font-size:.7rem;font-weight:700;">
                        ⭐ ${score}
                    </span>
                </div>

                <div class="f-nodes" style="margin-bottom:1rem;">
                    <div class="f-node highlight">
                        <span class="f-label">Target</span>
                        <span class="f-value">₹${parseFloat(p.amount_needed || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="f-node">
                        <span class="f-label">Equity</span>
                        <span class="f-value">${p.equity_offered}%</span>
                    </div>
                </div>

                <div style="margin-bottom:1.2rem;">
                    <div style="display:flex;justify-content:space-between;font-size:.65rem;font-weight:800;color:var(--shark-muted);margin-bottom:5px;">
                        <span>CAPITAL SECURED</span><span>${fundingPct}%</span>
                    </div>
                    <div style="height:8px;background:#e2e8f0;border-radius:10px;overflow:hidden;">
                        <div style="width:${fundingPct}%;height:100%;
                            background:linear-gradient(90deg,var(--shark-indigo),#4f46e5);
                            border-radius:10px;transition:width 1s ease;"></div>
                    </div>
                </div>

                <div style="display:flex;gap:8px;margin-top:auto;">
                    ${actionsHTML}
                </div>
            </div>`;
    }).join('');

    console.log(`[Utils] displayProposals → rendered ${proposals.length} proposal card(s) into #${containerId}`);
}


// ============================================================
// 6. HANDLE OFFER — Accept or Reject
// Called via onclick="handleOffer('id','accept')" from offer cards
// Only entrepreneurs should see these buttons (dashboard.js controls this)
// ============================================================
window.handleOffer = async function(offerId, action) {
    console.log(`[Utils] handleOffer → offerId: ${offerId}, action: ${action}`);

    const confirmMsg = action === 'accept'
        ? 'Accept this offer and close the deal?'
        : 'Decline this offer?';
    if (!confirm(confirmMsg)) {
        console.log('[Utils] handleOffer → cancelled by user');
        return;
    }

    try {
        // Step 1: Fetch full offer
        console.log('[Utils] handleOffer → fetching offer from DB...');
        const { data: offer, error: fetchErr } = await supabase
            .from('offers')
            .select('*')
            .eq('id', offerId)
            .maybeSingle();

        if (fetchErr) {
            console.error('[Utils] handleOffer → fetch error:', fetchErr);
            throw fetchErr;
        }
        if (!offer) {
            console.error('[Utils] handleOffer → offer not found or access denied');
            throw new Error('Offer not found or access denied.');
        }

        console.log('[Utils] handleOffer → offer fetched:', offer);

        if (action === 'accept') {
            // Step 2: Mark offer accepted
            console.log('[Utils] handleOffer → marking offer accepted...');
            const { error: updErr } = await supabase
                .from('offers')
                .update({ status: 'accepted', accepted_at: new Date().toISOString() })
                .eq('id', offerId);
            if (updErr) { console.error('[Utils] handleOffer → update error:', updErr); throw updErr; }

            // Step 3: Log funding (triggers DB auto-totals via trigger)
            console.log('[Utils] handleOffer → inserting funding_log...');
            const { error: logErr } = await supabase.from('funding_logs').insert({
                proposal_id: offer.proposal_id,
                investor_id: offer.investor_id,
                amount:      offer.amount,
                equity_given: offer.equity_percentage
            });
            if (logErr) console.warn('[Utils] handleOffer → funding_log insert warning:', logErr);

            // Step 4: Create deal record
            console.log('[Utils] handleOffer → creating deal record...');
            const { data: { user } } = await supabase.auth.getUser();
            const { error: dealErr } = await supabase.from('deals').insert({
                offer_id:          offer.id,
                proposal_id:       offer.proposal_id,
                entrepreneur_id:   user.id,
                investor_id:       offer.investor_id,
                investment_amount: offer.amount,
                equity_percentage: offer.equity_percentage,
                deal_status:       'active'
            });
            if (dealErr) { console.error('[Utils] handleOffer → deal insert error:', dealErr); throw dealErr; }

            console.log('[Utils] handleOffer → deal created successfully ✅');

            // Step 5: Notify investor their offer was accepted
            console.log('[Utils] handleOffer → notifying investor:', offer.investor_id);
            const { error: acceptNotifErr } = await supabase.from('notifications').insert({
                user_id: offer.investor_id,
                title:   '🎉 Your Offer Was Accepted!',
                message: `Your offer of ₹${parseFloat(offer.amount).toLocaleString('en-IN')} for ${offer.equity_percentage}% equity has been accepted. A deal has been created.`,
                type:    'offer',
                link:    `offer-detail.html?id=${offerId}`
            });
            if (acceptNotifErr) console.warn('[Utils] handleOffer → accept notification failed (non-fatal):', acceptNotifErr);
            else console.log('[Utils] handleOffer → investor notified of acceptance ✅');

            alert('✅ Offer accepted! Deal has been finalized.');
        } else {
            // Reject
            console.log('[Utils] handleOffer → rejecting offer...');
            const { error: rejErr } = await supabase
                .from('offers')
                .update({ status: 'rejected' })
                .eq('id', offerId);
            if (rejErr) { console.error('[Utils] handleOffer → reject error:', rejErr); throw rejErr; }
            console.log('[Utils] handleOffer → offer rejected ✅');

            // Notify investor their offer was declined
            console.log('[Utils] handleOffer → notifying investor of rejection:', offer.investor_id);
            const { error: rejNotifErr } = await supabase.from('notifications').insert({
                user_id: offer.investor_id,
                title:   '❌ Offer Declined',
                message: `Your offer of ₹${parseFloat(offer.amount).toLocaleString('en-IN')} for ${offer.equity_percentage}% equity was declined by the founder.`,
                type:    'offer',
                link:    `offer-detail.html?id=${offerId}`
            });
            if (rejNotifErr) console.warn('[Utils] handleOffer → reject notification failed (non-fatal):', rejNotifErr);
            else console.log('[Utils] handleOffer → investor notified of rejection ✅');

            alert('Offer declined.');
        }

        location.reload();
    } catch (err) {
        console.error('[Utils] handleOffer → CRITICAL ERROR:', err);
        alert('Error processing offer: ' + err.message);
    }
};


// ============================================================
// 7. UNIFIED NAV RENDERER
// Used by pages that load utils.js but NOT dashboard.js
// (chat.html, deals.html, proposals.html, etc.)
// Call renderUnifiedNav() at bottom of those pages' inline scripts
// ============================================================
async function renderUnifiedNav() {
    console.log('[Utils] renderUnifiedNav → building nav...');
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { console.warn('[Utils] renderUnifiedNav → no user session'); return; }

        const { data: profile, error } = await supabase
            .from('users')
            .select('full_name, role')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !profile) {
            console.error('[Utils] renderUnifiedNav → profile fetch error:', error);
            return;
        }

        const currentPage = window.location.pathname.split('/').pop();
        const isActive    = page => currentPage === page ? 'style="color:var(--shark-indigo);font-weight:900;"' : '';

        const navHTML = `
            <div class="nav-container">
                <a href="dashboard.html" class="nav-brand">SOVEREIGN<span>HUB</span></a>

                <div class="nav-links">
                    <a href="dashboard.html" ${isActive('dashboard.html')}>Dashboard</a>
                    <a href="proposals.html" ${isActive('proposals.html')}>Marketplace</a>
                    <a href="chat.html"      ${isActive('chat.html')}>Messages</a>
                    ${profile.role === 'entrepreneur'
                        ? `<a href="submit-proposal.html" ${isActive('submit-proposal.html')}>Submit Pitch</a>`
                        : ''}
                    ${profile.role === 'investor'
                        ? `<a href="investor-portfolio.html" ${isActive('investor-portfolio.html')}>Portfolio</a>`
                        : ''}
                </div>

                <div class="nav-actions" style="display:flex;align-items:center;gap:12px;">
                    <!-- Notification Bell -->
                    <div id="notifWrapper" style="position:relative;">
                        <button onclick="window.toggleNotifications(event)"
                            style="background:none;border:none;cursor:pointer;font-size:1.1rem;position:relative;padding:4px;">
                            🔔
                            <span id="notifBadge" style="
                                display:none;position:absolute;top:-4px;right:-4px;
                                background:#ef4444;color:#fff;border-radius:50%;
                                width:16px;height:16px;font-size:.6rem;font-weight:900;
                                align-items:center;justify-content:center;">0</span>
                        </button>
                        <div id="notifPanel" style="display:none;position:absolute;right:0;top:calc(100% + 8px);
                            width:320px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;
                            box-shadow:0 10px 40px rgba(0,0,0,0.12);z-index:1000;overflow:hidden;">
                            <div style="padding:1rem;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:.85rem;">Notifications</strong>
                                <button onclick="window.markAllNotificationsRead()"
                                    style="font-size:.7rem;color:var(--shark-indigo);background:none;border:none;cursor:pointer;font-weight:700;">
                                    Mark all read
                                </button>
                            </div>
                            <div id="notifList" style="max-height:360px;overflow-y:auto;"></div>
                        </div>
                    </div>

                    <!-- User Pill -->
                    <div id="userWrapper" style="position:relative;">
                        <button onclick="window.toggleUserMenu(event)"
                            style="display:flex;align-items:center;gap:8px;background:none;border:1px solid #e2e8f0;
                                border-radius:30px;padding:6px 12px;cursor:pointer;">
                            <div style="width:28px;height:28px;background:var(--shark-indigo);color:#fff;border-radius:50%;
                                display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;">
                                ${profile.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-size:.8rem;font-weight:800;">${profile.full_name.split(' ')[0]}</span>
                        </button>
                        <div id="userDropdown" style="display:none;position:absolute;right:0;top:calc(100% + 8px);
                            width:220px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;
                            box-shadow:0 10px 40px rgba(0,0,0,0.12);z-index:1000;overflow:hidden;padding:.5rem 0;">
                            <a href="profile.html" style="display:block;padding:10px 16px;font-size:.82rem;color:#334155;text-decoration:none;font-weight:600;">⚙️ Account Settings</a>
                            <a href="funding-history.html" style="display:block;padding:10px 16px;font-size:.82rem;color:#334155;text-decoration:none;font-weight:600;">🧾 Funding History</a>
                            <hr style="margin:4px 0;border:none;border-top:1px solid #f1f5f9;">
                            <a href="#" onclick="handleLogout()" style="display:block;padding:10px 16px;font-size:.82rem;color:#ef4444;text-decoration:none;font-weight:700;">🔴 Terminate Session</a>
                        </div>
                    </div>
                </div>
            </div>`;

        const navEl = document.querySelector('.main-nav') || document.querySelector('nav');
        if (navEl) {
            navEl.innerHTML = navHTML;
            console.log('[Utils] renderUnifiedNav → nav injected ✅');
            // Fetch and show notification count
            await _updateNavNotifBadge(user.id);
        } else {
            console.warn('[Utils] renderUnifiedNav → .main-nav element not found in DOM');
        }
    } catch (err) {
        console.error('[Utils] renderUnifiedNav → ERROR:', err);
    }
}

async function _updateNavNotifBadge(userId) {
    try {
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        const badge = document.getElementById('notifBadge');
        if (badge && count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        }
        console.log(`[Utils] _updateNavNotifBadge → ${count} unread`);
    } catch (err) {
        console.warn('[Utils] _updateNavNotifBadge → error:', err);
    }
}

// Notification panel toggle (used by both nav and dashboard)
window.toggleNotifications = function(e) {
    if (e) e.stopPropagation();
    const panel    = document.getElementById('notifPanel');
    const userDrop = document.getElementById('userDropdown');
    if (userDrop) userDrop.style.display = 'none';
    if (!panel) { console.warn('[Utils] toggleNotifications → #notifPanel not found'); return; }
    const opening = panel.style.display !== 'block';
    panel.style.display = opening ? 'block' : 'none';
    // If dashboard.js is loaded, it handles loadNotifications; otherwise handle here
    if (opening && typeof loadNotifications === 'function') {
        loadNotifications();
    }
};

window.toggleUserMenu = function(e) {
    if (e) e.stopPropagation();
    const drop  = document.getElementById('userDropdown');
    const panel = document.getElementById('notifPanel');
    if (panel) panel.style.display = 'none';
    if (!drop) { console.warn('[Utils] toggleUserMenu → #userDropdown not found'); return; }
    drop.style.display = drop.style.display === 'block' ? 'none' : 'block';
};

window.markAllNotificationsRead = async function() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
        console.log('[Utils] markAllNotificationsRead → done');
        if (typeof loadNotifications === 'function') loadNotifications();
        else await _updateNavNotifBadge(user.id);
    } catch (err) {
        console.error('[Utils] markAllNotificationsRead → error:', err);
    }
};

// Close both dropdowns on outside click
document.addEventListener('click', () => {
    const p = document.getElementById('notifPanel');
    const d = document.getElementById('userDropdown');
    if (p) p.style.display = 'none';
    if (d) d.style.display = 'none';
});


// ============================================================
// 8. UI HELPERS
// ============================================================
function showLoading(show) {
    const el = document.getElementById('loadingState');
    if (el) {
        el.style.display = show ? 'flex' : 'none';
    }
}

function showAlert(message, type = 'info') {
    const map = {
        success: { bg:'#dcfce7', color:'#15803d', border:'#86efac' },
        danger:  { bg:'#fee2e2', color:'#b91c1c', border:'#fca5a5' },
        warning: { bg:'#fef9c3', color:'#854d0e', border:'#fde047' },
        info:    { bg:'#dbeafe', color:'#1d4ed8', border:'#93c5fd' },
    };
    const c  = map[type] || map.info;
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;top:20px;right:20px;z-index:99998;max-width:380px;
        padding:14px 18px;border-radius:12px;font-weight:600;font-size:.85rem;
        background:${c.bg};color:${c.color};border:1px solid ${c.border};
        box-shadow:0 4px 20px rgba(0,0,0,.1);animation:_alertIn .3s ease;`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(() => el.remove(), 300);
    }, 5000);
}

function getEmptyState(icon, title, message) {
    return `
        <div class="card" style="grid-column:1/-1;text-align:center;padding:3rem;">
            <div style="font-size:2.5rem;margin-bottom:1rem;">${icon}</div>
            <h3 style="margin-bottom:.5rem;">${title}</h3>
            <p style="color:var(--shark-muted);">${message}</p>
        </div>`;
}

function formatNumber(num) {
    const n = Number(num || 0);
    // Abbreviate large numbers so they fit in stat cards
    if (n >= 10000000) return (n / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';   // 1Cr+
    if (n >= 100000)   return (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';      // 1L+
    if (n >= 1000)     return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';        // 1K+
    return n.toLocaleString('en-IN');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}


// ============================================================
// INJECT ANIMATION KEYFRAMES ONCE
// ============================================================
!(function() {
    const s = document.createElement('style');
    s.textContent = `
        @keyframes _alertIn {
            from { transform: translateX(400px); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes _sovereignPulse {
            0%, 100% { width: 30%; opacity: .6; }
            50%       { width: 70%; opacity: 1;  }
        }
    `;
    document.head.appendChild(s);
})();


console.log('✅ utils.js loaded — functions ready: showSovereignStatus, hideSovereignStatus, handleLogout, closeLogout, displayOffers, displayDeals, displayProposals, handleOffer, renderUnifiedNav, showLoading, showAlert, getEmptyState, formatNumber, formatDate');