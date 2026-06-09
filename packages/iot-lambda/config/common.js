const primaryRegions = new Map(Object.entries({
    EU: 'eu-west-1',
    UK: 'eu-west-2',
    US: 'us-east-2',
    AU: 'ap-southeast-2'
}));

exports.primaryRegion = async ({ resolveVariable }) => {
    const region = await resolveVariable('self:custom.highLevelRegion');
    return primaryRegions.get(region);
};
