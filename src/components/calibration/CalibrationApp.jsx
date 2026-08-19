import React, { useCallback, useRef, useState } from 'react';
import { QcLayout } from '../qc/QcLayout';
import { QC_LAYOUTS } from '../qc/layouts';
import { Overview } from './StatusOverview';
import { CalibrationTable } from './CalibrationTable';
import { SideBar } from './SideBar';
import { LoadingBlock, ErrorBlock } from './Loading';
import { Tabs, TabPanel } from '../ui/Tabs';
import { getDeviceMetricsConfig } from '../../lib/deviceMetrics';
import { loadCalibration, loadDeviceInfo } from '../../lib/sources';
import { useResource } from '../../hooks/useResource';
import { useEmbedHeight } from '../../hooks/useEmbedHeight';

const TABS = [
    { value: 'overview', label: 'Overview' },
    { value: 'layout', label: 'Layout' },
    { value: 'raw', label: 'Raw' },
];

// A host page can open the embed on a specific tab: /embed/q50?tab=layout
const initialTab = () => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return TABS.some(tab => tab.value === requested) ? requested : 'overview';
};

export const CalibrationApp = ({ device }) => {
    const root = useRef(null);
    useEmbedHeight(root);

    const calibrationLoader = useCallback((signal) => loadCalibration(device, signal), [device]);
    const deviceInfoLoader = useCallback((signal) => loadDeviceInfo(device, signal), [device]);

    const {
        data: calibrationDataAll,
        error: calibrationError,
        loading: calibrationLoading,
    } = useResource(calibrationLoader, [device.slug], {});
    const {
        data: deviceInfoData,
        error: infoError,
        loading: infoLoading,
    } = useResource(deviceInfoLoader, [device.slug], null);

    const dataLoading = calibrationLoading || infoLoading;
    const dataError = calibrationError || infoError;

    const [activeTab, setActiveTab] = useState(initialTab);

    const [metricsState, setMetricsState] = useState({
        qubitMetric: '',
        couplerMetric: '',
        // Slider positions, 0..1 along the worst→best range…
        thresholdQubit: 0.0,
        thresholdCoupler: 0.0,
        // …and the raw metric values they resolve to, which is what the layout
        // compares each qubit/coupler against.
        thresholdCouplerValue: 0.0,
        thresholdQubitValue: 0.0,
    });

    const [viewState, setViewState] = useState({
        rawDataType: { name: 'Calibration Data', value: 'calibration_data' },
        tableView: false,
        qubitSwitch: true,
    });

    const updateMetricsState = (key, value) => {
        setMetricsState((prevState) => ({ ...prevState, [key]: value }));
    };

    const updateViewState = (key, value) => {
        setViewState((prevState) => ({ ...prevState, [key]: value }));
    };

    const calibrationData = calibrationDataAll?.metrics;

    const lastCalibratedDate = new Date(calibrationDataAll?.quality_metric_set_end_timestamp);
    const lastCalibrated = Number.isNaN(lastCalibratedDate.getTime())
        ? null
        : lastCalibratedDate.toLocaleString();

    // device_id is the join key across the catalog, the API paths, QC_LAYOUTS and
    // the metrics config, so resolve the config from it rather than from the name a
    // backend happens to report.
    const deviceConfig = getDeviceMetricsConfig(device.device_id);
    const qubitMetricOptions = deviceConfig.qubitOptions || getDeviceMetricsConfig('default').qubitOptions;
    const couplerMetricOptions = deviceConfig.couplerOptions || getDeviceMetricsConfig('default').couplerOptions;

    const layout = QC_LAYOUTS[device.slug];

    return (
        <section ref={root} className='flex flex-col gap-4 bg-bg p-4 text-ink sm:p-6'>
            <header>
                <h1 className='text-[22px] font-bold'>{device.name}</h1>
            </header>

            <div className='grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4'>
                <SideBar
                    activeTab={activeTab}
                    metricsState={metricsState}
                    updateMetricsState={updateMetricsState}
                    viewState={viewState}
                    updateViewState={updateViewState}
                    calibrationDataAll={calibrationDataAll}
                    deviceInfoData={deviceInfoData}
                    calibrationLoading={calibrationLoading}
                    calibrationError={calibrationError}
                    dataLoading={dataLoading}
                    qubitMetricOptions={qubitMetricOptions}
                    couplerMetricOptions={couplerMetricOptions}
                    deviceData={device}
                />

                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                    items={TABS}
                    className='col-span-1 md:col-span-2 lg:col-span-3'
                >
                    <TabPanel value='overview' className='pt-4'>
                        {dataLoading ? (
                            <LoadingBlock label='Loading calibration data…' />
                        ) : (
                            <Overview
                                deviceInfoData={deviceInfoData}
                                device_id={device.device_id}
                                calibrationData={calibrationData}
                                calibrationError={calibrationError}
                                infoError={infoError}
                            />
                        )}
                    </TabPanel>

                    <TabPanel value='layout' className='pt-4'>
                        <div className='flex w-full items-center justify-center'>
                            {calibrationLoading ? (
                                <LoadingBlock label='Loading calibration data…' />
                            ) : calibrationError ? (
                                <ErrorBlock label='Calibration data is currently unavailable.' />
                            ) : layout ? (
                                <QcLayout
                                    layout={layout}
                                    metrics={{
                                        calibrationData,
                                        qubitMetric: metricsState.qubitMetric,
                                        couplerMetric: metricsState.couplerMetric,
                                        qubitMetricFormatted: qubitMetricOptions.find(m => m.value === metricsState.qubitMetric)?.name || metricsState.qubitMetric,
                                        couplerMetricFormatted: couplerMetricOptions.find(m => m.value === metricsState.couplerMetric)?.name || metricsState.couplerMetric,
                                        thresholdQubit: metricsState.thresholdQubitValue,
                                        thresholdCoupler: metricsState.thresholdCouplerValue,
                                    }}
                                />
                            ) : null}
                        </div>
                    </TabPanel>

                    <TabPanel value='raw' className='flex flex-col gap-4 pt-4'>
                        {dataLoading ? (
                            <LoadingBlock label='Loading raw data…' />
                        ) : dataError ? (
                            <ErrorBlock label='Raw data is currently unavailable.' />
                        ) : viewState.rawDataType.value === 'calibration_data' && viewState.tableView ? (
                            <CalibrationTable
                                calibrationData={calibrationData}
                                qubitSwitch={viewState.qubitSwitch}
                                qubitMetricOptions={qubitMetricOptions}
                                couplerMetricOptions={couplerMetricOptions}
                            />
                        ) : (
                            <pre className='max-h-[70vh] max-w-full overflow-auto rounded-sm border border-line-1 bg-bg-alt p-2 font-mono text-xs break-words whitespace-pre-wrap'>
                                {viewState.rawDataType.value === 'calibration_data'
                                    ? JSON.stringify(calibrationDataAll, null, 2)
                                    : JSON.stringify(deviceInfoData, null, 2)}
                            </pre>
                        )}
                    </TabPanel>
                </Tabs>
            </div>

            <footer className='border-t border-line-1 pt-3'>
                <p className='text-[14px]'>
                    <strong>Last calibrated:</strong>{' '}
                    {calibrationLoading ? 'Loading…' : lastCalibrated || 'Not available'}
                </p>
            </footer>
        </section>
    );
};
