// How a metric's scale is oriented and displayed. Shared by the sidebar's
// threshold effects and the metric controls so the two cannot drift apart.

// Metrics whose name contains "error" are better when lower, so the worst and best
// ends of the scale swap. This is the same rule QcLayout applies when colouring.
export const scaleEnds = (metric, stats) => (metric.includes('error')
    ? { worst: stats.best, best: stats.worst }
    : { worst: stats.worst, best: stats.best });

export const unitLabel = (unit) => (unit === 's' ? 'μs' : (unit === '' || unit === '%') ? '%' : unit);

// Values are stored raw and displayed in the units the rest of the UI uses:
// seconds as μs, dimensionless fidelities as percentages.
export const toDisplayValue = (value, unit) => {
    if (unit === 's') return (value * 1e6).toFixed(2);
    if (unit === '' || unit === '%') return (value * 100).toFixed(2);
    return value.toFixed(3);
};

export const toRawValue = (displayValue, unit) => {
    if (unit === 's') return displayValue / 1e6;
    if (unit === '' || unit === '%') return displayValue / 100;
    return displayValue;
};

// Position of a raw value along the worst→best range, clamped to the slider's 0..1.
export const toThresholdFraction = (rawValue, ends) => {
    const range = parseFloat(ends.best) - parseFloat(ends.worst);
    const fraction = (rawValue - parseFloat(ends.worst)) / range;
    return Math.max(0, Math.min(1, fraction));
};

// The raw value a slider position corresponds to.
export const toThresholdValue = (fraction, ends) =>
    parseFloat(ends.worst) + fraction * (parseFloat(ends.best) - parseFloat(ends.worst));
