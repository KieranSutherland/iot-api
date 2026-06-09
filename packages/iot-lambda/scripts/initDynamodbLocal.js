const {
    CreateTableCommand,
    DescribeTableCommand,
    DynamoDBClient,
    ListTablesCommand,
    ResourceNotFoundException
} = require('@aws-sdk/client-dynamodb');

const endpoint = process.env.DYNAMODB_ENDPOINT_URL || 'http://dynamodb-local:8000';
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-1';
const highLevelRegion = process.env.PLATFORM_HIGH_LEVEL_REGION || 'EU';
const stage = process.env.STAGE || 'offline';
const tableName = process.env.DYNAMODB_TABLE_NAME || `${stage}-iot-device-storage-${highLevelRegion.toLowerCase()}`;

const client = new DynamoDBClient({
    endpoint,
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    }
});

async function waitForDynamoDB() {
    for (let attempt = 1; attempt <= 30; attempt += 1) {
        try {
            await client.send(new ListTablesCommand({}));
            return;
        } catch (error) {
            console.log(`Waiting for DynamoDB Local at ${endpoint} (${attempt}/30)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    throw new Error(`DynamoDB Local did not become available at ${endpoint}`);
}

async function tableExists() {
    try {
        await client.send(new DescribeTableCommand({ TableName: tableName }));
        return true;
    } catch (error) {
        if (error instanceof ResourceNotFoundException || error.name === 'ResourceNotFoundException') {
            return false;
        }

        throw error;
    }
}

async function createTable() {
    await client.send(new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    }));
}

async function main() {
    await waitForDynamoDB();

    if (await tableExists()) {
        console.log(`DynamoDB table already exists: ${tableName}`);
        return;
    }

    console.log(`Creating DynamoDB table: ${tableName}`);
    await createTable();
    console.log(`Created DynamoDB table: ${tableName}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
