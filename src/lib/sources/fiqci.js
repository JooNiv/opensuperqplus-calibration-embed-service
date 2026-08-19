// FiQCI backend adapter (VTT Q50, and any other IQM device served by it).
//
// The backend already emits the canonical shape this app is built around:
//   data.metrics[metricName][id] = { unit, value, timestamp, … }
//   data.metrics[metricName].statistics = { average, median }
// so this adapter only unwraps the { status, message, data } envelope.
import { getJson } from './http.js';

const API_BASE_URL = import.meta.env?.PUBLIC_FIQCI_API || 'https://fiqci-backend.2.rahtiapp.fi';

export const calibration = async (device, signal) => {
    const result = await getJson(`${API_BASE_URL}/device/${device.slug}/calibration`, signal);
    return result?.data ?? {};
};

export const deviceInfo = async (device, signal) => {
    const result = await getJson(`${API_BASE_URL}/device/${device.slug}`, signal);
    return result?.data ?? null;
};
