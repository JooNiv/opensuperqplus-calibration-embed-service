import React, { useState, useEffect } from 'react';
import { DeviceSpecs } from './DeviceSpecs';
import { MetricSwitcher } from './MetricSwitcher';
import { RawDataSwitcher } from './RawDataSwitcher';
import { getMetricStatistics } from '../../lib/sidebarUtils';
import { scaleEnds, toDisplayValue, toThresholdValue } from '../../lib/metricScale';
import { LoadingBlock, ErrorBlock } from './Loading';

export const SideBar = (props) => {
    const {
        activeTab,
        metricsState,
        updateMetricsState,
        viewState,
        updateViewState,
        calibrationDataAll,
        deviceInfoData,
        calibrationLoading,
        calibrationError,
        dataLoading,
        qubitMetricOptions,
        couplerMetricOptions,
        deviceData,
    } = props;

    const calibrationData = calibrationDataAll?.metrics;

    const [qubitInputValue, setQubitInputValue] = useState('');
    const [couplerInputValue, setCouplerInputValue] = useState('');

    const [copySuccess, setCopySuccess] = useState(false);

    // The slider stores a 0..1 fraction; the layout compares against a raw metric
    // value, so resolve one from the other whenever the metric or slider moves.
    const syncThreshold = (metric, dimension, fraction, valueKey, setInputValue) => {
        if (!metric || !calibrationData) return;
        const stats = getMetricStatistics(calibrationData, metric, dimension);
        if (!stats) return;

        const thresholdValue = toThresholdValue(fraction, scaleEnds(metric, stats));
        updateMetricsState(valueKey, thresholdValue);
        setInputValue(toDisplayValue(thresholdValue, stats.unit));
    };

    useEffect(() => {
        syncThreshold(metricsState.qubitMetric, 1, metricsState.thresholdQubit, 'thresholdQubitValue', setQubitInputValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metricsState.qubitMetric, metricsState.thresholdQubit]);

    useEffect(() => {
        syncThreshold(metricsState.couplerMetric, 2, metricsState.thresholdCoupler, 'thresholdCouplerValue', setCouplerInputValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metricsState.couplerMetric, metricsState.thresholdCoupler]);

    return (
        <div className='flex flex-col pb-4 md:mr-[50px] border-b-2 md:border-b-0 md:border-r-2 border-line-2 col-span-1'>
            <DeviceSpecs deviceData={deviceData} />

            {activeTab === 'layout' && (
                calibrationLoading ? (
                    <LoadingBlock label='Loading metrics…' />
                ) : calibrationError ? (
                    <ErrorBlock label='Metrics are currently unavailable.' />
                ) : (
                    <MetricSwitcher
                        metricsState={metricsState}
                        updateMetricsState={updateMetricsState}
                        calibrationData={calibrationData}
                        // Only offer metrics this device actually reports.
                        qubitMetricOptions={qubitMetricOptions.filter(opt =>
                            Object.prototype.hasOwnProperty.call(calibrationData ?? {}, opt.value)
                        )}
                        couplerMetricOptions={couplerMetricOptions.filter(opt =>
                            Object.prototype.hasOwnProperty.call(calibrationData ?? {}, opt.value)
                        )}
                        qubitInputValue={qubitInputValue}
                        setQubitInputValue={setQubitInputValue}
                        couplerInputValue={couplerInputValue}
                        setCouplerInputValue={setCouplerInputValue}
                    />
                )
            )}
            {activeTab === 'raw' &&
                <RawDataSwitcher
                    dataLoading={dataLoading}
                    viewState={viewState}
                    updateViewState={updateViewState}
                    calibrationDataAll={calibrationDataAll}
                    deviceInfoData={deviceInfoData}
                    deviceData={deviceData}
                    copySuccess={copySuccess}
                    setCopySuccess={setCopySuccess}
                />
            }
        </div>
    )
}
