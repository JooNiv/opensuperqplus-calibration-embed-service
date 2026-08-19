// Checks that the Tuna-17 adapter normalises the placeholder data into the shape
// every component expects. Run it after pointing PUBLIC_TUNA17_BASE at the real
// Delft API (with the documents mirrored into public/data/tuna17/) to confirm the
// new payload still normalises correctly:
//
//   node scripts/check-tuna17-adapter.mjs
//
// No browser and no dependencies: the adapter's fetch is served from disk.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

globalThis.fetch = async (url) => {
    const body = await fs.readFile(path.join(root, 'public', String(url)), 'utf8');
    return { ok: true, status: 200, statusText: 'OK', json: async () => JSON.parse(body) };
};

const { calibration, deviceInfo } = await import(`${root}/src/lib/sources/tuna17.js`);
const device = { slug: 'tuna17', device_id: 'TUNA17', source: 'tuna17' };

const failures = [];
const check = (label, ok, detail = '') => {
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
    if (!ok) failures.push(label);
};

const cal = await calibration(device);
const info = await deviceInfo(device);
const metrics = cal.metrics;
const ids = (metric) => Object.keys(metrics[metric]).filter(id => id !== 'statistics');

console.log(`metrics: ${Object.keys(metrics).join(', ')}`);
console.log(`last calibrated: ${cal.quality_metric_set_end_timestamp}\n`);

check('every metric carries a statistics sibling',
    Object.values(metrics).every(m => typeof m.statistics?.median === 'number'));
check('statistics match the metric\'s own values', Object.entries(metrics).every(([name, metric]) => {
    const values = ids(name).map(id => metric[id].value).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle];
    return Math.abs(metric.statistics.median - median) < 1e-15;
}));
check('__labels__ never leaks into the id namespace',
    !Object.values(metrics).some(m => '__labels__' in m));
check('single-qubit ids are QB1..QB17',
    ids('t1').every(id => /^QB([1-9]|1[0-7])$/.test(id)) && ids('t1').length === 17,
    `${ids('t1').length} ids`);
check('coupler ids are QBa__QBb with the lower qubit first',
    ids('bell_state_fidelity').every(id => {
        const match = id.match(/^QB(\d+)__QB(\d+)$/);
        return match && Number(match[1]) < Number(match[2]);
    }) && ids('bell_state_fidelity').length === 24,
    `${ids('bell_state_fidelity').length} couplers`);
check('times are in seconds and fidelities dimensionless',
    metrics.t1.QB1.unit === 's' && metrics.t2_ramsey.QB1.unit === 's'
    && metrics.readout_qnd_fidelity.QB1.unit === '');
check('no uncertainty is emitted', Object.keys(metrics)
    .every(name => ids(name).every(id => !('uncertainty' in metrics[name][id]))));
check('a calibration timestamp was recovered',
    !Number.isNaN(new Date(cal.quality_metric_set_end_timestamp).getTime()),
    cal.quality_metric_set_end_timestamp);

// The layout's node and edge ids must all resolve against the calibration data,
// or qubits render grey and couplers lose their colour.
const { QC_LAYOUTS } = await import(`${root}/src/components/qc/layouts.js`);
const layout = QC_LAYOUTS.tuna17;
const qubitIds = new Set(ids('t1'));
const couplerIds = new Set(ids('bell_state_fidelity'));
check('every layout node has calibration data',
    layout.nodes.every(node => qubitIds.has(node.id)),
    layout.nodes.filter(n => !qubitIds.has(n.id)).map(n => n.id).join(',') || 'all matched');
check('every layout edge has a coupler metric', layout.edges.every(([a, b]) =>
    couplerIds.has(`${a}__${b}`) || couplerIds.has(`${b}__${a}`)));
check('every coupler metric has a layout edge', [...couplerIds].every(id => {
    const [a, b] = id.split('__');
    return layout.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}));

check('device info reports a job policy',
    Object.values(info.job_policy).every(value => typeof value === 'number'),
    JSON.stringify(info.job_policy));
check('device info topology matches the layout',
    info.architecture.operations.cz.length === layout.edges.length);

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(' | ')}` : 'all checks passed'}`);
process.exit(failures.length ? 1 : 0);
