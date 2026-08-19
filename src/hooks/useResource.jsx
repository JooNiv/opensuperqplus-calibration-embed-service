import { useEffect, useState } from 'react';

// One hook for every remote read, replacing the FiQCI site's three near-identical
// useCalibration/useDeviceInfo/useStatus hooks. Differences from those:
//   - the caller supplies the initial value (an object, not [], so
//     `data.metrics` is never read off an array)
//   - the loader rejects on non-2xx (see sources/http.js)
//   - an AbortController cancels the in-flight request when deps change or the
//     component unmounts, so a late response can't overwrite a newer one
export const useResource = (loader, deps = [], initialValue = null) => {
    const [data, setData] = useState(initialValue);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setLoading(true);
        loader(controller.signal)
            .then((result) => {
                if (!active) return;
                setData(result ?? initialValue);
                setError(null);
            })
            .catch((err) => {
                if (!active || err?.name === 'AbortError') return;
                console.error(err);
                setError(err);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, error, loading };
};
