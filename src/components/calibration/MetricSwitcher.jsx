import React from 'react';
import { Select } from '../ui/Select';
import { Icon, HELP_CIRCLE_OUTLINE } from '../ui/Icon';
import { generateMetricGradient } from '../../lib/generateGradient';
import { formatMetricValue } from '../../lib/formatMetricValue';
import { getMetricStatistics } from '../../lib/sidebarUtils';
import { scaleEnds, unitLabel, toRawValue, toThresholdFraction } from '../../lib/metricScale';

const gradientBackground = (worst, best, average) => {
    const colors = generateMetricGradient(worst, best, average);
    const stops = [];
    for (let i = 0; i <= 10; i++) {
        const index = Math.floor((i / 10) * (colors.length - 1));
        stops.push(`${colors[index]} ${(i / 10) * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
};

// One metric selector plus its threshold controls, rendered once for qubits
// (dimension 1) and once for couplers (dimension 2).
const MetricControl = ({
    label,
    help,
    dimension,
    metric,
    options,
    calibrationData,
    thresholdFraction,
    inputValue,
    setInputValue,
    onMetricChange,
    onThresholdFractionChange,
    onThresholdValueChange,
}) => {
    const stats = metric ? getMetricStatistics(calibrationData, metric, dimension) : null;
    const ends = stats ? scaleEnds(metric, stats) : null;

    // Typing a threshold drives the slider: convert the displayed value back to a
    // raw one, then express it as a 0..1 position along the worst→best range.
    const handleInputChange = (event) => {
        setInputValue(event.target.value);
        const entered = parseFloat(event.target.value);
        if (isNaN(entered) || !stats) return;

        const rawValue = toRawValue(entered, stats.unit);
        onThresholdFractionChange(toThresholdFraction(rawValue, ends));
        onThresholdValueChange(rawValue);
    };

    return (
        <>
            <div>
                <div className='flex items-center gap-1'>
                    <p className='font-bold mb-[2px]'>{label}</p>
                    {help && <Icon path={HELP_CIRCLE_OUTLINE} title={help} className='text-ink/60' />}
                </div>
                <div className='py-2'>
                    <Select
                        label={label}
                        value={metric}
                        options={options}
                        placeholder='Choose metric'
                        onChange={onMetricChange}
                    />
                </div>
            </div>

            {metric && stats && (
                <div className='flex w-full flex-col items-center'>
                    <div className='mt-2 w-full'>
                        <div className='mb-1 flex w-full justify-between text-sm'>
                            <div className='flex flex-row items-center gap-1'>
                                <input
                                    type='number'
                                    step='any'
                                    aria-label={`${label} threshold`}
                                    className='w-20 rounded-sm border border-line-2 px-2 py-1 font-mono text-sm'
                                    value={inputValue}
                                    onChange={handleInputChange}
                                />
                                <span className='text-sm'>{unitLabel(stats.unit)}</span>
                            </div>
                        </div>
                        <div
                            className='relative my-2 h-6 w-full rounded-sm'
                            style={{ background: gradientBackground(ends.worst, ends.best, stats.average) }}
                        >
                            <input
                                type='range'
                                min='0'
                                max='1'
                                step='0.01'
                                aria-label={`${label} threshold slider`}
                                value={thresholdFraction}
                                onChange={(event) => onThresholdFractionChange(parseFloat(event.target.value))}
                                className='slider absolute top-0 left-0 h-full w-full cursor-pointer opacity-70'
                            />
                        </div>
                        <div className='mb-1 flex w-full justify-between text-sm'>
                            <span>
                                Worst:<br />
                                {formatMetricValue(ends.worst, stats.unit)}
                            </span>
                            <span>
                                Best:<br />
                                {formatMetricValue(ends.best, stats.unit)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const MetricSwitcher = (props) => {

    const { metricsState, updateMetricsState, calibrationData,
        qubitMetricOptions, couplerMetricOptions,
        qubitInputValue, setQubitInputValue,
        couplerInputValue, setCouplerInputValue } = props;

    // Picking a metric resets the threshold to the worst end of the new scale.
    const selectMetric = (metricKey, thresholdKey, setInputValue) => (value) => {
        updateMetricsState(metricKey, value || '');
        updateMetricsState(thresholdKey, 0);
        setInputValue('0');
    };

    return (
        <div className='sticky top-4'>
            <div className='max-h-[70vh] overflow-y-auto scroll-smooth pr-4'>
                <MetricControl
                    label='Qubit Metric:'
                    help='Hover over dropdown options for abbreviations.'
                    dimension={1}
                    metric={metricsState.qubitMetric}
                    options={qubitMetricOptions}
                    calibrationData={calibrationData}
                    thresholdFraction={metricsState.thresholdQubit}
                    inputValue={qubitInputValue}
                    setInputValue={setQubitInputValue}
                    onMetricChange={selectMetric('qubitMetric', 'thresholdQubit', setQubitInputValue)}
                    onThresholdFractionChange={(fraction) => updateMetricsState('thresholdQubit', fraction)}
                    onThresholdValueChange={(value) => updateMetricsState('thresholdQubitValue', value)}
                />

                <div className='mt-4'>
                    <MetricControl
                        label='Coupler Metric:'
                        dimension={2}
                        metric={metricsState.couplerMetric}
                        options={couplerMetricOptions}
                        calibrationData={calibrationData}
                        thresholdFraction={metricsState.thresholdCoupler}
                        inputValue={couplerInputValue}
                        setInputValue={setCouplerInputValue}
                        onMetricChange={selectMetric('couplerMetric', 'thresholdCoupler', setCouplerInputValue)}
                        onThresholdFractionChange={(fraction) => updateMetricsState('thresholdCoupler', fraction)}
                        onThresholdValueChange={(value) => updateMetricsState('thresholdCouplerValue', value)}
                    />
                </div>
            </div>
        </div>
    )
}
