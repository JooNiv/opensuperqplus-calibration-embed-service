// Shared fetch helper for every source adapter: rejects on a non-2xx response
// (the FiQCI site's hooks did not check resp.ok, so a 404 silently read as
// "no data") and forwards the AbortSignal owned by useResource.
export const getJson = async (url, signal) => {
    const resp = await fetch(url, { signal });
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText} — ${url}`);
    return resp.json();
};
