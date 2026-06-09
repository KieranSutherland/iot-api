import { Device, DeviceKeyInput } from 'iot-api';

import { RequestContext } from '../context';

/**
 * Indicates that the requested device was not found.
 */
export class DeviceNotFoundError extends Error {
    constructor(message: string, public readonly key: DeviceKeyInput) {
        super(message);
        this.name = 'DeviceNotFoundError';
    }
}

/**
 * Handles storage operations for device entities.
 */
export interface DeviceStorage {
    getDevice(key: DeviceKeyInput, context: RequestContext): Promise<Device | undefined>;
    getDevices(tenantId: string, context: RequestContext): Promise<Device[]>;
    createDevice(device: Device, context: RequestContext): Promise<Device>;
    updateDevice(device: Device, context: RequestContext): Promise<Device>;
    deleteDevice(key: DeviceKeyInput, context: RequestContext): Promise<Device | undefined>;
}
