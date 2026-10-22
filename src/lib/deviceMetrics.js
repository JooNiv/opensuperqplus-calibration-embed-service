// Per-device metric catalog.
//
// Metric keys stay exactly as each backend publishes them; `name` is the shared
// UI label, so the same quantity reads identically across devices (Q50's
// `t1_time` and Tuna-17's `t1` both show as "T1 Time"). `name` is used by the
// sidebar dropdowns, the layout tooltip and the raw table headers.
//
// `title` is a hover explanation on the dropdown option — it carries the
// abbreviation expansions, and the measurement technique wherever two backends
// arrive at a shared label by different routes.
//
// `overview.*` values are ordered fallback lists: pickMetricData returns the
// first key present in the payload, so a renamed upstream metric can be listed
// alongside its legacy name. Use { title, keys } instead of a bare list where the
// device needs its own row title.

// Delft Tuna devices (Quantum Inspire metrics API). Keys are the ones that API
// publishes; the labels are shared with Q50 wherever the two measure the same
// quantity. Options a device does not report are hidden by the sidebar.
//
// Bell state fidelity is deliberately NOT labelled "CZ Gate Fidelity": it is a
// prepared-state fidelity, not an interleaved-RB gate fidelity, so sharing the
// label would misreport what was measured. It is still a coupler metric and is
// rendered on the couplers exactly like Q50's CZ fidelity.
const QUANTUM_INSPIRE_METRICS = {
    overview: {
        single: {
            singleGateFidelity: ['average_single_qubit_gate_fidelity'],
            readoutFidelity: ['readout_assignment_fidelity'],
            t1: ['t1'],
            t2: ['t2_ramsey'],
        },
        coupler: {
            twoQubitFidelity: { title: 'Median Bell state fidelity', keys: ['bell_state_fidelity'] },
            cliffordFidelity: [],
        },
    },
    qubitOptions: [
        { name: 'T1 Time', value: 't1' },
        { name: 'T2 Time', value: 't2_ramsey', title: 'Measured by a Ramsey experiment' },
        { name: 'T2 Echo Time', value: 't2_echo' },
        { name: 'Single-Qubit Gate Fidelity', value: 'average_single_qubit_gate_fidelity', title: 'Averaged over the single-qubit gate set' },
        { name: 'Readout Fidelity', value: 'readout_assignment_fidelity', title: 'Readout assignment fidelity' },
        { name: 'QNDness Fidelity', value: 'readout_qnd_fidelity', title: 'QND = Quantum Non-Demolition' },
        { name: 'Initialization Fidelity', value: 'initialization_fidelity' },
    ],
    couplerOptions: [
        { name: 'Bell State Fidelity', value: 'bell_state_fidelity', title: 'Fidelity of a Bell state prepared on the coupled pair' },
    ],
};

