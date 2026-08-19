// Delft Tuna-17 adapter.
//
// Tuna-17's backend publishes a different shape from FiQCI's: metrics are flat
// maps of raw numbers keyed q0…q16, two-qubit metrics are nested one level, and
// there are no units, timestamps or statistics. This adapter normalises all of
// that into the canonical shape (see sources/fiqci.js) so every component in the
// app is backend-agnostic:
//
//   { q0: 0.99 }                  ->  { QB0: { unit, value, timestamp } }
//   { q0: { q1: 0.98 } }          ->  { QB0__QB1: { unit, value, timestamp } }
//   (nothing)                     ->  statistics: { average, median }
//
// PUBLIC_TUNA17_BASE currently points at the bundled placeholder snapshot in
// public/data/tuna17/. Pointing it at the real Delft API is the only change
// needed once that exists — provided it serves the same documents.
import { getJson } from './http.js';

const BASE = import.meta.env?.PUBLIC_TUNA17_BASE || '/data/tuna17';

// Everything Tuna-17 reports is either a time in seconds or a dimensionless
// fidelity. formatMetricValue renders 's' as µs and '' as a percentage.
const METRIC_UNITS = {
    t1: 's',
    t2_ramsey: 's',
    t2_echo: 's',
};

// q0 -> QB0. Tuna-17's own qubit numbers are kept as-is (unlike FiQCI's), so a
// QB id in the UI reads the same as the qubit index Delft publishes.
const qubitNumber = (key) => Number(String(key).replace(/^q/i, ''));
const qubitId = (key) => `QB${qubitNumber(key)}`;

// Coupler ids are written lowest qubit first. QcLayout and CalibrationTable both
// tolerate either ordering, but emitting one consistently keeps the raw view tidy.
const couplerId = (a, b) => {
    const [low, high] = [qubitNumber(a), qubitNumber(b)].sort((x, y) => x - y);
    return `QB${low}__QB${high}`;
};

// A Mongo ObjectId's leading 4 bytes are its creation time in seconds. It is the
// only timestamp in the payload, so it stands in for the calibration date.
const oidTimestamp = (oid) => {
    if (typeof oid !== 'string' || oid.length < 8) return null;
    const seconds = Number.parseInt(oid.slice(0, 8), 16);
    return Number.isNaN(seconds) ? null : new Date(seconds * 1000).toISOString();
};

// Synthesised per metric, over that metric's own values. Every Tuna-17 metric is
// purely single-qubit or purely two-qubit, so a single block per metric is exact
// (unlike upstream statistics for metrics that mix both).
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

const isTwoQubitMetric = (payload) => (payload.__labels__ || []).length >= 2;

const normalizeMetric = (payload, unit, timestamp) => {
    const entries = {};
    if (isTwoQubitMetric(payload)) {
        for (const [first, inner] of Object.entries(payload)) {
            if (first === '__labels__' || !inner || typeof inner !== 'object') continue;
            for (const [second, value] of Object.entries(inner)) {
                entries[couplerId(first, second)] = { unit, value, timestamp };
            }
        }
    } else {
        for (const [qubit, value] of Object.entries(payload)) {
            if (qubit === '__labels__') continue;
            entries[qubitId(qubit)] = { unit, value, timestamp };
        }
    }
    return { ...entries, statistics: statisticsOf(entries) };
};

export const calibration = async (device, signal) => {
    const document = await getJson(`${BASE}/calibration.json`, signal);
    const record = Array.isArray(document) ? document[0] : document;
    if (!record) return {};

    const timestamp = oidTimestamp(record._id?.$oid);
    const metrics = {};
    for (const [name, payload] of Object.entries(record)) {
        if (name === '_id' || !payload || typeof payload !== 'object') continue;
        metrics[name] = normalizeMetric(payload, METRIC_UNITS[name] ?? '', timestamp);
    }

    return {
        metrics,
        // Drives the "Last calibrated" footer.
        quality_metric_set_end_timestamp: timestamp,
        calibration_set_end_timestamp: timestamp,
    };
};

export const deviceInfo = async (device, signal) => {
    const record = await getJson(`${BASE}/static.json`, signal);
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
