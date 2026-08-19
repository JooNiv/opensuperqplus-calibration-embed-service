import React from 'react';
import { RadioGroup } from '../ui/RadioGroup';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { getCurrentRawData, copyToClipboard, downloadRawData } from '../../lib/sidebarUtils';

const DATA_TYPES = [
    { name: 'Calibration Data', value: 'calibration_data' },
    { name: 'Device Info', value: 'device_info' },
];

export const RawDataSwitcher = (props) => {

    const { viewState, updateViewState, calibrationDataAll, deviceInfoData, deviceData,
        copySuccess, setCopySuccess, dataLoading } = props;

    const currentRawData = () =>
        JSON.stringify(getCurrentRawData(viewState.rawDataType, calibrationDataAll, deviceInfoData), null, 2);

    const handleCopyToClipboard = async () => {
        await copyToClipboard(currentRawData(), setCopySuccess);
    };

    const handleDownloadRawData = () => {
        downloadRawData(currentRawData(), deviceData, viewState.rawDataType);
    };

    const showCalibrationOptions = viewState.rawDataType.value === 'calibration_data';

    return (
        <div>
            <p className='font-bold mb-[2px]'>Data Type:</p>
            <RadioGroup
                legend='Data type'
                items={DATA_TYPES}
                value={viewState.rawDataType}
                onChange={(item) => updateViewState('rawDataType', item)}
                inline={false}
            />
            {showCalibrationOptions &&
                <div className='mt-8 ml-2'>
                    <Switch
                        checked={viewState.tableView}
                        onChange={(checked) => updateViewState('tableView', checked)}
                    >
                        Table View
                    </Switch>
                </div>
            }
            {viewState.tableView && showCalibrationOptions &&
                <>
                    <div className='mt-2 ml-2 flex flex-col'>
                        <Switch
                            checked={viewState.qubitSwitch}
                            onChange={(checked) => updateViewState('qubitSwitch', checked)}
                        >
                            Qubits
                        </Switch>
                    </div>
                    <div className='mt-2 ml-2 flex flex-col'>
                        {/* Mirrors the Qubits switch: the two views are exclusive. */}
                        <Switch
                            checked={!viewState.qubitSwitch}
                            onChange={(checked) => updateViewState('qubitSwitch', !checked)}
                        >
                            Couplers
                        </Switch>
                    </div>
                </>
            }
            <div className='flex flex-col gap-2 mb-2 mt-8 mr-8'>
                <div className='flex flex-col gap-2'>
                    <Button
                        size="sm"
                        onClick={handleCopyToClipboard}
                        disabled={dataLoading}
                        className={`max-w-[200px] ${copySuccess ? '!bg-success !text-[#204303]' : ''}`}
                    >
                        {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                        size="sm"
                        className='max-w-[200px]'
                        disabled={dataLoading}
                        onClick={handleDownloadRawData}
                    >
                        Download
                    </Button>
                </div>
            </div>
        </div>
    )
}