export const DEVICE_METRICS = {
    default: {
        overview: {
            single: {
                singleGateFidelity: ['prx_rb_drag_crf_sx_fidelity', 'prx_rb_drag_crf_fidelity', 'prx_rb_fidelity'],
                readoutFidelity: ['measure_fidelity_ssro_constant_fidelity', 'measure_ssro_fidelity'],
                t1: ['t1_time', 't1'],
                t2: ['t2_time', 't2_ramsey'],
            },
            coupler: {
                twoQubitFidelity: ['cz_irb_crf_crf_fidelity', 'cz_irb_fidelity'],
                cliffordFidelity: ['clifford_rb_uz_cz_fidelity', 'clifford_rb_fidelity'],
            },
        },
        qubitOptions: [
            { name: 'T1 Time', value: 't1_time' },
            { name: 'T2 Time', value: 't2_time' },
            { name: 'T2 Echo Time', value: 't2_echo_time' },
            { name: 'Single-Qubit Gate Fidelity', value: 'prx_rb_drag_crf_sx_fidelity', title: 'PRX randomized benchmarking' },
            { name: 'Clifford Gate Fidelity', value: 'clifford_rb_xy_fidelity' },
            { name: 'Readout Fidelity', value: 'measure_fidelity_ssro_constant_fidelity' },
            { name: '1->0 Readout Error', value: 'measure_fidelity_ssro_constant_error_1_to_0' },
            { name: '0->1 Readout Error', value: 'measure_fidelity_ssro_constant_error_0_to_1' },
            { name: 'MCM Fidelity', value: 'measure_ssro_constant_fidelity', title: 'MCM = Mid Circuit Measurement' },
            { name: '1->0 MCM Error', value: 'measure_ssro_constant_error_1_to_0', title: 'MCM = Mid Circuit Measurement' },
            { name: '0->1 MCM Error', value: 'measure_ssro_constant_error_0_to_1', title: 'MCM = Mid Circuit Measurement' },
            { name: 'QNDness Fidelity', value: 'measure_qndness_constant_fidelity', title: 'QND = Quantum Non-Demolition' },
            { name: 'QNDness 0 State', value: 'measure_qndness_constant_qndness_0', title: 'QND = Quantum Non-Demolition' },
            { name: 'QNDness 1 State', value: 'measure_qndness_constant_qndness_1', title: 'QND = Quantum Non-Demolition' },
            { name: 'QNDness Repeatability', value: 'measure_qndness_constant_repeatability', title: 'QND = Quantum Non-Demolition' },
        ],
        couplerOptions: [
            { name: 'CZ Gate Fidelity', value: 'cz_irb_crf_crf_fidelity' },
            { name: 'Clifford Gate Fidelity', value: 'clifford_rb_uz_cz_fidelity' },
        ],
    },

    Q50: {
        overview: {
            single: {
                singleGateFidelity: ['prx_rb_drag_crf_sx_fidelity', 'prx_rb_fidelity'],
                readoutFidelity: ['measure_fidelity_ssro_constant_fidelity', 'measure_ssro_fidelity'],
                t1: ['t1_time'],
                t2: ['t2_time'],
            },
            coupler: {
                twoQubitFidelity: ['cz_irb_crf_crf_fidelity', 'cz_irb_fidelity'],
                cliffordFidelity: ['clifford_rb_uz_cz_fidelity', 'clifford_rb_fidelity'],
            },
        },
        qubitOptions: [
            { name: 'T1 Time', value: 't1_time' },
            { name: 'T2 Time', value: 't2_time' },
            { name: 'T2 Echo Time', value: 't2_echo_time' },
            { name: 'Single-Qubit Gate Fidelity', value: 'prx_rb_drag_crf_sx_fidelity', title: 'PRX randomized benchmarking (DRAG CRF SX)' },
            { name: 'Clifford Gate Fidelity', value: 'clifford_rb_xy_sx_fidelity' },
            { name: 'Readout Fidelity', value: 'measure_fidelity_ssro_constant_fidelity', title: 'Single-shot readout assignment fidelity' },
            { name: '1->0 Readout Error', value: 'measure_fidelity_ssro_constant_error_1_to_0' },
            { name: '0->1 Readout Error', value: 'measure_fidelity_ssro_constant_error_0_to_1' },
            { name: 'MCM Fidelity', value: 'measure_ssro_constant_fidelity', title: 'MCM = Mid Circuit Measurement' },
            { name: '1->0 MCM Error', value: 'measure_ssro_constant_error_1_to_0', title: 'MCM = Mid Circuit Measurement' },
            { name: '0->1 MCM Error', value: 'measure_ssro_constant_error_0_to_1', title: 'MCM = Mid Circuit Measurement' },
            { name: 'QNDness Fidelity', value: 'measure_qndness_constant_fidelity', title: 'QND = Quantum Non-Demolition' },
            { name: 'QNDness 0 State', value: 'measure_qndness_constant_qndness_0', title: 'QND = Quantum Non-Demolition' },
            { name: 'QNDness 1 State', value: 'measure_qndness_constant_qndness_1', title: 'QND = Quantum Non-Demolition' },
            { name: 'QNDness Repeatability', value: 'measure_qndness_constant_repeatability', title: 'QND = Quantum Non-Demolition' },
        ],
        couplerOptions: [
            { name: 'CZ Gate Fidelity', value: 'cz_irb_crf_crf_fidelity', title: 'Interleaved randomized benchmarking of the CZ gate' },
            { name: 'Clifford Gate Fidelity', value: 'clifford_rb_uz_cz_fidelity' },
        ],
    },

    TUNA9: QUANTUM_INSPIRE_METRICS,
    TUNA17: QUANTUM_INSPIRE_METRICS,
};

export const getDeviceMetricsConfig = (deviceKey = '') => {
    if (DEVICE_METRICS[deviceKey]) return DEVICE_METRICS[deviceKey];
    // Case-insensitive so a slug like "tuna17" resolves the "TUNA17" config.
    const key = Object.keys(DEVICE_METRICS)
        .find(k => k.toLowerCase() === String(deviceKey).toLowerCase());
    return (key && DEVICE_METRICS[key]) || DEVICE_METRICS.default;
};

export const pickMetricData = (calibrationData, keys = []) => {
    for (const key of keys) {
        if (calibrationData?.[key]) {
            return { key, data: calibrationData[key] };
        }
    }
    return null;
};

export const getMetricUnit = (metricData) => {
    if (!metricData) return '';
    for (const key in metricData) {
        if (metricData[key]?.unit) return metricData[key].unit;
    }
    return '';
};
