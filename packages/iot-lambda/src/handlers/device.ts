import {
    DeviceCreationInput, DeviceKeyInput, DeviceProtocol, DeviceStatus, DeviceType, DeviceUpdateInput
} from 'iot-api';
import { RestContext, RestRequest, RestResponse } from 'iot-rest';
import { DeviceNotFoundError } from 'iot-spi';

const CREATE_FIELDS = new Set([
    'name',
    'type',
    'status',
    'firmwareVersion',
    'location',
    'connectivity',
    'state',
    'description',
    'metadata'
]);
const UPDATE_FIELDS = new Set([
    'name',
    'type',
    'status',
    'firmwareVersion',
    'lastSeen',
    'location',
    'connectivity',
    'state',
    'description',
    'metadata'
]);
const DEVICE_TYPES = new Set<string>(Object.values(DeviceType));
const DEVICE_STATUSES = new Set<string>(Object.values(DeviceStatus));
const DEVICE_PROTOCOLS = new Set<string>([ 'http', 'mqtt' ] satisfies DeviceProtocol[]);

function jsonResponse(statusCode: number, body: unknown): RestResponse {
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

function parseBody(body: unknown): unknown {
    if (typeof body === 'string' && body.length > 0) {
        return JSON.parse(body);
    }
    return body ?? {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidIpAddress(value: string): boolean {
    const parts = value.split('.');
    return parts.length === 4 && parts.every(part => {
        // Must be a digit and have between 1-3 digits.
        if (!/^\d{1,3}$/.test(part)) {
            return false;
        }

        // Cannot excede 255.
        const octet = Number(part);
        return octet >= 0 && octet <= 255;
    });
}

function isValidMacAddress(value: string): boolean {
    return /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(value);
}

function addUnknownFieldErrors(errors: string[], payload: Record<string, unknown>, allowedFields: Set<string>): void {
    Object.keys(payload)
        .filter(field => !allowedFields.has(field))
        .forEach(field => errors.push(`${field} is not allowed.`));
}

function validateStringField(
    errors: string[],
    payload: Record<string, unknown>,
    field: string,
    required: boolean
): void {
    if (!(field in payload)) {
        if (required) {
            errors.push(`${field} is required.`);
        }
        return;
    }

    if (!isNonEmptyString(payload[field])) {
        errors.push(`${field} must be a non-empty string.`);
    }
}

function validateConnectivity(errors: string[], value: unknown, required: boolean): void {
    if (value === undefined) {
        if (required) {
            errors.push('connectivity is required.');
        }
        return;
    }

    if (!isRecord(value)) {
        errors.push('connectivity must be an object.');
        return;
    }

    addUnknownFieldErrors(errors, value, new Set([ 'protocol', 'ipAddress', 'macAddress' ]));

    if (!isNonEmptyString(value.protocol) || !DEVICE_PROTOCOLS.has(value.protocol)) {
        errors.push('connectivity.protocol must be one of: http, mqtt.');
    }

    if (!isNonEmptyString(value.ipAddress) || !isValidIpAddress(value.ipAddress)) {
        errors.push('connectivity.ipAddress must be a valid IPv4 address.');
    }

    if (!isNonEmptyString(value.macAddress) || !isValidMacAddress(value.macAddress)) {
        errors.push('connectivity.macAddress must be a valid MAC address.');
    }
}

function validateState(errors: string[], value: unknown): void {
    if (value !== undefined && !isRecord(value)) {
        errors.push('state must be an object.');
    }
}

function validateMetadata(errors: string[], value: unknown): void {
    if (value !== undefined && !isRecord(value)) {
        errors.push('metadata must be an object.');
    }
}

function validateLastSeen(errors: string[], value: unknown): void {
    if (value !== undefined && value !== null && !isNonEmptyString(value)) {
        errors.push('lastSeen must be a non-empty ISO timestamp string or null.');
    }
}

function validateCreatePayload(body: unknown): { payload?: DeviceCreationInput; errors: string[] } {
    const errors: string[] = [];
    if (!isRecord(body)) {
        return { errors: [ 'Request body must be an object.' ] };
    }

    addUnknownFieldErrors(errors, body, CREATE_FIELDS);
    [ 'name', 'firmwareVersion', 'location' ].forEach(field => validateStringField(errors, body, field, true));

    if (!isNonEmptyString(body.type) || !DEVICE_TYPES.has(body.type)) {
        errors.push(`type must be one of: ${Array.from(DEVICE_TYPES).join(', ')}.`);
    }

    if (!isNonEmptyString(body.status) || !DEVICE_STATUSES.has(body.status)) {
        errors.push(`status must be one of: ${Array.from(DEVICE_STATUSES).join(', ')}.`);
    }

    validateConnectivity(errors, body.connectivity, true);

    if (body.description !== undefined && !isNonEmptyString(body.description)) {
        errors.push('description must be a non-empty string.');
    }

    validateState(errors, body.state);
    validateMetadata(errors, body.metadata);

    return { payload: body as DeviceCreationInput, errors };
}

function validateUpdatePayload(body: unknown): { payload?: DeviceUpdateInput; errors: string[] } {
    const errors: string[] = [];
    if (!isRecord(body)) {
        return { errors: [ 'Request body must be an object.' ] };
    }

    addUnknownFieldErrors(errors, body, UPDATE_FIELDS);

    const updatableFields = Object.keys(body).filter(field => field !== 'id' && field !== 'tenantId');
    if (updatableFields.length === 0) {
        errors.push('At least one device field must be supplied.');
    }

    [ 'name', 'firmwareVersion', 'location' ].forEach(field => validateStringField(errors, body, field, false));

    if (body.type !== undefined && (!isNonEmptyString(body.type) || !DEVICE_TYPES.has(body.type))) {
        errors.push(`type must be one of: ${Array.from(DEVICE_TYPES).join(', ')}.`);
    }

    if (body.status !== undefined && (!isNonEmptyString(body.status) || !DEVICE_STATUSES.has(body.status))) {
        errors.push(`status must be one of: ${Array.from(DEVICE_STATUSES).join(', ')}.`);
    }

    validateConnectivity(errors, body.connectivity, false);

    if (body.description !== undefined && !isNonEmptyString(body.description)) {
        errors.push('description must be a non-empty string.');
    }

    validateState(errors, body.state);
    validateMetadata(errors, body.metadata);
    validateLastSeen(errors, body.lastSeen);

    return { payload: body as DeviceUpdateInput, errors };
}

export async function handleRequest(request: RestRequest, context: RestContext): Promise<RestResponse> {
    const { deviceService, requestContext } = context;
    try {
        const body = parseBody(request.body);
        
        // Parse path segments.
        const normalizedPath = request.path.replace(/\/+$/, '');
        const pathSegments = normalizedPath.split('/').filter(Boolean);
        if (pathSegments.length < 3 || 
            pathSegments.length > 5 || 
            pathSegments[0] !== 'api' || 
            pathSegments[1] !== 'v1' || 
            pathSegments[3] !== 'devices'
        ) {
            return jsonResponse(404, { error: 'NotFound', message: 'Unknown route.' });
        }

        const tenantId = decodeURIComponent(pathSegments[2]);

        if (pathSegments.length === 4) {
            if (request.method === 'GET') {
                const devices = await deviceService.listDevices(tenantId, requestContext);
                return jsonResponse(200, { devices });
            }

            if (request.method === 'POST') {
                const { payload, errors } = validateCreatePayload(body);
                if (errors.length > 0) {
                    return jsonResponse(400, { error: 'ValidationError', messages: errors });
                }

                const input = { ...payload, tenantId } as DeviceCreationInput;
                const createdDevice = await deviceService.createDevice(input, requestContext);
                return jsonResponse(201, createdDevice);
            }
        }

        if (pathSegments.length === 5) {
            const deviceId = decodeURIComponent(pathSegments[4]);

            const key: DeviceKeyInput = { id: deviceId, tenantId };

            if (request.method === 'GET') {
                const device = await deviceService.getDevice(key, requestContext);
                if (!device) {
                    return jsonResponse(404, { error: 'DeviceNotFound', message: `Device '${deviceId}' not found.` });
                }
                return jsonResponse(200, device);
            }

            if (request.method === 'PATCH') {
                const { payload, errors } = validateUpdatePayload(body);
                if (errors.length > 0) {
                    return jsonResponse(400, { error: 'ValidationError', messages: errors });
                }

                const input = { 
                    ...payload, 
                    id: deviceId, 
                    tenantId,
                    updatedAt: new Date().toISOString()
                 }
                const updatedDevice = await deviceService.updateDevice(input, requestContext);
                return jsonResponse(200, updatedDevice);
            }

            if (request.method === 'DELETE') {
                const deletedDevice = await deviceService.deleteDevice(key, requestContext);
                if (!deletedDevice) {
                    return jsonResponse(404, { error: 'DeviceNotFound', message: `Device '${deviceId}' not found.` });
                }
                return jsonResponse(200, { device: deletedDevice });
            }
        }

        return jsonResponse(404, { error: 'NotFound', message: 'Unknown route.' });
    } catch (err) {
        if (err instanceof DeviceNotFoundError) {
            return jsonResponse(404, { error: 'DeviceNotFound', message: err.message });
        }

        if (err instanceof SyntaxError) {
            return jsonResponse(400, { error: 'InvalidJson', message: err.message });
        }

        return jsonResponse(500, { error: 'InternalServerError', message: err.message });
    }
}
