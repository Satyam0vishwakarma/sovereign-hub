// ============================================================
// DASHBOARD.JS — Micro Sharks Tank
// Loaded by: dashboard.html ONLY
//
// CONTAINS:
//   - initDashboard()              → entry point, auth check, role routing
//   - Entrepreneur section         → stats, proposals, offer room, deals
//   - Investor section             → stats, marketplace, all offers, portfolio
//   - Admin section                → stats, pending users, pending proposals
//   - Notifications                → bell panel, mark read, click handler
//   - Tab switching                → one per section, no duplicates
//   - Sovereign Clock              → live time widget
//   - Support Modal                → toggle
//   - Mobile Layout Patch          → viewport + grid fix
//
// DEPENDS ON: config.js → utils.js (both loaded before this file)
//
// NEVER REDEFINE ANYTHING FROM utils.js HERE:
//   displayOffers, displayDeals, displayProposals, handleOffer,
//   handleLogout, closeLogout, showSovereignStatus, hideSovereignStatus,
//   renderUnifiedNav, toggleNotifications, toggleUserMenu,
//   markAllNotificationsRead, showLoading, showAlert,
//   getEmptyState, formatNumber, formatDate
// ============================================================

let currentUser = null;
let userRole    = null;


// ============================================================
// ENTRY POINT
// ============================================================
async function initDashboard() {
    console.log('[Dashboard] initDashboard → starting...');
    try {
        showLoading(true);

        // 1. Auth check
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
            console.error('[Dashboard] initDashboard → auth error:', authErr);
            window.location.href = 'auth.html';
            return;
        }
        if (!user) {
            console.warn('[Dashboard] initDashboard → no session, redirecting to auth');
            window.location.href = 'auth.html';
            return;
        }
        console.log('[Dashboard] initDashboard → user authenticated:', user.id);

        // 2. Fetch profile
        const { data: profile, error: profileErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (profileErr) {
            console.error('[Dashboard] initDashboard → profile fetch error:', profileErr);
            throw profileErr;
        }
        if (!profile) {
            console.error('[Dashboard] initDashboard → profile not found for user:', user.id);
            throw new Error('User profile not found. Please complete setup.');
        }

        console.log('[Dashboard] initDashboard → profile loaded, role:', profile.role);
        currentUser = profile;
        userRole    = profile.role;

        // 3. Update header
        _updateHeaderUI();

        // 4. Set role-based action buttons
        _setActionButtons();

        // 5. Load the correct dashboard section
        await _loadDashboardForRole();

        // 6. Load notification badge
        await loadNotifications();

        // 7. Start clock
        startSovereignClock();

        showLoading(false);
        console.log('[Dashboard] initDashboard → fully loaded ✅');
    } catch (err) {
        console.error('[Dashboard] initDashboard → CRITICAL ERROR:', err);
        showAlert('Error loading dashboard: ' + err.message, 'danger');
        showLoading(false);
    }
}

function _updateHeaderUI() {
    if (!currentUser) return;
    console.log('[Dashboard] _updateHeaderUI → updating for:', currentUser.full_name);

    const safe = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
        else console.warn(`[Dashboard] _updateHeaderUI → element #${id} not found`);
    };

    safe('welcomeMessage',    `Welcome, ${currentUser.full_name.split(' ')[0]}`);
    safe('userName',          currentUser.full_name);
    safe('userAvatar',        currentUser.full_name.charAt(0).toUpperCase());
    safe('roleBadge',         currentUser.role.toUpperCase());
    safe('verificationBadge', currentUser.verified ? '✓ Verified' : '⏳ Pending Verification');
}

function _setActionButtons() {
    const hide = id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); };
    const show = id => { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); };

    if (userRole === 'investor') {
        show('investorPortfolioBtn');
        hide('submitProposalBtn');
        hide('entrepreneurPortfolioBtn');
        console.log('[Dashboard] _setActionButtons → investor buttons set');
    } else if (userRole === 'entrepreneur') {
        show('submitProposalBtn');
        show('entrepreneurPortfolioBtn');
        hide('investorPortfolioBtn');
        console.log('[Dashboard] _setActionButtons → entrepreneur buttons set');
    }
}

