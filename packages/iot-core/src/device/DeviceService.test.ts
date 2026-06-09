import { Device, DeviceCreationInput, DeviceStatus, DeviceType, DeviceUpdateInput } from 'iot-api';
import { DeviceNotFoundError, DeviceStorage, RequestContext } from 'iot-spi';

import { DeviceService } from './DeviceService';

jest.mock('uuid', () => {
    return {
        v1: jest.fn(() => 'generated-device-id')
    };
});

const context: RequestContext = { requestId: 'request-1' };

function createStorage(overrides: Partial<DeviceStorage> = {}): DeviceStorage {
    return {
        getDevice: jest.fn(),
        getDevices: jest.fn(),
        createDevice: jest.fn(async device => device),
        updateDevice: jest.fn(async device => device),
        deleteDevice: jest.fn(),
        ...overrides
    };
}

function createDevice(overrides: Partial<Device> = {}): Device {
    return {
        id: 'device-1',
        tenantId: 'tenant-1',
        name: 'Smart light',
        type: DeviceType.LIGHT,
        status: DeviceStatus.ONLINE,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        firmwareVersion: '24.5',
        location: 'kitchen',
        connectivity: {
            protocol: 'http',
            ipAddress: '192.168.1.1',
            macAddress: '90:71:23:45:23:45'
        },
        state: {
            poweredOn: true
        },
        metadata: {
            battery: '90%'
        },
        ...overrides
    };
}

describe('DeviceService', () => {
    it('delegates listDevices with tenantId', async () => {
        const devices = [ createDevice() ];
        const storage = createStorage({ getDevices: jest.fn().mockResolvedValue(devices) });
        const service = new DeviceService({ deviceStorage: storage });

        await expect(service.listDevices('tenant-1', context)).resolves.toEqual(devices);

        expect(storage.getDevices).toHaveBeenCalledWith('tenant-1', context);
    });

    it('creates devices with generated id and timestamps', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
        const storage = createStorage();
        const service = new DeviceService({ deviceStorage: storage });
        const input: DeviceCreationInput = {
            tenantId: 'tenant-1',
            name: 'Smart light',
            type: DeviceType.LIGHT,
            status: DeviceStatus.ONLINE,
            firmwareVersion: '24.5',
            location: 'kitchen',
            connectivity: {
                protocol: 'http',
                ipAddress: '192.168.1.1',
                macAddress: '90:71:23:45:23:45'
            },
            state: {
                poweredOn: true
            }
        };

        const device = await service.createDevice(input, context);

        expect(device).toEqual({
            ...input,
            id: 'generated-device-id',
            createdAt: '2026-06-11T12:00:00.000Z',
            updatedAt: '2026-06-11T12:00:00.000Z'
        });
        expect(storage.createDevice).toHaveBeenCalledWith(device, context);
        jest.useRealTimers();
    });

    it('merges nested objects when updating a device', async () => {
        const existing = createDevice({
            connectivity: {
                protocol: 'http',
                ipAddress: '192.168.1.1',
                macAddress: '90:71:23:45:23:45'
            },
            state: {
                poweredOn: true,
                brightness: 60
            },
            metadata: {
                battery: '90%',
                room: 'kitchen'
            }
        });
        const storage = createStorage({ getDevice: jest.fn().mockResolvedValue(existing) });
        const service = new DeviceService({ deviceStorage: storage });
        const input: DeviceUpdateInput = {
            id: 'device-1',
            tenantId: 'tenant-1',
            status: DeviceStatus.MAINTENANCE,
            connectivity: {
                protocol: 'mqtt',
                ipAddress: '10.0.0.2',
                macAddress: '90:71:23:45:23:45'
            },
            state: {
                poweredOn: false
            },
            metadata: {
                battery: '80%'
            }
        };

        const updated = await service.updateDevice(input, context);

        expect(updated).toEqual({
            ...existing,
            ...input,
            connectivity: {
                protocol: 'mqtt',
                ipAddress: '10.0.0.2',
                macAddress: '90:71:23:45:23:45'
            },
            state: {
                poweredOn: false,
                brightness: 60
            },
            metadata: {
                battery: '80%',
                room: 'kitchen'
            }
        });
        expect(storage.updateDevice).toHaveBeenCalledWith(updated, context);
    });

    it('throws DeviceNotFoundError when updating a missing device', async () => {
        const storage = createStorage({ getDevice: jest.fn().mockResolvedValue(undefined) });
        const service = new DeviceService({ deviceStorage: storage });

        await expect(service.updateDevice({
            id: 'missing',
            tenantId: 'tenant-1',
            status: DeviceStatus.OFFLINE
        }, context)).rejects.toThrow(DeviceNotFoundError);

        expect(storage.updateDevice).not.toHaveBeenCalled();
    });
});
