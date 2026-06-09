/**
 * This pattern is used to validate unique names for entities. Such names are intended to allow pre-defining
 * a unique name that can be used to retrieve an existing entity.
 *
 * It permits only alpha-numeric characters, hyphens and underscores.
 */
export const UNIQUE_NAME_PATTERN = /^[\w_-]{1,256}$/;
