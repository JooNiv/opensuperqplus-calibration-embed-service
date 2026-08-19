// Sidebar helpers: raw-data selection, clipboard/download, and the worst/best/
// average/median summary that drives the gradient legend and the threshold slider.

export const getCurrentRawData = (rawDataType, calibrationDataAll, deviceInfoData) => {
    return rawDataType.value === 'calibration_data' ? calibrationDataAll : deviceInfoData;
};

export const copyToClipboard = async (data, setCopySuccess) => {
    try {
        await navigator.clipboard.writeText(data);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
};

export const downloadRawData = (data, deviceData, rawDataType) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deviceData.device_id.toLowerCase()}_${rawDataType.value}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const median = (sorted) => {
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

// `qubits` selects which ids a metric's statistics are computed over:
//   1 = single-qubit ids (QB1), 2 = coupler ids (QB1__QB2), anything else = all.
// '__' is the only discriminator between the two in the calibration payload.
export const getMetricStatistics = (calibrationData, metric, qubits = null) => {
    if (!calibrationData || !metric || !calibrationData[metric]) {
        return null;
    }

    const metricData = calibrationData[metric];
    const ids = Object.keys(metricData).filter((id) => {
        if (id === 'statistics') return false;
        if (qubits == 1) return !id.includes('__');
        if (qubits == 2) return id.includes('__');
        return true;
    });

    const values = ids
        .map(id => metricData[id]?.value)
        .filter(value => value !== null && value !== undefined && !isNaN(value))
        .sort((a, b) => a - b);

    if (values.length === 0) return null;

    // Prefer the backend's own statistics, but fall back to locally computed ones:
    // they are absent for some metrics, and for a metric holding both single-qubit
    // and coupler ids the backend average mixes the two.
    const reported = metricData.statistics;
    const useReported = reported
        && typeof reported.average === 'number'
        && typeof reported.median === 'number'
        && values.length === Object.keys(metricData).filter(id => id !== 'statistics').length;

    return {
        worst: values[0],
        best: values[values.length - 1],
        average: useReported ? reported.average : values.reduce((sum, value) => sum + value, 0) / values.length,
        median: useReported ? reported.median : median(values),
        unit: ids.map(id => metricData[id]).find(item => item?.unit)?.unit || '',
    };
};