async function _loadDashboardForRole() {
    console.log('[Dashboard] _loadDashboardForRole → role:', userRole);

    if (userRole === 'entrepreneur') {
        const el = document.getElementById('entrepreneurDashboard');
        if (el) el.style.display = 'block';
        else console.error('[Dashboard] → #entrepreneurDashboard not found in DOM');
        await loadEntrepreneurDashboard();

    } else if (userRole === 'investor') {
        const el = document.getElementById('investorDashboard');
        if (el) el.style.display = 'block';
        else console.error('[Dashboard] → #investorDashboard not found in DOM');
        await loadInvestorDashboard();

    } else if (userRole === 'admin') {
        const el = document.getElementById('adminDashboard');
        if (el) el.style.display = 'block';
        else console.error('[Dashboard] → #adminDashboard not found in DOM');
        await loadAdminDashboard();

    } else {
        console.error('[Dashboard] _loadDashboardForRole → unknown role:', userRole);
    }
}


// ============================================================
// ENTREPRENEUR DASHBOARD
// ============================================================
async function loadEntrepreneurDashboard() {
    console.log('[Dashboard] loadEntrepreneurDashboard → loading all sections...');
    await Promise.all([
        loadEntrepreneurStats(),
        loadEntrepreneurProposals(),
        loadEntrepreneurOffers(),
        loadEntrepreneurDeals(),
    ]);
    console.log('[Dashboard] loadEntrepreneurDashboard → all sections loaded ✅');
}

async function loadEntrepreneurStats() {
    console.log('[Dashboard] loadEntrepreneurStats → fetching...');
    try {
        // Fetch proposals
        const { data: proposals, error: propErr } = await supabase
            .from('proposals')
            .select('id, funding_received')
            .eq('user_id', currentUser.id);

        if (propErr) { console.error('[Dashboard] loadEntrepreneurStats → proposals error:', propErr); throw propErr; }
        console.log(`[Dashboard] loadEntrepreneurStats → ${proposals?.length ?? 0} proposals found`);

        const propIds      = (proposals || []).map(p => p.id);
        const totalFunding = (proposals || []).reduce((s, p) => s + parseFloat(p.funding_received || 0), 0);
        const totalProps   = (proposals || []).length;

        // Fetch PENDING offer count only (label says "Pending investor offers")
        let offerCount = 0;
        if (propIds.length > 0) {
            const { count, error: offerErr } = await supabase
                .from('offers')
                .select('id', { count: 'exact', head: true })
                .in('proposal_id', propIds)
                .eq('status', 'pending');
            if (offerErr) console.warn('[Dashboard] loadEntrepreneurStats → offer count error:', offerErr);
            else offerCount = count || 0;
        }
        console.log(`[Dashboard] loadEntrepreneurStats → PENDING offer count: ${offerCount}`);

        // Fetch deal count
        const { count: dealCount, error: dealErr } = await supabase
            .from('deals')
            .select('id', { count: 'exact', head: true })
            .eq('entrepreneur_id', currentUser.id);
        if (dealErr) console.warn('[Dashboard] loadEntrepreneurStats → deal count error:', dealErr);
        console.log(`[Dashboard] loadEntrepreneurStats → deal count: ${dealCount}`);

        const successRate = totalProps > 0
            ? Math.min(Math.round(((dealCount || 0) / totalProps) * 100), 100)
            : 0;

        // Update stat cards
        const safe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        safe('statTotalProposals',  totalProps);
        safe('statFundingReceived', '₹' + formatNumber(totalFunding));
        safe('statActiveOffers',    offerCount);
        safe('statSuccessRate',     successRate + '%');

        console.log('[Dashboard] loadEntrepreneurStats → stats rendered ✅');
    } catch (err) {
        console.error('[Dashboard] loadEntrepreneurStats → ERROR:', err);
    }
}

async function loadEntrepreneurProposals() {
    console.log('[Dashboard] loadEntrepreneurProposals → fetching...');
    try {
        const { data: proposals, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Dashboard] loadEntrepreneurProposals → error:', error); throw error; }
        console.log(`[Dashboard] loadEntrepreneurProposals → ${proposals?.length ?? 0} proposals fetched`);

        // My Proposals tab: all proposals
        displayProposals(proposals || [], 'allProposalsGrid');

        // Show empty state for My Proposals if none
        const myPropsEmpty = document.getElementById('myProposalsEmpty');
        if (myPropsEmpty) myPropsEmpty.style.display = (!proposals || proposals.length === 0) ? 'block' : 'none';

        // Recent Activity tab: mix of recent proposals + offers
        await loadRecentActivityTab(proposals || []);

    } catch (err) {
        console.error('[Dashboard] loadEntrepreneurProposals → ERROR:', err);
    }
}

