import { Context } from 'aws-lambda';
import { DeviceService } from 'iot-core';
import { RequestContext } from 'iot-spi';
import { DynamoDBDeviceStorage } from 'iot-storage-dynamodb';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { assertNonProductionVariable, HIGH_LEVEL_REGION, STAGE } from './config';
import { buildDynamoDBTableName } from './naming';

export function buildRequestContext(context: Context): RequestContext {
    return {
        requestId: context.awsRequestId
    };
}

const dynamoDBClient = new DynamoDBClient({
    endpoint: assertNonProductionVariable('DYNAMODB_ENDPOINT_URL')
});

const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient, {
    marshallOptions: {
        removeUndefinedValues: true
    }
});

const deviceStorage = new DynamoDBDeviceStorage({
    documentClient: dynamoDBDocumentClient,
    tableName: buildDynamoDBTableName(HIGH_LEVEL_REGION, STAGE)
});

export const deviceService = new DeviceService({
    deviceStorage
});