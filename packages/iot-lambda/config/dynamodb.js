const { buildDynamoDBTableName } = require('../build/naming');
const { buildCommonTags } = require('./common');

exports.storageTableName = async ({ resolveVariable }) => {
    const region = await resolveVariable('self:custom.highLevelRegion');
    const stage = await resolveVariable('self:provider.stage');
    return buildDynamoDBTableName(region, stage);
};

exports.buildTableReplicas = async ({ resolveVariable }) => {
    const region = await resolveVariable('self:custom.highLevelRegion');
    const stage = await resolveVariable('self:provider.stage');
    const tableName = buildDynamoDBTableName(region, stage);

    // TODO: Add additional replicas other than the primary replica regions.
    const replicaRegions = [ await resolveVariable('self:provider.region') ];
    return replicaRegions.map(replicaRegion => {
        return {
            Region: replicaRegion,
            DeletionProtectionEnabled: true,
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true
            },
            Tags: [
                {
                    Key: 'iot:name',
                    Value: tableName
                },
                {
                    Key: 'iot:description',
                    Value: 'Table to hold data for ${self:custom.serviceId}.'
                }
            ]
        };
    });
};
