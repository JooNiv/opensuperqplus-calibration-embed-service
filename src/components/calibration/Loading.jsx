import React from 'react';
import { Spinner } from '../ui/Spinner';

export const LoadingBlock = (props) => (
    <div className={`flex items-center justify-center gap-3 py-8 ${props.className || ''}`}>
        <Spinner size={24} width={2} />
        <p className='text-[14px] text-ink/60'>{props.label || 'Loading…'}</p>
    </div>
);

export const ErrorBlock = (props) => (
    <div className={`flex items-center justify-center py-8 ${props.className || ''}`}>
        <p className='text-[14px] text-alert'>{props.label || 'Data is currently unavailable.'}</p>
    </div>
);
