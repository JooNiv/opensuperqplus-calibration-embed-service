import React from 'react'
import { formatMetricValue } from '../../lib/formatMetricValue';

const QUBIT_SEGMENT = /^QB(\d+)$/;

// Sort on the numeric segments so ids that aren't QBx__QBy (e.g. VLQ's
// QBx__COMPR1 and QBx__COMPR1__QBanchor) still order sensibly.
const compareIds = (a, b) => {
    const numsA = (a.match(/\d+/g) || []).map(Number);
    const numsB = (b.match(/\d+/g) || []).map(Number);
    for (let i = 0; i < Math.max(numsA.length, numsB.length); i++) {
        const diff = (numsA[i] ?? -1) - (numsB[i] ?? -1);
        if (diff) return diff;
    }
    return a.localeCompare(b);
};

// Collapse the two orientations the backend may use for a qubit pair onto one row.
const normalizeId = (id) => {
    const match = id.match(/^QB(\d+)__QB(\d+)$/);
    if (!match) return id;
    const [low, high] = [Number(match[1]), Number(match[2])].sort((a, b) => a - b);
    return `QB${low}__QB${high}`;
};

// Ids of the same shape get their own table: QBx__COMPR1 and QBx__COMPR1__QBy
// are different kinds of coupler and carry disjoint metrics.
const shapeOf = (id) => id.split('__')
    .map(segment => (QUBIT_SEGMENT.test(segment) ? 'QB' : segment))
    .join(' ↔ ');

// A metric keyed on three or more plain qubits describes a group of qubits
// rather than a coupler between them.
const isMultiQubit = (id) => {
    const segments = id.split('__');
    return segments.length > 2 && segments.every(segment => QUBIT_SEGMENT.test(segment));
};

const multiQubitLabel = (id) => {
    const nums = id.split('__').map(segment => Number(segment.replace('QB', '')));
    const contiguous = nums.every((num, i) => i === 0 || num === nums[i - 1] + 1);
    return contiguous
        ? `QB${nums[0]}–QB${nums[nums.length - 1]} (${nums.length} qubits)`
        : `${nums.length} qubits`;
};

const lookupEntry = (calibrationData, metric, id) => {
    const entry = calibrationData[metric]?.[id];
    if (entry?.value !== null && entry?.value !== undefined) return entry;
    const match = id.match(/^QB(\d+)__QB(\d+)$/);
    if (match) {
        const flipped = calibrationData[metric]?.[`QB${match[2]}__QB${match[1]}`];
        if (flipped?.value !== null && flipped?.value !== undefined) return flipped;
    }
    return entry;
};

const Cell = ({ entry }) => (
    <td className='px-3 py-1.5 font-mono'>{entry?.value !== null && entry?.value !== undefined ? formatMetricValue(entry.value, entry.unit || '') : 'N/A'}</td>
);

const MetricTable = ({ ids, idMap, calibrationData, metrics, metricLabel }) => (
    <div className='overflow-x-auto'>
        <table className='w-full min-w-max border-collapse text-[14px]'>
            <thead>
                <tr>
                    <th className='border-b border-line-2 px-3 py-1.5 text-left font-bold'>ID</th>
                    {metrics.map(metric => (
                        <th className='border-b border-line-2 px-3 py-1.5 text-left font-bold' key={metric}>{metricLabel(metric)}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {ids.map(id => (
                    <tr key={id} className='border-b border-line-1'>
                        <td className='px-3 py-1.5 font-mono'>{id}</td>
                        {metrics.map(metric => (
                            <Cell key={`${id}-${metric}`} entry={lookupEntry(calibrationData, metric, idMap[id])} />
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Transposed: one column per qubit group, since a group's id is too long to
// read as a row label.
const MultiQubitTable = ({ ids, idMap, calibrationData, metrics, metricLabel }) => (
    <div className='overflow-x-auto'>
        <table className='w-full min-w-max border-collapse text-[14px]'>
            <thead>
                <tr>
                    <th className='border-b border-line-2 px-3 py-1.5 text-left font-bold'>Metric</th>
                    {ids.map(id => (
                        <th className='border-b border-line-2 px-3 py-1.5 text-left font-bold' key={id} title={idMap[id]}>{multiQubitLabel(id)}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {metrics.map(metric => (
                    <tr key={metric} className='border-b border-line-1'>
                        <td className='px-3 py-1.5'>{metricLabel(metric)}</td>
                        {ids.map(id => (
                            <Cell key={`${id}-${metric}`} entry={lookupEntry(calibrationData, metric, idMap[id])} />
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Render calibration data as a table
export const CalibrationTable = (props) => {

    const { calibrationData, qubitSwitch, qubitMetricOptions, couplerMetricOptions } = props;
    if (!calibrationData) return <p>No calibration data available</p>;

    const allMetrics = Object.keys(calibrationData);
    if (allMetrics.length === 0) return <p>No metrics available</p>;

    // Map normalized IDs to the actual IDs in the data
    const idMap = {};
    allMetrics.forEach(metric => {
        Object.keys(calibrationData[metric]).forEach(id => {
            if (id === 'statistics') return;
            if (qubitSwitch === id.includes('__')) return;
            idMap[normalizeId(id)] = id;
        });
    });

    const sortedIds = Object.keys(idMap).sort(compareIds);
    if (sortedIds.length === 0) return <p>No metrics available</p>;

    const metricLabel = (metric) =>
        qubitMetricOptions.find(m => m.value === metric)?.name ||
        couplerMetricOptions.find(m => m.value === metric)?.name ||
        metric;

    // Drop metrics that have no value for any of these IDs
    const metricsFor = (ids) => allMetrics.filter(metric => ids.some(id => {
        const value = lookupEntry(calibrationData, metric, idMap[id])?.value;
        return value !== null && value !== undefined;
    }));

    const multiQubitIds = qubitSwitch ? [] : sortedIds.filter(isMultiQubit);
    const groups = [];
    sortedIds.filter(id => !multiQubitIds.includes(id)).forEach(id => {
        const shape = shapeOf(id);
        const group = groups.find(g => g.shape === shape);
        if (group) group.ids.push(id);
        else groups.push({ shape, ids: [id] });
    });
    groups.sort((a, b) =>
        a.ids[0].split('__').length - b.ids[0].split('__').length || a.shape.localeCompare(b.shape));

    const tableProps = { idMap, calibrationData, metricLabel };

    return (
        <div className="flex flex-col gap-6">
            {groups.map(group => (
                <div key={group.shape} className='flex flex-col gap-2'>
                    <p className='font-bold text-[14px]'>{group.shape}</p>
                    <MetricTable {...tableProps} ids={group.ids} metrics={metricsFor(group.ids)} />
                </div>
            ))}
            {multiQubitIds.length > 0 && (
                <div className='flex flex-col gap-2'>
                    <p className='font-bold text-[14px]'>Multi-qubit metrics</p>
                    <MultiQubitTable {...tableProps} ids={multiQubitIds} metrics={metricsFor(multiQubitIds)} />
                </div>
            )}
        </div>
    );
};
