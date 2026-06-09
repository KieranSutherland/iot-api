import { Device, DeviceKeyInput } from 'iot-api';
import { DeviceNotFoundError, DeviceStorage, RequestContext } from 'iot-spi';

import {
    DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand,
    UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';

export interface DynamoDBDeviceStorageConfig {
    readonly documentClient: DynamoDBDocumentClient;
    readonly tableName: string;
}

const DEVICE_PK_PREFIX = 'device:';
const DEVICE_SK_VALUE = 'metadata#';

export function buildPrimaryKey(key: DeviceKeyInput) {
    return `${DEVICE_PK_PREFIX}${encodeURIComponent(key.tenantId)}:${encodeURIComponent(key.id)}`;
}

function buildDeviceItemKey(key: DeviceKeyInput): { PK: string; SK: string } {
    return {
        PK: buildPrimaryKey(key),
        SK: `${DEVICE_SK_VALUE}${encodeURIComponent(key.tenantId)}`
    };
}

export class DynamoDBDeviceStorage implements DeviceStorage {
    constructor(private readonly config: DynamoDBDeviceStorageConfig) { }

    async getDevice(key: DeviceKeyInput, context: RequestContext): Promise<Device | undefined> {
        const itemKey = buildDeviceItemKey(key);
        const result = await this.config.documentClient.send(new GetCommand({
            TableName: this.config.tableName,
            Key: itemKey
        }));

        return result.Item?.data as Device | undefined;
    }

    async getDevices(tenantId: string, context: RequestContext): Promise<Device[]> {
        const result = await this.config.documentClient.send(new ScanCommand({
            TableName: this.config.tableName,
            ProjectionExpression: '#data',
            FilterExpression: '#data.#tenantId = :tenantId',
            ExpressionAttributeNames: {
                '#data': 'data',
                '#tenantId': 'tenantId'
            },
            ExpressionAttributeValues: {
                ':tenantId': tenantId
            }
        }));

        return (result.Items ?? []).map(item => item.data as Device);
    }

    async createDevice(device: Device, context: RequestContext): Promise<Device> {
        const itemKey = buildDeviceItemKey(device);
        await this.config.documentClient.send(new PutCommand({
            TableName: this.config.tableName,
            Item: {
                ...itemKey,
                type: 'device',
                data: device
            },
            ConditionExpression: 'attribute_not_exists(PK)'
        }));

        return device;
    }

    async updateDevice(device: Device, context: RequestContext): Promise<Device> {
        const itemKey = buildDeviceItemKey(device);
        const updateParams: UpdateCommandInput = {
            TableName: this.config.tableName,
            Key: itemKey,
            ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)',
            UpdateExpression: 'SET #data = :data',
            ExpressionAttributeNames: {
                '#data': 'data'
            },
            ExpressionAttributeValues: {
                ':data': device
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await this.config.documentClient.send(new UpdateCommand(updateParams));
        if (!result.Attributes?.data) {
            throw new DeviceNotFoundError(
                `No device with ID '${device.id}' exists under tenant '${device.tenantId}'.`,
                { id: device.id, tenantId: device.tenantId }
            );
        }

        return result.Attributes.data as Device;
    }

    async deleteDevice(key: DeviceKeyInput, context: RequestContext): Promise<Device | undefined> {
        const itemKey = buildDeviceItemKey(key);
        const result = await this.config.documentClient.send(new DeleteCommand({
            TableName: this.config.tableName,
            Key: itemKey,
            ReturnValues: 'ALL_OLD'
        }));

        return result.Attributes?.data as Device | undefined;
    }
}
