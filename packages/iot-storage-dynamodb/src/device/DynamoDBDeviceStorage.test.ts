import 'aws-sdk-client-mock-jest';

import { AwsStub, mockClient } from 'aws-sdk-client-mock';
import { Device, DeviceStatus, DeviceType } from 'iot-api';
import { DeviceNotFoundError, RequestContext } from 'iot-spi';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ScanCommand,
    ServiceInputTypes,
    ServiceOutputTypes,
    UpdateCommand
} from '@aws-sdk/lib-dynamodb';

import { buildPrimaryKey, DynamoDBDeviceStorage } from './DynamoDBDeviceStorage';

const TABLE_NAME = 'devices-table';
const context: RequestContext = { requestId: 'request-1' };

function createDevice(overrides: Partial<Device> = {}): Device {
    return {
        id: 'device 1',
        tenantId: 'tenant/1',
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
        ...overrides
    };
}

describe('DynamoDBDeviceStorage', () => {
    let documentClient: DynamoDBDocumentClient;
    let mockDocumentClient: AwsStub<ServiceInputTypes, ServiceOutputTypes, unknown>;
    let storage: DynamoDBDeviceStorage;

    beforeEach(() => {
        documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-1' }));
        mockDocumentClient = mockClient(documentClient);
        mockDocumentClient.reset();
        storage = new DynamoDBDeviceStorage({
            documentClient,
            tableName: TABLE_NAME
        });
    });

    it('builds encoded primary keys', () => {
        expect(buildPrimaryKey({ tenantId: 'tenant/1', id: 'device 1' })).toBe('device:tenant%2F1:device%201');
    });

    it('gets a device by composite key', async () => {
        const device = createDevice();
        mockDocumentClient.on(GetCommand).resolves({
            Item: {
                data: device
            }
        });

        await expect(storage.getDevice(device, context)).resolves.toEqual(device);

        expect(mockDocumentClient).toHaveReceivedCommandWith(GetCommand, {
            TableName: TABLE_NAME,
            Key: {
                PK: 'device:tenant%2F1:device%201',
                SK: 'metadata#tenant%2F1'
            }
        });
    });

    it('returns undefined when a device is missing', async () => {
        mockDocumentClient.on(GetCommand).resolves({});

        await expect(storage.getDevice({ tenantId: 'tenant-1', id: 'missing' }, context)).resolves.toBeUndefined();
    });

    it('scans devices for a tenant', async () => {
        const devices = [ createDevice({ id: 'device-1' }), createDevice({ id: 'device-2' }) ];
        mockDocumentClient.on(ScanCommand).resolves({
            Items: devices.map(device => ({ data: device }))
        });

        await expect(storage.getDevices('tenant/1', context)).resolves.toEqual(devices);

        expect(mockDocumentClient).toHaveReceivedCommandWith(ScanCommand, {
            TableName: TABLE_NAME,
            ProjectionExpression: '#data',
            FilterExpression: '#data.#tenantId = :tenantId',
            ExpressionAttributeNames: {
                '#data': 'data',
                '#tenantId': 'tenantId'
            },
            ExpressionAttributeValues: {
                ':tenantId': 'tenant/1'
            }
        });
    });

    it('creates devices with PK and SK attributes', async () => {
        const device = createDevice();
        mockDocumentClient.on(PutCommand).resolves({});

        await expect(storage.createDevice(device, context)).resolves.toEqual(device);

        expect(mockDocumentClient).toHaveReceivedCommandWith(PutCommand, {
            TableName: TABLE_NAME,
            Item: {
                PK: 'device:tenant%2F1:device%201',
                SK: 'metadata#tenant%2F1',
                type: 'device',
                data: device
            },
            ConditionExpression: 'attribute_not_exists(PK)'
        });
    });

    it('updates the data attribute and returns the stored device', async () => {
        const device = createDevice({ status: DeviceStatus.MAINTENANCE });
        mockDocumentClient.on(UpdateCommand).resolves({
            Attributes: {
                data: device
            }
        });

        await expect(storage.updateDevice(device, context)).resolves.toEqual(device);

        expect(mockDocumentClient).toHaveReceivedCommandWith(UpdateCommand, {
            TableName: TABLE_NAME,
            Key: {
                PK: 'device:tenant%2F1:device%201',
                SK: 'metadata#tenant%2F1'
            },
            ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)',
            UpdateExpression: 'SET #data = :data',
            ExpressionAttributeNames: {
                '#data': 'data'
            },
            ExpressionAttributeValues: {
                ':data': device
            },
            ReturnValues: 'ALL_NEW'
        });
    });

    it('throws DeviceNotFoundError when an update returns no data', async () => {
        mockDocumentClient.on(UpdateCommand).resolves({});

        await expect(storage.updateDevice(createDevice(), context)).rejects.toThrow(DeviceNotFoundError);
    });

    it('deletes devices and returns the old device when present', async () => {
        const device = createDevice();
        mockDocumentClient.on(DeleteCommand).resolves({
            Attributes: {
                data: device
            }
        });

        await expect(storage.deleteDevice(device, context)).resolves.toEqual(device);

        expect(mockDocumentClient).toHaveReceivedCommandWith(DeleteCommand, {
            TableName: TABLE_NAME,
            Key: {
                PK: 'device:tenant%2F1:device%201',
                SK: 'metadata#tenant%2F1'
            },
            ReturnValues: 'ALL_OLD'
        });
    });
});
