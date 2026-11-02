// Wraps fetch for protected endpoints: if the access token has expired,
// refresh once and retry the original request.
const AUTH_URL = 'http://localhost:4000';

let refreshPromise = null;

// Shared across concurrent calls so simultaneous 401s trigger only one refresh.
function refreshSession() {
    if (!refreshPromise) {
        refreshPromise = fetch(`${AUTH_URL}/token`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(res => res.ok)
            .catch(() => false)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

async function apiFetch(url, options = {}) {
    const opts = { ...options, credentials: 'include' };

    const res = await fetch(url, opts);
    if (res.status !== 401) return res;

    const refreshed = await refreshSession();
    if (!refreshed) {
        window.location.href = '/login';
        return res;
    }
    return fetch(url, opts); // retry once
}