async function loadRecentActivityTab(proposals) {
    console.log('[Dashboard] loadRecentActivityTab → building overview...');
    try {
        const propIds = proposals.map(p => p.id);

        // Fetch ALL pending offers (no limit — user needs to see all of them)
        let pendingOffers = [];
        if (propIds.length > 0) {
            const { data: offers } = await supabase
                .from('offers')
                .select('*, proposals(title), users:investor_id(full_name)')
                .in('proposal_id', propIds)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            pendingOffers = offers || [];
        }

        const container = document.getElementById('recentProposalsGrid');
        const emptyEl   = document.getElementById('overviewEmpty');
        if (!container) return;

        if (proposals.length === 0 && pendingOffers.length === 0) {
            container.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        // --- PENDING OFFERS SECTION (all of them) ---
        const offerCards = pendingOffers.map(o => `
            <div class="card" style="border-left:4px solid var(--shark-indigo)!important;display:flex;flex-direction:column;" onclick="window.location.href='offer-detail.html?id=${o.id}'" style="cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;">
                    <span style="font-size:.58rem;font-weight:900;color:var(--shark-indigo);text-transform:uppercase;letter-spacing:2px;">💰 Pending Offer</span>
                    <span style="background:#fef9c3;color:#854d0e;padding:3px 10px;border-radius:20px;font-size:.62rem;font-weight:800;text-transform:uppercase;border:1px solid #fde047;">Awaiting Response</span>
                </div>
                <h4 style="margin:0 0 .4rem;font-size:1.1rem;font-weight:800;color:var(--shark-obsidian);">₹${parseFloat(o.amount||0).toLocaleString('en-IN')}</h4>
                <div style="font-size:.78rem;color:#64748b;margin-bottom:.5rem;">📁 ${o.proposals?.title || 'Unknown'}</div>
                <div class="partner-strip" style="margin-bottom:.75rem;">
                    <div class="partner-avatar">${(o.users?.full_name||'?').charAt(0).toUpperCase()}</div>
                    <span style="font-size:.8rem;font-weight:700;">From: <strong>${o.users?.full_name||'Unknown Investor'}</strong></span>
                </div>
                <div style="font-size:.65rem;color:#94a3b8;margin-bottom:.75rem;">
                    ${o.equity_percentage ? `${o.equity_percentage}% equity · ` : ''}${new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </div>
                <div style="display:flex;gap:8px;margin-top:auto;">
                    <a href="offer-detail.html?id=${o.id}" class="btn btn-outline" style="flex:1;text-align:center;text-decoration:none;border-color:var(--shark-indigo);color:var(--shark-indigo);font-size:.8rem;" onclick="event.stopPropagation();">🔍 Full Terms</a>
                    <button onclick="event.stopPropagation();handleOffer('${o.id}','accept')" class="btn btn-primary" style="flex:1;background:#10b981;border:none;font-size:.8rem;">✓ Accept</button>
                    <button onclick="event.stopPropagation();handleOffer('${o.id}','reject')" class="btn btn-outline" style="flex:1;color:#ef4444;border-color:#ef4444;font-size:.8rem;">✗ Decline</button>
                </div>
            </div>`).join('');

        // --- MY PROPOSALS SECTION (latest 3) ---
        const recentProposals = proposals.slice(0, 3);
        const propCards = recentProposals.map(p => `
            <div class="card" style="border-left:4px solid var(--shark-gold)!important;display:flex;flex-direction:column;cursor:pointer;" onclick="window.location.href='proposal-details.html?id=${p.id}'">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;">
                    <span style="font-size:.58rem;font-weight:900;color:var(--shark-gold);text-transform:uppercase;letter-spacing:2px;">📁 Your Proposal</span>
                    <span style="${p.verified ? 'background:#dcfce7;color:#15803d;border:1px solid #86efac;' : 'background:#fef9c3;color:#854d0e;border:1px solid #fde047;'}padding:3px 10px;border-radius:20px;font-size:.62rem;font-weight:800;text-transform:uppercase;">${p.verified ? '✓ Live' : '⏳ Pending Review'}</span>
                </div>
                <h4 style="margin:0 0 .4rem;font-size:1.05rem;font-weight:800;color:var(--shark-obsidian);line-height:1.2;">${p.title}</h4>
                <div style="font-size:.78rem;color:#64748b;margin-bottom:.5rem;">🏷 ${p.category || 'General'}</div>
                <div class="f-nodes" style="margin-bottom:.75rem;">
                    <div class="f-node highlight">
                        <span class="f-label">Asking</span>
                        <span class="f-value" style="font-size:.9rem;">₹${parseFloat(p.amount_needed||0).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="f-node">
                        <span class="f-label">Equity</span>
                        <span class="f-value" style="font-size:.9rem;">${p.equity_offered}%</span>
                    </div>
                </div>
                <div style="margin-top:auto;">
                    <a href="proposal-details.html?id=${p.id}" class="btn btn-primary" style="display:block;text-align:center;text-decoration:none;font-size:.8rem;" onclick="event.stopPropagation();">View Proposal →</a>
                </div>
            </div>`).join('');

        // Show pending offers first (most actionable), then proposals
        container.innerHTML = offerCards + propCards;
        console.log('[Dashboard] loadRecentActivityTab → rendered', pendingOffers.length, 'pending offers +', recentProposals.length, 'proposals');
    } catch (err) {
        console.error('[Dashboard] loadRecentActivityTab → ERROR:', err);
    }
}

async function loadEntrepreneurOffers() {
    console.log('[Dashboard] loadEntrepreneurOffers → fetching...');
    try {
        // Get proposal IDs for this entrepreneur
        const { data: myProps, error: propErr } = await supabase
            .from('proposals')
            .select('id')
            .eq('user_id', currentUser.id);

        if (propErr) { console.error('[Dashboard] loadEntrepreneurOffers → proposals error:', propErr); throw propErr; }

        const propIds = (myProps || []).map(p => p.id);
        console.log(`[Dashboard] loadEntrepreneurOffers → proposal IDs: [${propIds.join(', ')}]`);

        if (propIds.length === 0) {
            console.warn('[Dashboard] loadEntrepreneurOffers → no proposals, showing empty state');
            const c = document.getElementById('offersContainer');
            if (c) c.innerHTML = getEmptyState('💼', 'No Proposals Yet', 'Submit a proposal to start receiving investment offers.');
            return;
        }

        // IMPORTANT JOIN EXPLANATION:
        //   proposals(title)              → gets proposal title for the card
        //   users:investor_id(full_name)  → gets the INVESTOR name (who sent the offer)
        //   displayOffers with role='entrepreneur' reads: offer.users.full_name for investor name
        const { data: offers, error: offerErr } = await supabase
            .from('offers')
            .select(`
                *,
                proposals ( title ),
                users:investor_id ( full_name )
            `)
            .in('proposal_id', propIds)
            .order('created_at', { ascending: false });

        if (offerErr) { console.error('[Dashboard] loadEntrepreneurOffers → offers error:', offerErr); throw offerErr; }
        console.log(`[Dashboard] loadEntrepreneurOffers → ${offers?.length ?? 0} offers fetched`);

        // role='entrepreneur' → shows investor name + Accept/Decline on pending + View Full on all
        displayOffers(offers || [], 'offersContainer', 'entrepreneur');

        // Show empty state if no offers
        const offersEmpty = document.getElementById('offersEmpty');
        if (offersEmpty) offersEmpty.style.display = (!offers || offers.length === 0) ? 'block' : 'none';
    } catch (err) {
        console.error('[Dashboard] loadEntrepreneurOffers → ERROR:', err);
    }
}

async function loadEntrepreneurDeals() {
    console.log('[Dashboard] loadEntrepreneurDeals → fetching...');
    try {
        // IMPORTANT JOIN EXPLANATION:
        //   proposals(title)                       → gets proposal title
        //   investor_profile:investor_id(full_name) → gets INVESTOR name
        //   displayDeals with viewerRole='entrepreneur' reads: deal.investor_profile.full_name
        const { data: deals, error } = await supabase
            .from('deals')
            .select(`
                *,
                proposals ( title ),
                investor_profile:investor_id ( full_name )
            `)
            .eq('entrepreneur_id', currentUser.id)
            .order('deal_date', { ascending: false });

        if (error) { console.error('[Dashboard] loadEntrepreneurDeals → error:', error); throw error; }
        console.log(`[Dashboard] loadEntrepreneurDeals → ${deals?.length ?? 0} deals fetched`);

        displayDeals(deals || [], 'dealsContainer', 'entrepreneur');

        // Show empty state if no deals
        const dealsEmpty = document.getElementById('dealsEmpty');
        if (dealsEmpty) dealsEmpty.style.display = (!deals || deals.length === 0) ? 'block' : 'none';
    } catch (err) {
        console.error('[Dashboard] loadEntrepreneurDeals → ERROR:', err);
    }
}

// Tab switch — Entrepreneur (single definition)
function switchEntrepreneurTab(tab, e) {
    console.log('[Dashboard] switchEntrepreneurTab →', tab);
    document.querySelectorAll('#entrepreneurDashboard .tab')
        .forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#entrepreneurDashboard .tab-content')
        .forEach(c => c.classList.remove('active'));

    const btn = e?.currentTarget || e?.target;
    if (btn) btn.classList.add('active');

    const tc = document.getElementById(`${tab}-tab`);
    if (tc) tc.classList.add('active');
    else console.warn(`[Dashboard] switchEntrepreneurTab → #${tab}-tab not found`);
}


// ============================================================
// INVESTOR DASHBOARD
// ============================================================
async function loadInvestorDashboard() {
    console.log('[Dashboard] loadInvestorDashboard → loading all sections...');
    await Promise.all([
        loadInvestorStats(),
        loadMarketplace(),
        loadInvestorOffers(),
        loadInvestorDeals(),
    ]);
    console.log('[Dashboard] loadInvestorDashboard → all sections loaded ✅');
}

async function loadInvestorStats() {
    console.log('[Dashboard] loadInvestorStats → fetching...');
    try {
        const { data: deals, error: dealErr } = await supabase
            .from('deals')
            .select('investment_amount')
            .eq('investor_id', currentUser.id);

        if (dealErr) console.warn('[Dashboard] loadInvestorStats → deals error:', dealErr);

        const { count: pendingOffers, error: pendErr } = await supabase
            .from('offers')
            .select('id', { count: 'exact', head: true })
            .eq('investor_id', currentUser.id)
            .eq('status', 'pending');

        if (pendErr) console.warn('[Dashboard] loadInvestorStats → pending offers error:', pendErr);

        const totalInvested = (deals || []).reduce((s, d) => s + parseFloat(d.investment_amount || 0), 0);
        const totalDeals    = (deals || []).length;

        console.log(`[Dashboard] loadInvestorStats → totalDeals: ${totalDeals}, totalInvested: ${totalInvested}, pendingOffers: ${pendingOffers}`);

        const safe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        safe('statTotalInvestments', totalDeals);
        safe('statAmountInvested',   '₹' + formatNumber(totalInvested));
        safe('statSuccessfulDeals',  totalDeals);
        safe('statAverageROI',       '0.0%'); // Update when revenue data is tracked

        console.log('[Dashboard] loadInvestorStats → stats rendered ✅');
    } catch (err) {
        console.error('[Dashboard] loadInvestorStats → ERROR:', err);
    }
}

async function loadMarketplace() {
    console.log('[Dashboard] loadMarketplace → fetching active verified proposals...');
    try {
        const { data: proposals, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('verified', true)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) { console.error('[Dashboard] loadMarketplace → error:', error); throw error; }
        console.log(`[Dashboard] loadMarketplace → ${proposals?.length ?? 0} proposals fetched`);

        // showInvestorView=true → shows "View & Invest", hides Edit button
        displayProposals(proposals || [], 'availableProposalsGrid', true);

        // Empty state
        const availEmpty = document.getElementById('availableEmpty');
        if (availEmpty) availEmpty.style.display = (!proposals || proposals.length === 0) ? 'block' : 'none';
    } catch (err) {
        console.error('[Dashboard] loadMarketplace → ERROR:', err);
    }
}

async function loadInvestorOffers() {
    console.log('[Dashboard] loadInvestorOffers → fetching ALL investor offers (no status filter)...');
    try {
        // FIX: NO .neq('status','accepted') — investors must see ALL their offers including accepted ones
        // IMPORTANT JOIN EXPLANATION:
        //   proposals(title, users:user_id(full_name)) → gets proposal title AND founder name
        //   displayOffers with role='investor' reads: offer.proposals.users.full_name for founder name
        const { data: offers, error } = await supabase
            .from('offers')
            .select(`
                *,
                proposals (
                    title,
                    users:user_id ( full_name )
                )
            `)
            .eq('investor_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Dashboard] loadInvestorOffers → error:', error); throw error; }
        console.log(`[Dashboard] loadInvestorOffers → ${offers?.length ?? 0} offers fetched`);

        // Debug: log each offer's status so we can verify all are showing
        (offers || []).forEach(o => {
            console.log(`[Dashboard] loadInvestorOffers → offer ${o.id}: status=${o.status}, proposal=${o.proposals?.title}, founder=${o.proposals?.users?.full_name}`);
        });

        // role='investor' → shows founder name, no Accept/Decline buttons
        displayOffers(offers || [], 'myOffersContainer', 'investor');

        // Empty state
        const myOffersEmpty = document.getElementById('myOffersEmpty');
        if (myOffersEmpty) myOffersEmpty.style.display = (!offers || offers.length === 0) ? 'block' : 'none';
    } catch (err) {
        console.error('[Dashboard] loadInvestorOffers → ERROR:', err);
    }
}

