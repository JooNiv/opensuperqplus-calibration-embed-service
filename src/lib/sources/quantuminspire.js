// Quantum Inspire adapter (Delft Tuna-9, Tuna-17, and any other QI backend type).
//
// Two public APIs, both fetched directly by the browser (CORS is `*` on both):
//   - static data:  GET {PUBLIC_QI_API}/backend_types/            -> deviceInfo
//   - metrics:      GET {PUBLIC_QI_METRICS_API}/metrics/{id}/latest -> calibration
// Each catalog entry's `backend_type_id` joins the two.
//
// The metrics API returns one time series per metric and qubit/pair, with no
// units or statistics. This adapter normalises that into the canonical shape
// (see sources/fiqci.js) so every component in the app is backend-agnostic:

import { getJson } from './http.js';

const API_BASE = import.meta.env?.PUBLIC_QI_API || 'https://api.quantuminspire.com';
const METRICS_BASE = import.meta.env?.PUBLIC_QI_METRICS_API || 'https://metrics.quantuminspire.com';

// Everything Tuna reports is either a time in seconds or a dimensionless
// fidelity. formatMetricValue renders 's' as µs and '' as a percentage.
const METRIC_UNITS = {
    t1: 's',
    t2_ramsey: 's',
    t2_echo: 's',
};

// q0 -> QB0. Tuna qubits keep their own numbers, so a QB id in
// the UI reads the same as the qubit index Quantum Inspire publishes.
const qubitNumber = (key) => Number(String(key).replace(/^q/i, ''));

// Coupler ids are written lowest qubit first. QcLayout and CalibrationTable both
// tolerate either ordering, but emitting one consistently keeps the raw view tidy.
const couplerId = (a, b) => {
    const [low, high] = [qubitNumber(a), qubitNumber(b)].sort((x, y) => x - y);
    return `QB${low}__QB${high}`;
};

// One dimension is a qubit, two are a coupler. Only the dimension values are
// read, so this does not depend on how the labels are spelled (qubit1/qubit2…).
const seriesId = (dimensions = {}) => {
    const qubits = Object.values(dimensions);
    if (qubits.some(qubit => Number.isNaN(qubitNumber(qubit)))) return null;
    if (qubits.length === 1) return `QB${qubitNumber(qubits[0])}`;
    if (qubits.length === 2) return couplerId(qubits[0], qubits[1]);
    return null;
};

const latestPoint = (points = []) => points.reduce(
    (latest, point) => (!latest || point.timestamp > latest.timestamp ? point : latest),
    null,
);

// Synthesised per metric, over that metric's own values. Every Tuna metric is
// purely single-qubit or purely two-qubit, so a single block per metric is exact.
const statisticsOf = (entries) => {
    const values = Object.values(entries)
        .map(entry => entry?.value)
        .filter(value => typeof value === 'number' && !Number.isNaN(value))
        .sort((a, b) => a - b);
    if (values.length === 0) return { average: null, median: null };
    const middle = Math.floor(values.length / 2);
    return {
        average: values.reduce((sum, value) => sum + value, 0) / values.length,
        median: values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle],
    };
};

export const calibration = async (device, signal) => {
    const document = await getJson(`${METRICS_BASE}/metrics/${device.backend_type_id}/latest`, signal);

    const metrics = {};
    let newest = null;
    for (const { name, series = [] } of document?.metrics || []) {
        const unit = METRIC_UNITS[name] ?? '';
        const entries = {};
        for (const { dimensions, points } of series) {
            const id = seriesId(dimensions);
            const point = latestPoint(points);
            if (!id || !point) continue;
            entries[id] = { unit, value: point.value, timestamp: point.timestamp };
            if (!newest || point.timestamp > newest) newest = point.timestamp;
        }
        if (Object.keys(entries).length) metrics[name] = { ...entries, statistics: statisticsOf(entries) };
    }

    return {
        metrics,
        // Drives the "Last calibrated" footer: the newest point across all metrics.
        quality_metric_set_end_timestamp: newest,
        calibration_set_end_timestamp: newest,
    };
};

const fetchBackendType = async (id, signal) => {
    for (let page = 1, pages = 1; page <= pages; page += 1) {
        const result = await getJson(`${API_BASE}/backend_types/?page=${page}`, signal);
        const match = (result?.items || []).find(item => item.id === id);
        if (match) return match;
        pages = result?.pages ?? 1;
    }
    return null;
};

export const deviceInfo = async (device, signal) => {
    const record = await fetchBackendType(device.backend_type_id, signal);
    if (!record) return null;

    // Topology arrives as directed index pairs; collapse to unique couplers and
    // map to the QB ids used everywhere else.
    const couplers = [...new Set((record.topology || [])
        .map(([a, b]) => couplerId(`q${a}`, `q${b}`)))]
        .map(id => id.split('__'));

    return {
        name: record.name,
        slug: device.slug,
        short_description: record.description,
        architecture: {
            name: record.name,
            qubits: Array.from({ length: record.nqubits || 0 }, (_, i) => `QB${i}`),
            operations: { cz: couplers },
            computational_resonators: [],
        },
        gateset: record.gateset,
        available: record.enabled ?? null,
        status: record.status ?? null,
        // Named to match the FiQCI /device response so StatusOverview reads it unchanged.
        job_policy: {
            max_number_circuits_per_batch: record.max_jobs_per_batch_job ?? null,
            max_number_shots_per_job: record.max_number_of_shots ?? null,
            max_queue_length: record.batchjobs_per_queue_limit ?? null,
        },
        default_number_of_shots: record.default_number_of_shots ?? null,
        job_execution_time_limit: record.job_execution_time_limit ?? null,
    };
};
