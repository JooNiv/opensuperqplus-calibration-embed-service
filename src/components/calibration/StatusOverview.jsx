import React from 'react';
import { getDeviceMetricsConfig, pickMetricData, getMetricUnit } from '../../lib/deviceMetrics';


const parseResultMedian = (data, unit) => {
    if (!data || !data?.median) {
        return null;
    }
    if (unit === '') {
        return (Number.parseFloat(data?.median) * 100).toFixed(2);
    } else if (unit === 's') {
        return (Number.parseFloat(data?.median) * 1e6).toFixed(0);
    } else {
        return (Number.parseFloat(data?.median) * 100).toFixed(2);
    }
}

const Section = (props) => (
    <div className='col-span-1'>
        <p className="pb-2 text-[18px]"><strong>{props.title}</strong></p>
        {props.children}
        <div className="h-4" />
    </div>
)

const MetricRows = (props) => (
    <>
        {props.metrics.map((metric) => (
            <div key={metric.key} className="flex pb-2 gap-2">
                <p className="text-[14px]">
                    {metric.title}: <strong>
                        {metric.value}
                        {metric.unit === 's' ? <> &#x03BC;s</> : metric.unit ? metric.unit : '%'}
                    </strong>
                </p>
            </div>
        ))}
    </>
)

const Unavailable = () => <p className="text-[14px]">Not available</p>

export const Overview = (props) => {

    const calibrationData = props.calibrationData;
    const deviceInfoData = props.deviceInfoData;
    const limitationsData = deviceInfoData?.job_policy || {};

    const { overview } = getDeviceMetricsConfig(props.device_id);

    // Failed fetch gets a message; an untracked metric is just omitted.
    const calibrationUnavailable = !!props.calibrationError
        || !calibrationData
        || Object.keys(calibrationData).length === 0;
    const limitationsUnavailable = !!props.infoError || !deviceInfoData;

    // `spec` is either a list of candidate metric keys or { title, keys } when the
    // device needs a row title of its own.
    const buildMetric = (key, defaultTitle, spec) => {
        const { title = defaultTitle, keys = spec } = Array.isArray(spec) ? {} : (spec || {});
        const entry = pickMetricData(calibrationData, keys);
        const unit = getMetricUnit(entry?.data) || '%';
        return {
            key,
            title,
            value: parseResultMedian(entry?.data?.statistics, unit),
            unit,
        };
    };

    const qubitMetrics = [
        buildMetric('median-prx', 'Median single-qubit gate fidelity', overview?.single?.singleGateFidelity),
        buildMetric('median-readout-fidelity', 'Median readout fidelity', overview?.single?.readoutFidelity),
        buildMetric('median-t1', 'Median T1 time', overview?.single?.t1),
        buildMetric('median-t2', 'Median T2 time', overview?.single?.t2),
    ].filter(metric => metric.value !== null);

    const couplerMetrics = [
        buildMetric('median-2-qubit', 'Median 2-qubit gate fidelity', overview?.coupler?.twoQubitFidelity),
        buildMetric('median-clifford', 'Median Clifford gate fidelity', overview?.coupler?.cliffordFidelity),
    ].filter(metric => metric.value !== null);

    const limitations = [
        { key: 'max-circuits', title: 'Max circuits per batch', value: limitationsData?.max_number_circuits_per_batch },
        { key: 'max-shots', title: 'Max shots per job', value: limitationsData?.max_number_shots_per_job },
        { key: 'max-queue', title: 'Max jobs in queue', value: limitationsData?.max_queue_length },
    ].filter(limitation => limitation.value !== null && limitation.value !== undefined);

    const sections = [];

    if (calibrationUnavailable) {
        sections.push(
            <Section key='calibration' title='Calibration Metrics:'>
                <Unavailable />
            </Section>
        );
    } else {
        if (qubitMetrics.length > 0) {
            sections.push(
                <Section key='qubit' title='Qubit Metrics:'>
                    <MetricRows metrics={qubitMetrics} />
                </Section>
            );
        }
        if (couplerMetrics.length > 0) {
            sections.push(
                <Section key='coupler' title='Coupler Metrics:'>
                    <MetricRows metrics={couplerMetrics} />
                </Section>
            );
        }
    }

    if (limitationsUnavailable) {
        sections.push(
            <Section key='limitations' title='Limitations:'>
                <Unavailable />
            </Section>
        );
    } else if (limitations.length > 0) {
        sections.push(
            <Section key='limitations' title='Limitations:'>
                {limitations.map(limitation => (
                    <div key={limitation.key} className="flex pb-2 gap-2">
                        <p className="text-[14px]">{limitation.title}: </p>
                        <p className="text-[14px]"><strong>{limitation.value}</strong></p>
                    </div>
                ))}
            </Section>
        );
    }

    if (sections.length === 0) {
        return (
            <div className='col-span-1 md:col-span-2 lg:col-span-3'>
                <p className='text-[14px]'>No device data is currently available.</p>
            </div>
        )
    }

    return (
        <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 col-span-1 md:col-span-2 lg:col-span-3">
            {sections}
        </div>
    )
}
