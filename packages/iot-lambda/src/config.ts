/**
 * Asserts that the given environment variable is defined, and returns its value.
 *
 * @param name The name of the environment variable that must exist.
 * @returns The value stored under the given environment variable.
 */
export function assertEnvironmentVariable(name: string): string {
    const value = process.env[ name ];
    if (typeof value !== 'string') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * The high-level region identifier this function is executing for.
 */
export const HIGH_LEVEL_REGION = assertEnvironmentVariable('PLATFORM_HIGH_LEVEL_REGION');

/**
 * The stage this function is executing for.
 */
export const STAGE = assertEnvironmentVariable('STAGE');

/**
 * Asserts that the given environment variable is defined and returns its value, if {@link STAGE} is not `prod`.
 *
 * In production, this always returns `undefined`.
 *
 * @param name The name of the environment variable that must exist in a non-production environment.
 * @returns The value stored under the given environment variable if not running in production, otherwise `undefined`.
 */
export function assertNonProductionVariable(name: string): string | undefined {
    if (STAGE !== 'prod') {
        return assertEnvironmentVariable(name);
    }
    return undefined;
}
