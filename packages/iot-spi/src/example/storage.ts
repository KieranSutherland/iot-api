import {
    Example, ExampleCreationInput, ExampleKeyInput, ExampleUpdateInput
} from 'iot-template-api';

import { RequestContext } from '../context';

/**
 * Indicates that an example with the given ID was not found when attempting to update it.
 */
export class ExampleNotFoundError extends Error {

    /**
     * @param key The key of the example that was not found.
     */
    constructor(message: string, public readonly key: ExampleKeyInput) {
        super(message);
        this.name = 'ExampleNotFoundError';
    }
}

/**
 * Indicates that the given name for a new example has been reserved by an existing example.
 */
export class ExampleNameConflictError extends Error {

    constructor(message: string) {
        super(message);
        this.name = 'ExampleNameConflictError';
    }
}

/**
 * Handles storage of example entities.
 */
export interface ExampleStorage {

    /**
     * Gets an example by its unique ID.
     *
     * @param key The key of the example to retrieve.
     * @param context Context relating to the ongoing request.
     * @returns The example with the given ID under the given tenant, if it exists. Otherwise `undefined`.
     */
    getExampleById(key: ExampleKeyInput, context: RequestContext): Promise<Example | undefined>;

    /**
     * Creates a new example.
     *
     * @param input The example to create.
     * @param context Context relating to the ongoing request.
     * @returns The created example.
     * @throws {ExampleNameConflictError} If the given name has been used by an existing example.
     */
    createExample(input: ExampleCreationInput, context: RequestContext): Promise<Example>;

    /**
     * Updates the given example.
     *
     * @param input The example to update.
     * @param context Context relating to the ongoing request.
     * @returns The new state of the example.
     * @throws {ExampleNotFoundError} If no example with the given ID exists.
     */
    updateExample(input: ExampleUpdateInput, context: RequestContext): Promise<Example>;

    /**
     * Deletes the given example, if it exists.
     *
     * @param key The example to delete.
     * @param context Context relating to the ongoing request.
     * @returns The state of the example before it was deleted, or `undefined` if the example did not exist.
     */
    deleteExample(key: ExampleKeyInput, context: RequestContext): Promise<Example | undefined>;
}
