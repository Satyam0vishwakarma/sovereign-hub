// js/auth-guard.js

// Prepend with a semicolon to prevent errors if config.js is missing one
;window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});

(async function authGuardMain() {
    console.log("[AuthGuard] Security check started...");
    
    // Hide body immediately via CSS injection to prevent data leak
    const guardStyle = document.createElement('style');
    guardStyle.id = 'auth-guard-preloader';
    guardStyle.innerHTML = 'body { display: none !important; }';
    document.head.appendChild(guardStyle);

    try {
        // 1. Verify Supabase exists
        if (typeof supabase === 'undefined') {
            console.error("[AuthGuard] ERROR: Supabase library not found. Check script order in <head>.");
            if (guardStyle) guardStyle.remove();
            return;
        }

        // 2. Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        // 3. Determine Page
        const path = window.location.pathname;
        const page = path.split("/").pop().toLowerCase() || "index.html";
        
        // Rules
        const publicPages = ["index.html", "auth.html", "setup.html", "diagnostic.html"];
        const isPublicPage = publicPages.includes(page) || page === "";

        console.log(`[AuthGuard] On: ${page} | Logged In: ${!!session}`);

        if (session) {
            // Logged in: Don't allow seeing Home/Auth
            if (isPublicPage && page !== "setup.html" && page !== "diagnostic.html") {
                console.warn("[AuthGuard] Redirecting active user to Dashboard...");
                window.location.replace("dashboard.html");
                return;
            }
        } else {
            // Logged out: Don't allow seeing Private pages
            if (!isPublicPage) {
                console.error("[AuthGuard] Access Denied. Redirecting to Login...");
                window.location.replace("auth.html");
                return;
            }
        }

        // 4. All good? Show the body
        console.log("[AuthGuard] ✅ Access Granted");
        if (guardStyle) guardStyle.remove();

    } catch (err) {
        console.error("[AuthGuard] CRITICAL ERROR:", err);
        // Fail-safe: Show the page anyway so user isn't stuck on white screen
        if (guardStyle) guardStyle.remove();
    }
})();


// --- SOVEREIGN HUB SECURITY GUARD ---
async function protectPage() {
    const { data: { session } } = await supabase.auth.getSession();
    const path = window.location.pathname;

    // 1. Redirect to login if trying to access dashboard/admin while logged out
    if (!session && !path.includes('auth.html') && !path.includes('index.html')) {
        window.location.replace('auth.html');
        return;
    }

    // 2. Role Protection: Redirect non-admins away from admin.html
    if (session) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

        if (path.includes('admin.html') && profile.role !== 'admin') {
            window.location.replace('dashboard.html');
        }
    }
}
protectPage();