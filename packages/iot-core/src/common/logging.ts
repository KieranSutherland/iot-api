/**
 * Builds standard logger contextual information.
 *
 * @param context Context relating to the ongoing execution.
 * @returns Standard context for use with logging.
 */
export function loggerContext(context: { requestId?: string }): Record<string, unknown> {
    return {
        requestId: context.requestId
    };
}