async function loadInvestorDeals() {
    console.log('[Dashboard] loadInvestorDeals → fetching...');
    try {
        // IMPORTANT JOIN EXPLANATION:
        //   proposals(title)                               → gets proposal title
        //   entrepreneur_profile:entrepreneur_id(full_name) → gets FOUNDER name
        //   displayDeals with viewerRole='investor' reads: deal.entrepreneur_profile.full_name
        const { data: deals, error } = await supabase
            .from('deals')
            .select(`
                *,
                proposals ( title ),
                entrepreneur_profile:entrepreneur_id ( full_name )
            `)
            .eq('investor_id', currentUser.id)
            .order('deal_date', { ascending: false });

        if (error) { console.error('[Dashboard] loadInvestorDeals → error:', error); throw error; }
        console.log(`[Dashboard] loadInvestorDeals → ${deals?.length ?? 0} deals fetched`);

        displayDeals(deals || [], 'myDealsContainer', 'investor');

        // Empty state
        const myDealsEmpty = document.getElementById('myDealsEmpty');
        if (myDealsEmpty) myDealsEmpty.style.display = (!deals || deals.length === 0) ? 'block' : 'none';
    } catch (err) {
        console.error('[Dashboard] loadInvestorDeals → ERROR:', err);
    }
}

// Tab switch — Investor (single definition)
function switchInvestorTab(tab, e) {
    console.log('[Dashboard] switchInvestorTab →', tab);
    document.querySelectorAll('#investorDashboard .tab')
        .forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#investorDashboard .tab-content')
        .forEach(c => c.classList.remove('active'));

    const btn = e?.currentTarget || e?.target;
    if (btn) btn.classList.add('active');

    const tc = document.getElementById(`${tab}-tab`);
    if (tc) tc.classList.add('active');
    else console.warn(`[Dashboard] switchInvestorTab → #${tab}-tab not found`);
}


// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function loadAdminDashboard() {
    console.log('[Dashboard] loadAdminDashboard → loading...');
    await Promise.all([
        loadAdminStats(),
        loadPendingUsers(),
        loadPendingProposals(),
    ]);
    console.log('[Dashboard] loadAdminDashboard → loaded ✅');
}

async function loadAdminStats() {
    console.log('[Dashboard] loadAdminStats → fetching...');
    try {
        const [
            { count: totalUsers,      error: e1 },
            { count: pendingUsers,    error: e2 },
            { count: pendingProps,    error: e3 },
            { count: totalProps,      error: e4 },
            { data:  deals,           error: e5 },
        ] = await Promise.all([
            supabase.from('users').select('id', { count:'exact', head:true }),
            supabase.from('users').select('id', { count:'exact', head:true }).eq('verified', false),
            supabase.from('proposals').select('id', { count:'exact', head:true }).eq('verified', false),
            supabase.from('proposals').select('id', { count:'exact', head:true }),
            supabase.from('deals').select('investment_amount'),
        ]);

        [e1,e2,e3,e4,e5].forEach((e, i) => { if (e) console.warn(`[Dashboard] loadAdminStats → query ${i+1} error:`, e); });

        const totalFunding = (deals || []).reduce((s, d) => s + parseFloat(d.investment_amount || 0), 0);

        const safe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        safe('statTotalUsers',           totalUsers || 0);
        safe('statPendingVerifications', (pendingUsers || 0) + (pendingProps || 0));
        safe('statTotalProposalsAdmin',  totalProps || 0);
        safe('statTotalFunding',         '₹' + formatNumber(totalFunding));

        console.log(`[Dashboard] loadAdminStats → users:${totalUsers}, pendingVerif:${(pendingUsers||0)+(pendingProps||0)}, totalFunding:${totalFunding}`);
    } catch (err) {
        console.error('[Dashboard] loadAdminStats → ERROR:', err);
    }
}

