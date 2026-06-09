export enum DeviceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    MAINTENANCE = 'maintenance',
    UNKNOWN = 'unknown'
}

export enum DeviceType {
    THERMOSTAT = 'thermostat',
    LIGHT = 'light',
    MOISTURE_SENSOR = 'moisture_sensor',
    CARBON_DIOXIDE_SENSOR = 'carbon_dioxide_sensor'
}

export type DeviceProtocol = 'http' | 'mqtt';

export interface DeviceConnectivity {
    protocol: DeviceProtocol;
    ipAddress: string;
    macAddress: string;
}

export interface Device {
    /** The unique identifier of the device to update. */
    id: string;
    /** The ID of the tenant that owns the device. */
    tenantId: string;
    /** A human-friendly name for the device. */
    name: string;
    /** The type of the device. */
    type: DeviceType;
    /** The current runtime status of the device. */
    status: DeviceStatus;
    /** ISO 8601 timestamp when the device entity was created. */
    createdAt: string;
    /** ISO 8601 timestamp when the device entity was last updated. */
    updatedAt: string;
    /** The current firmware version of the device. */
    firmwareVersion: string;
    /** ISO 8601 timestamp the last time the device has sent a heartbeat to our servers.  */
    lastSeen?: string;
    /** Physical location of the device e.g. kitchen. */
    location: string;
    /** Details of the device on how to establish a connection. */
    connectivity:DeviceConnectivity
    /** State of the device e.g. light on/off or thermostat temperature. */
    state: Record<string, any>;
    /** Optional description of the device. */
    description?: string;
    /** Optional metadata about the device. */
    metadata?: Record<string, any>;
}

export type DeviceKeyInput = Pick<Device, 'id' | 'tenantId'>;

export type DeviceCreationInput = Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'lastSeen'>;

export type DeviceUpdateInput = DeviceKeyInput & Partial<Omit<Device, 'updatedAt' | 'createdAt'>>;

