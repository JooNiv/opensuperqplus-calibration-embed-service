export const formatMetricValue = (value, unit) => {
    if (value === null || value === undefined) return 'N/A';

    if (unit === 's') {
        // Convert seconds to appropriate unit
        return `${(value * 1e6).toFixed(2)}μs`;
    } else if (unit === '' || unit === '%') {
        // Assume percentage/fidelity
        return `${(value * 100).toFixed(2)}%`;
    }
    return value.toFixed(3);
};