async function loadPendingUsers() {
    console.log('[Dashboard] loadPendingUsers → fetching...');
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Dashboard] loadPendingUsers → error:', error); throw error; }
        console.log(`[Dashboard] loadPendingUsers → ${users?.length ?? 0} pending users`);
        displayPendingUsers(users || []);
    } catch (err) {
        console.error('[Dashboard] loadPendingUsers → ERROR:', err);
    }
}

function displayPendingUsers(users) {
    const container = document.getElementById('pendingUsersContainer');
    if (!container) { console.warn('[Dashboard] displayPendingUsers → #pendingUsersContainer not found'); return; }

    if (!users.length) {
        container.innerHTML = getEmptyState('✅', 'All Clear', 'No users pending verification.');
        return;
    }

    container.innerHTML = users.map(u => `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:1rem;">
            <div>
                <strong>${u.full_name}</strong>
                <span style="display:block;font-size:.8rem;color:var(--shark-muted);">${u.email} — ${u.role}</span>
                <span style="font-size:.75rem;color:#94a3b8;">Joined ${formatDate(u.created_at)}</span>
            </div>
            <div style="display:flex;gap:8px;">
                <button onclick="verifyUser('${u.id}',true)"
                    class="btn btn-primary" style="background:#10b981;border:none;padding:.5rem 1rem;">✓ Verify</button>
                <button onclick="verifyUser('${u.id}',false)"
                    class="btn btn-outline" style="color:#ef4444;border-color:#ef4444;padding:.5rem 1rem;">✗ Reject</button>
            </div>
        </div>`).join('');
}

