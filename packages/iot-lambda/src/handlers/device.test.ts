import { Device, DeviceCreationInput, DeviceStatus, DeviceType } from 'iot-api';
import { RestContext, RestRequest } from 'iot-rest';
import { DeviceNotFoundError } from 'iot-spi';

import { handleRequest } from './device';

const requestContext = { requestId: 'request-1' };

const validCreateBody: Omit<DeviceCreationInput, 'tenantId'> = {
    name: 'Smart light',
    type: DeviceType.LIGHT,
    status: DeviceStatus.ONLINE,
    firmwareVersion: '24.5',
    location: 'kitchen',
    connectivity: {
        protocol: 'http' as const,
        ipAddress: '192.168.1.1',
        macAddress: '90:71:23:45:23:45'
    },
    state: {
        poweredOn: true
    },
    description: 'RGB light',
    metadata: {
        battery: '90%'
    }
};

function createDevice(id: string, tenantId = 'tenant-1'): Device {
    return {
        ...validCreateBody,
        id,
        tenantId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
}

function parseBody(response: { body: string }): any {
    return JSON.parse(response.body);
}

function buildContext(overrides: Partial<RestContext['deviceService']> = {}): RestContext {
    return {
        deviceService: {
            getDevice: jest.fn(),
            listDevices: jest.fn(),
            createDevice: jest.fn(),
            updateDevice: jest.fn(),
            deleteDevice: jest.fn(),
            ...overrides
        } as any,
        requestContext
    };
}

function request(method: string, path: string, body?: unknown): RestRequest {
    return {
        method,
        path,
        body: typeof body === 'string' ? body : body === undefined ? undefined : JSON.stringify(body)
    };
}

describe('handleRequest', () => {
    it('lists devices for the tenant in the path', async () => {
        const devices = [ createDevice('device-1') ];
        const listDevices = jest.fn().mockResolvedValue(devices);
        const context = buildContext({ listDevices } as any);

        const response = await handleRequest(request('GET', '/api/v1/tenant-1/devices'), context);

        expect(response.statusCode).toBe(200);
        expect(parseBody(response)).toEqual({ devices });
        expect(listDevices).toHaveBeenCalledWith('tenant-1', requestContext);
    });

    it('creates a device with tenantId from the path', async () => {
        const createdDevice = createDevice('device-1', 'tenant-from-path');
        const createDeviceMock = jest.fn().mockResolvedValue(createdDevice);
        const context = buildContext({ createDevice: createDeviceMock } as any);

        const response = await handleRequest(request('POST', '/api/v1/tenant-from-path/devices', validCreateBody), context);

        expect(response.statusCode).toBe(201);
        expect(parseBody(response)).toEqual(createdDevice);
        expect(createDeviceMock).toHaveBeenCalledWith({
            ...validCreateBody,
            tenantId: 'tenant-from-path'
        }, requestContext);
    });

    it('rejects invalid create payloads before calling the service', async () => {
        const createDeviceMock = jest.fn();
        const context = buildContext({ createDevice: createDeviceMock } as any);

        const response = await handleRequest(request('POST', '/api/v1/tenant-1/devices', {
            ...validCreateBody,
            type: 'camera',
            connectivity: {
                protocol: 'ftp',
                ipAddress: '999.1.1.1',
                macAddress: 'not-a-mac'
            },
            extra: true
        }), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [
                'extra is not allowed.',
                'type must be one of: thermostat, light, moisture_sensor, carbon_dioxide_sensor.',
                'connectivity.protocol must be one of: http, mqtt.',
                'connectivity.ipAddress must be a valid IPv4 address.',
                'connectivity.macAddress must be a valid MAC address.'
            ]
        });
        expect(createDeviceMock).not.toHaveBeenCalled();
    });

    it('rejects missing and malformed create payload fields', async () => {
        const createDeviceMock = jest.fn();
        const context = buildContext({ createDevice: createDeviceMock } as any);

        const response = await handleRequest(request('POST', '/api/v1/tenant-1/devices', {
            name: '',
            type: DeviceType.LIGHT,
            connectivity: 'not-an-object',
            state: 'not-an-object',
            metadata: [],
            description: ''
        }), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [
                'name must be a non-empty string.',
                'firmwareVersion is required.',
                'location is required.',
                'status must be one of: online, offline, maintenance, unknown.',
                'connectivity must be an object.',
                'description must be a non-empty string.',
                'state must be an object.',
                'metadata must be an object.'
            ]
        });
        expect(createDeviceMock).not.toHaveBeenCalled();
    });

    it('rejects create payloads missing connectivity', async () => {
        const createDeviceMock = jest.fn();
        const context = buildContext({ createDevice: createDeviceMock } as any);
        const { connectivity, ...body } = validCreateBody;

        const response = await handleRequest(request('POST', '/api/v1/tenant-1/devices', body), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [ 'connectivity is required.' ]
        });
        expect(createDeviceMock).not.toHaveBeenCalled();
        expect(connectivity).toBeDefined();
    });

    it('rejects create requests with non-object bodies', async () => {
        const createDeviceMock = jest.fn();
        const context = buildContext({ createDevice: createDeviceMock } as any);

        const response = await handleRequest(request('POST', '/api/v1/tenant-1/devices', []), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [ 'Request body must be an object.' ]
        });
        expect(createDeviceMock).not.toHaveBeenCalled();
    });

    it('gets a device by tenant and id from the path', async () => {
        const device = createDevice('device-1', 'tenant-1');
        const getDevice = jest.fn().mockResolvedValue(device);
        const context = buildContext({ getDevice } as any);

        const response = await handleRequest(request('GET', '/api/v1/tenant-1/devices/device-1'), context);

        expect(response.statusCode).toBe(200);
        expect(parseBody(response)).toEqual(device);
        expect(getDevice).toHaveBeenCalledWith({ id: 'device-1', tenantId: 'tenant-1' }, requestContext);
    });

    it('returns not found when a device does not exist', async () => {
        const context = buildContext({ getDevice: jest.fn().mockResolvedValue(undefined) } as any);

        const response = await handleRequest(request('GET', '/api/v1/tenant-1/devices/missing'), context);

        expect(response.statusCode).toBe(404);
        expect(parseBody(response)).toEqual({
            error: 'DeviceNotFound',
            message: "Device 'missing' not found."
        });
    });

    it('patches a device with path-owned tenant and device id', async () => {
        const updatedDevice = createDevice('device-1', 'tenant-1');
        const updateDevice = jest.fn().mockResolvedValue(updatedDevice);
        const context = buildContext({ updateDevice } as any);

        const response = await handleRequest(request('PATCH', '/api/v1/tenant-1/devices/device-1', {
            status: DeviceStatus.MAINTENANCE,
            connectivity: {
                protocol: 'mqtt',
                ipAddress: '10.0.0.2',
                macAddress: 'aa:bb:cc:dd:ee:ff'
            }
        }), context);

        expect(response.statusCode).toBe(200);
        expect(parseBody(response)).toEqual(updatedDevice);
        expect(updateDevice).toHaveBeenCalledWith(expect.objectContaining({
            id: 'device-1',
            tenantId: 'tenant-1',
            status: DeviceStatus.MAINTENANCE
        }), requestContext);
    });

    it('rejects empty patch payloads', async () => {
        const updateDevice = jest.fn();
        const context = buildContext({ updateDevice } as any);

        const response = await handleRequest(request('PATCH', '/api/v1/tenant-1/devices/device-1', {}), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [ 'At least one device field must be supplied.' ]
        });
        expect(updateDevice).not.toHaveBeenCalled();
    });

    it('rejects invalid patch payload fields', async () => {
        const updateDevice = jest.fn();
        const context = buildContext({ updateDevice } as any);

        const response = await handleRequest(request('PATCH', '/api/v1/tenant-1/devices/device-1', {
            name: '',
            type: 'camera',
            status: 'retired',
            firmwareVersion: '',
            location: '',
            connectivity: {
                protocol: 'ftp',
                ipAddress: 'abc.1.1.1',
                macAddress: 'not-a-mac',
                port: 1883
            },
            state: [],
            metadata: 'not-an-object',
            lastSeen: 123,
            description: '',
            extra: true
        }), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [
                'extra is not allowed.',
                'name must be a non-empty string.',
                'firmwareVersion must be a non-empty string.',
                'location must be a non-empty string.',
                'type must be one of: thermostat, light, moisture_sensor, carbon_dioxide_sensor.',
                'status must be one of: online, offline, maintenance, unknown.',
                'port is not allowed.',
                'connectivity.protocol must be one of: http, mqtt.',
                'connectivity.ipAddress must be a valid IPv4 address.',
                'connectivity.macAddress must be a valid MAC address.',
                'description must be a non-empty string.',
                'state must be an object.',
                'metadata must be an object.',
                'lastSeen must be a non-empty ISO timestamp string or null.'
            ]
        });
        expect(updateDevice).not.toHaveBeenCalled();
    });

    it('rejects patch requests with non-object bodies', async () => {
        const updateDevice = jest.fn();
        const context = buildContext({ updateDevice } as any);

        const response = await handleRequest(request('PATCH', '/api/v1/tenant-1/devices/device-1', []), context);

        expect(response.statusCode).toBe(400);
        expect(parseBody(response)).toEqual({
            error: 'ValidationError',
            messages: [ 'Request body must be an object.' ]
        });
        expect(updateDevice).not.toHaveBeenCalled();
    });

    it('deletes a device by tenant and id from the path', async () => {
        const device = createDevice('device-1', 'tenant-1');
        const deleteDevice = jest.fn().mockResolvedValue(device);
        const context = buildContext({ deleteDevice } as any);

        const response = await handleRequest(request('DELETE', '/api/v1/tenant-1/devices/device-1'), context);

        expect(response.statusCode).toBe(200);
        expect(parseBody(response)).toEqual({ device });
        expect(deleteDevice).toHaveBeenCalledWith({ id: 'device-1', tenantId: 'tenant-1' }, requestContext);
    });

    it('returns not found when deleting a missing device', async () => {
        const context = buildContext({ deleteDevice: jest.fn().mockResolvedValue(undefined) } as any);

        const response = await handleRequest(request('DELETE', '/api/v1/tenant-1/devices/missing'), context);

        expect(response.statusCode).toBe(404);
        expect(parseBody(response)).toEqual({
            error: 'DeviceNotFound',
            message: "Device 'missing' not found."
        });
    });

    it('returns invalid json for malformed request bodies', async () => {
        const response = await handleRequest(request('POST', '/api/v1/tenant-1/devices', '{'), buildContext());

        expect(response.statusCode).toBe(400);
        expect(parseBody(response).error).toBe('InvalidJson');
    });

    it('returns not found for unknown routes', async () => {
        const response = await handleRequest(request('GET', '/devices'), buildContext());

        expect(response.statusCode).toBe(404);
        expect(parseBody(response)).toEqual({ error: 'NotFound', message: 'Unknown route.' });
    });

    it('returns not found for unsupported methods on known routes', async () => {
        const response = await handleRequest(request('PUT', '/api/v1/tenant-1/devices/device-1', {}), buildContext());

        expect(response.statusCode).toBe(404);
        expect(parseBody(response)).toEqual({ error: 'NotFound', message: 'Unknown route.' });
    });

    it('maps DeviceNotFoundError thrown by the service to a 404', async () => {
        const context = buildContext({
            updateDevice: jest.fn().mockRejectedValue(new DeviceNotFoundError('Device was not found.', {
                id: 'device-1',
                tenantId: 'tenant-1'
            }))
        } as any);

        const response = await handleRequest(request('PATCH', '/api/v1/tenant-1/devices/device-1', {
            status: DeviceStatus.OFFLINE
        }), context);

        expect(response.statusCode).toBe(404);
        expect(parseBody(response)).toEqual({
            error: 'DeviceNotFound',
            message: 'Device was not found.'
        });
    });

    it('maps unexpected service errors to a 500', async () => {
        const context = buildContext({
            listDevices: jest.fn().mockRejectedValue(new Error('database unavailable'))
        } as any);

        const response = await handleRequest(request('GET', '/api/v1/tenant-1/devices'), context);

        expect(response.statusCode).toBe(500);
        expect(parseBody(response)).toEqual({
            error: 'InternalServerError',
            message: 'database unavailable'
        });
    });
});
