// Backend registry. Every adapter returns the same canonical shapes, so adding a
// device on a new backend means adding one module here and one catalog entry —
// no component changes.
import * as fiqci from './fiqci.js';
import * as tuna17 from './tuna17.js';

const SOURCES = { fiqci, tuna17 };

const sourceFor = (device) => {
    const source = SOURCES[device?.source];
    if (!source) throw new Error(`Unknown data source "${device?.source}"`);
    return source;
};

export const loadCalibration = (device, signal) => sourceFor(device).calibration(device, signal);

export const loadDeviceInfo = (device, signal) => sourceFor(device).deviceInfo(device, signal);