async function loadPendingProposals() {
    console.log('[Dashboard] loadPendingProposals → fetching...');
    try {
        const { data: proposals, error } = await supabase
            .from('proposals')
            .select('*, users:user_id(full_name, email)')
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Dashboard] loadPendingProposals → error:', error); throw error; }
        console.log(`[Dashboard] loadPendingProposals → ${proposals?.length ?? 0} pending proposals`);
        displayPendingProposals(proposals || []);
    } catch (err) {
        console.error('[Dashboard] loadPendingProposals → ERROR:', err);
    }
}

function displayPendingProposals(proposals) {
    const container = document.getElementById('pendingProposalsContainer');
    if (!container) { console.warn('[Dashboard] displayPendingProposals → #pendingProposalsContainer not found'); return; }

    if (!proposals.length) {
        container.innerHTML = getEmptyState('✅', 'All Clear', 'No proposals pending verification.');
        return;
    }

    container.innerHTML = proposals.map(p => `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:1rem;">
            <div>
                <strong>${p.title}</strong>
                <span style="display:block;font-size:.8rem;color:var(--shark-muted);">by ${p.users?.full_name || 'Unknown'}</span>
                <span style="font-size:.75rem;color:#94a3b8;">₹${formatNumber(p.amount_needed)} needed · ${p.category || 'N/A'}</span>
            </div>
            <div style="display:flex;gap:8px;">
                <button onclick="verifyProposal('${p.id}',true)"
                    class="btn btn-primary" style="background:#10b981;border:none;padding:.5rem 1rem;">✓ Approve</button>
                <button onclick="verifyProposal('${p.id}',false)"
                    class="btn btn-outline" style="color:#ef4444;border-color:#ef4444;padding:.5rem 1rem;">✗ Reject</button>
            </div>
        </div>`).join('');
}

// Admin actions
window.verifyUser = async function(userId, approve) {
    console.log(`[Dashboard] verifyUser → userId: ${userId}, approve: ${approve}`);
    if (!confirm(approve ? 'Verify this user?' : 'Reject this user?')) return;
    const { error } = await supabase
        .from('users')
        .update({ verified: approve, is_active: approve })
        .eq('id', userId);
    if (error) { console.error('[Dashboard] verifyUser → error:', error); showAlert('Error: ' + error.message, 'danger'); return; }
    showAlert(approve ? 'User verified!' : 'User rejected.', approve ? 'success' : 'warning');
    await loadPendingUsers();
};

window.verifyProposal = async function(proposalId, approve) {
    console.log(`[Dashboard] verifyProposal → id: ${proposalId}, approve: ${approve}`);
    if (!confirm(approve ? 'Approve this proposal?' : 'Reject this proposal?')) return;
    const { error } = await supabase
        .from('proposals')
        .update({ verified: approve, status: approve ? 'active' : 'closed' })
        .eq('id', proposalId);
    if (error) { console.error('[Dashboard] verifyProposal → error:', error); showAlert('Error: ' + error.message, 'danger'); return; }
    showAlert(approve ? 'Proposal approved and now live!' : 'Proposal rejected.', approve ? 'success' : 'warning');
    await loadPendingProposals();
};

