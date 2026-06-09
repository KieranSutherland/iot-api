/**
 * The ID of the user management schema for this service.
 */
export const SCHEMA_ID = 'iot-device-service-id';

/**
 * The resource prefix used to denote an example entity.
 */
export const EXAMPLE_RESOURCE_PREFIX = 'example';

/**
 * Authorities relating to 'example' resources.
 */
export enum ExampleAuthority {
    GET_EXAMPLE = 'GetExample',
    CREATE_EXAMPLE = 'CreateExample',
    UPDATE_EXAMPLE = 'UpdateExample',
    DELETE_EXAMPLE = 'DeleteExample'
}

/**
 * Builds a resource identifier for the example entity with the given ID.
 *
 * @param id The ID of the example entity.
 * @returns A resource identifier that represents the example entity with the given ID.
 */
export function buildExampleResourceIdentifier(id: string): string {
    // Note: this does not escape 'id', as it's a UUID.
    // If IDs were permitted to use characters like '/', '*' or '?', then it would require escaping here.
    return `${EXAMPLE_RESOURCE_PREFIX}/${id}`;
}
