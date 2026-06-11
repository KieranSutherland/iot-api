import type { Device, DeviceCreationInput } from 'iot-api';

const BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        },
        ...options,
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status} ${res.statusText}`);
    }
    if (res.status === 204) {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

function sanitiseData(data: Partial<Device>): Partial<Device> {
    return {
        ...data,
        description: data.description === '' ? undefined : data.description,

    }
}

export const deviceApi = {
    listDevices: (tenantId: string): Promise<{ devices: Device[] }> => {
        return request(`/api/v1/${tenantId}/devices`)
    },

    createDevice: (tenantId: string, data: Omit<DeviceCreationInput, 'tenantId'>): Promise<Device> => {
        return request(`/api/v1/${tenantId}/devices`, {
            method: 'POST',
            body: JSON.stringify(sanitiseData(data)),
        })
    },

    getDevice: (tenantId: string, id: string): Promise<Device> => {
        return request(`/api/v1/${tenantId}/devices/${id}`)
    },

    updateDevice: (tenantId: string, id: string, data: Partial<Device>): Promise<Device> => {
        return request(`/api/v1/${tenantId}/devices/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(sanitiseData(data)),
        })
    },

    deleteDevice: (tenantId: string, id: string): Promise<void> => {
        return request(`/api/v1/${tenantId}/devices/${id}`, { method: 'DELETE' })
    }
};
