import { Device, DeviceCreationInput, DeviceKeyInput, DeviceUpdateInput } from 'iot-api';
import { DeviceNotFoundError, DeviceStorage, RequestContext } from 'iot-spi';
import { v1 as uuidV1 } from 'uuid';

export interface DeviceServiceConfig {
    readonly deviceStorage: DeviceStorage;
}

export class DeviceService {
    constructor(private readonly config: DeviceServiceConfig) { }

    async getDevice(key: DeviceKeyInput, context: RequestContext): Promise<Device | undefined> {
        return this.config.deviceStorage.getDevice(key, context);
    }

    async listDevices(tenantId: string, context: RequestContext): Promise<Device[]> {
        return this.config.deviceStorage.getDevices(tenantId, context);
    }

    async createDevice(input: DeviceCreationInput, context: RequestContext): Promise<Device> {
        const now = new Date().toISOString();
        const device: Device = {
            ...input,
            id: uuidV1(),
            createdAt: now,
            updatedAt: now
        };

        return this.config.deviceStorage.createDevice(device, context);
    }

    async updateDevice(input: DeviceUpdateInput, context: RequestContext): Promise<Device> {
        const existing = await this.config.deviceStorage.getDevice({ 
            id: input.id, 
            tenantId: input.tenantId 
        }, context);
        if (!existing) {
            throw new DeviceNotFoundError(
                `No device with ID '${input.id}' exists under tenant '${input.tenantId}'.`,
                { id: input.id, tenantId: input.tenantId }
            );
        }

        const updated: Device = {
            ...existing,
            ...input,
            connectivity: {
                ...existing.connectivity,
                ...input.connectivity
            },
            state: {
                ...existing.state,
                ...input.state
            },
            metadata: {
                ...existing.metadata,
                ...input.metadata
            },
        };

        return this.config.deviceStorage.updateDevice(updated, context);
    }

    async deleteDevice(key: DeviceKeyInput, context: RequestContext): Promise<Device | undefined> {
        return this.config.deviceStorage.deleteDevice(key, context);
    }
}
