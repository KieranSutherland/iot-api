import { useCallback, useState } from 'react';

import { deviceApi } from '../api/deviceApi';

import type { Device, DeviceCreationInput } from 'iot-api';

export interface UseDevicesReturn {
    devices: Device[];
    loading: boolean;
    error: string | null;
    clearError: () => void;
    listDevices: (tenantId: string) => Promise<void>;
    createDevice: (tenantId: string, data: Omit<DeviceCreationInput, 'tenantId'>) => Promise<Device | null>;
    getDevice: (tenantId: string, id: string) => Promise<Device | null>;
    updateDevice: (tenantId: string, id: string, data: Partial<Device>) => Promise<Device | null>;
    deleteDevice: (tenantId: string, id: string) => Promise<boolean>;
}

export function useDevices(): UseDevicesReturn {
    const [ devices, setDevices ] = useState<Device[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
        setLoading(true);
        setError(null);
        try {
            return await fn();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const listDevices = useCallback(
        async (tenantId: string) => {
            await withLoading(async () => {
                const data = await deviceApi.listDevices(tenantId);
                setDevices(data.devices);
                return data;
            });
        },
        [ withLoading ],
    );

    const createDevice = useCallback(
        async (tenantId: string, data: Omit<DeviceCreationInput, 'tenantId'>): Promise<Device | null> => {
            return withLoading(async () => {
                const device = await deviceApi.createDevice(tenantId, data);
                setDevices((prev) => [ ...prev, device ]);
                return device;
            });
        },
        [ withLoading ],
    );

    const getDevice = useCallback(
        async (tenantId: string, id: string): Promise<Device | null> => {
            return withLoading(() => deviceApi.getDevice(tenantId, id));
        },
        [ withLoading ],
    );

    const updateDevice = useCallback(
        async (tenantId: string, id: string, data: Partial<Device>): Promise<Device | null> => {
            return withLoading(async () => {
                const updated = await deviceApi.updateDevice(tenantId, id, data);
                setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
                return updated;
            });
        },
        [ withLoading ],
    );

    const deleteDevice = useCallback(
        async (tenantId: string, id: string): Promise<boolean> => {
            const result = await withLoading(async () => {
                await deviceApi.deleteDevice(tenantId, id);
                setDevices((prev) => prev.filter((d) => d.id !== id));
                return true;
            });
            return result === true;
        },
        [ withLoading ],
    );

    return { devices, loading, error, clearError, listDevices, createDevice, getDevice, updateDevice, deleteDevice };
}