// Tab switch — Admin (single definition)
function switchAdminTab(tab) {
    console.log('[Dashboard] switchAdminTab →', tab);
    document.querySelectorAll('#adminDashboard .tab')
        .forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .tab-content')
        .forEach(c => c.classList.remove('active'));

    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    const tc = document.getElementById(`${tab}-tab`);
    if (tc) tc.classList.add('active');
    else console.warn(`[Dashboard] switchAdminTab → #${tab}-tab not found`);
}


// ============================================================
// NOTIFICATIONS
// Handles the bell panel on dashboard.html
// toggleNotifications / toggleUserMenu / markAllNotificationsRead
// are defined in utils.js since they're also used by other pages
// ============================================================
async function loadNotifications() {
    console.log('[Dashboard] loadNotifications → fetching...');
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { console.warn('[Dashboard] loadNotifications → no user'); return; }

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) { console.error('[Dashboard] loadNotifications → error:', error); throw error; }

        const unread = (notifications || []).filter(n => !n.read).length;
        console.log(`[Dashboard] loadNotifications → ${notifications?.length} total, ${unread} unread`);

        // Update badge
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? 'block' : 'none';
        }

        // Update list
        const list = document.getElementById('notifList');
        if (!list) { console.warn('[Dashboard] loadNotifications → #notifList not found'); return; }

        if (!notifications || notifications.length === 0) {
            list.innerHTML = '<p style="padding:2rem;text-align:center;color:#94a3b8;font-size:.8rem;">No notifications yet</p>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <div onclick="handleNotifClick('${n.id}','${n.link || '#'}')"
                style="padding:.75rem 1rem;cursor:pointer;border-bottom:1px solid #f1f5f9;
                    background:${n.read ? '#fff' : '#f0f9ff'};"
                onmouseover="this.style.background='#f8fafc'"
                onmouseout="this.style.background='${n.read ? '#fff' : '#f0f9ff'}'">
                <strong style="font-size:.85rem;display:block;">${n.title}</strong>
                <span style="font-size:.78rem;color:var(--shark-muted);">${n.message}</span>
                <span style="font-size:.65rem;color:#94a3b8;display:block;margin-top:2px;">
                    ${new Date(n.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </span>
            </div>`).join('');
    } catch (err) {
        console.error('[Dashboard] loadNotifications → ERROR:', err);
    }
}

window.handleNotifClick = async function(id, link) {
    console.log(`[Dashboard] handleNotifClick → id: ${id}, link: ${link}`);
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (link && link !== '#' && link !== 'undefined') window.location.href = link;
    else loadNotifications();
};


// ============================================================
// SOVEREIGN CLOCK
// ============================================================
function startSovereignClock() {
    const clockEl = document.getElementById('bigClock');
    const dateEl  = document.getElementById('clockDate');
    if (!clockEl && !dateEl) { console.warn('[Dashboard] startSovereignClock → no clock elements found, skipping'); return; }

    function tick() {
        const now = new Date();
        if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
        if (dateEl)  dateEl.textContent  = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    }
    setInterval(tick, 1000);
    tick();
    console.log('[Dashboard] startSovereignClock → running ✅');
}


// ============================================================
// SUPPORT MODAL
// ============================================================
window.toggleSupportModal = function() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    else console.warn('[Dashboard] toggleSupportModal → #supportModal not found');
};


// ============================================================
// MOBILE LAYOUT PATCH
// ============================================================
!(function() {
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name    = 'viewport';
        meta.content = 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no';
        document.head.appendChild(meta);
    }
    const adjust = () => {
        const nav = document.querySelector('.nav-container');
        if (!nav) return;
        if (window.innerWidth < 900) {
            nav.style.gridTemplateColumns = '1fr auto';
            document.body.classList.add('mobile-mode');
        } else {
            nav.style.gridTemplateColumns = '';
            document.body.classList.remove('mobile-mode');
        }
    };
    window.addEventListener('resize', adjust);
    document.addEventListener('DOMContentLoaded', adjust);
})();


// ============================================================
// BOOT
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

console.log('✅ dashboard.js loaded — waiting for DOM...');