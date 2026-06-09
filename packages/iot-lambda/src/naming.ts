/**
 * Builds the name of the DynamoDB table to use for the given region and stage.
 *
 * @param region The (high-level) region the table is associated with.
 * @param stage The stage the table is associated with (e.g. `prod` or `offline`).
 * @returns The name of the table for the given region + stage.
 */
export function buildDynamoDBTableName(region: string, stage: string): string {
    return `${stage}-iot-device-storage-${region.toLowerCase()}`;
}
