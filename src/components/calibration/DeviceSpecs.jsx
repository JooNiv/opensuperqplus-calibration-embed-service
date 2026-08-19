import React from 'react';

export const DeviceSpecs = ({ deviceData }) => (
    <div className="flex flex-col justify-start pb-8 text-[14px]">
        <p className="pb-2"><strong>Qubits:</strong> {deviceData.qubits}</p>
        <p className="pb-2"><strong>Basis gates:</strong> {deviceData.basis}</p>
        <p className="pb-2"><strong>Topology:</strong> {deviceData.topology}</p>
    </div>
);
