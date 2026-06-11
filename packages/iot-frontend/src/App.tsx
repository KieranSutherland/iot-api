import { useState } from 'react';

import styles from './App.module.css';
import { CreateDeviceModal } from './components/CreateDeviceModal';
import { DeviceCard } from './components/DeviceCard';
import { GetDeviceModal } from './components/GetDeviceModal';
import { ToastContainer } from './components/Toast';
import { useDevices } from './hooks/useDevices';
import { useToast } from './hooks/useToast';

import type { Device, DeviceCreationInput } from 'iot-api';

export default function App() {
    const { devices, loading, error, listDevices, createDevice, getDevice, updateDevice, deleteDevice, clearError } =
        useDevices();
    const { toasts, addToast, dismissToast } = useToast();

    const [ tenantId, setTenantId ] = useState('');
    const [ lookupId, setLookupId ] = useState('');
    const [ showCreate, setShowCreate ] = useState(false);
    const [ inspectedDevice, setInspectedDevice ] = useState<Device | null>(null);
    const [ hasLoaded, setHasLoaded ] = useState(false);

    async function handleListDevices() {
        if (!tenantId.trim()) {
            addToast('Please enter a Tenant ID', 'error');
            return;
        }
        await listDevices(tenantId.trim());
        setHasLoaded(true);
        if (!error) {
            addToast('Devices loaded', 'success');
        }
    }

    async function handleCreate(data: DeviceCreationInput) {
        const { tenantId, ...rest } = data;
        const device = await createDevice(data.tenantId || tenantId, rest);
        if (device) {
            setShowCreate(false);
            addToast(`Device "${device.name}" created`, 'success');
        }
    }

    async function handleGetDevice(id: string) {
        if (!tenantId.trim()) {
            addToast('Please enter a Tenant ID', 'error');
            return;
        }
        const device = await getDevice(tenantId.trim(), id);
        if (device) {
            setInspectedDevice(device);
            addToast(`Fetched device "${device.name}"`, 'info');
        }
    }

    async function handleLookupDevice() {
        if (!tenantId.trim() || !lookupId.trim()) {
            addToast('Enter both Tenant ID and Device ID', 'error');
            return;
        }
        const device = await getDevice(tenantId.trim(), lookupId.trim());
        if (device) {
            setInspectedDevice(device);
            addToast(`Fetched "${device.name}"`, 'info');
        }
    }

    async function handleUpdate(id: string, data: Partial<Device>) {
        if (!tenantId.trim()) {
            addToast('Please enter a Tenant ID', 'error');
            return;
        }
        const updated = await updateDevice(tenantId.trim(), id, data);
        if (updated) {
            addToast(`Device "${updated.name}" updated`, 'success');
        }
    }

    async function handleDelete(id: string) {
        if (!tenantId.trim()) {
            addToast('Please enter a Tenant ID', 'error');
            return;
        }
        const name = devices.find((d) => d.id === id)?.name ?? id;
        const ok = await deleteDevice(tenantId.trim(), id);
        if (ok) {
            addToast(`Device "${name}" deleted`, 'success');
        }
    }

    return (
        <div className={ styles.app }>
            <aside className={ styles.sidebar }>
                <div className={ styles.sidebarHeader }>
                    <div className={ styles.logo }>
                        <span className={ styles.logoIcon }>⚡</span>
                        <span className={ styles.logoText }>IoT Manager</span>
                    </div>
                    <p className={ styles.logoSub }>Device Management Console</p>
                </div>

                <div className={ styles.sidebarSection }>
                    <p className={ styles.sidebarSectionLabel }>API Configuration</p>
                    <div className={ styles.apiUrl }>
                        <span className={ styles.apiUrlDot } />
                        localhost:3000
                    </div>
                </div>

                <div className={ styles.sidebarSection }>
                    <p className={ styles.sidebarSectionLabel }>Tenant</p>
                    <input
                        className={ styles.sidebarInput }
                        placeholder="Enter Tenant ID"
                        value={ tenantId }
                        onChange={ (e) => { setTenantId(e.target.value); clearError(); } }
                        onKeyDown={ (e) => e.key === 'Enter' && handleListDevices() }
                    />
                </div>

                <div className={ styles.sidebarSection }>
                    <p className={ styles.sidebarSectionLabel }>Actions</p>
                    <div className={ styles.actionList }>
                        <ActionButton
                            method="GET"
                            label="List All Devices"
                            description="GET /api/v1/{tenantId}/devices"
                            onClick={ handleListDevices }
                            loading={ loading }
                        />
                        <ActionButton
                            method="POST"
                            label="Create Device"
                            description="POST /api/v1/{tenantId}/devices"
                            onClick={ () => {
                                if (!tenantId.trim()) { addToast('Please enter a Tenant ID first', 'error'); return; }
                                setShowCreate(true);
                            } }
                        />
                    </div>
                </div>

                <div className={ styles.sidebarSection }>
                    <p className={ styles.sidebarSectionLabel }>Look Up Device by ID</p>
                    <input
                        className={ styles.sidebarInput }
                        placeholder="Device ID"
                        value={ lookupId }
                        onChange={ (e) => setLookupId(e.target.value) }
                        onKeyDown={ (e) => e.key === 'Enter' && handleLookupDevice() }
                    />
                    <button className={ styles.lookupBtn } onClick={ handleLookupDevice }>
                        <span className={ styles.methodBadgeGet }>GET</span>
                        Fetch by ID
                    </button>
                </div>

                <div className={ styles.sidebarFooter }>
                    <p className={ styles.sidebarSectionLabel } style={ { marginBottom: 8 } }>Endpoints</p>
                    <div className={ styles.routeList }>
                        <RouteHint method="GET" path="/api/v1/{tenantId}/devices" />
                        <RouteHint method="POST" path="/api/v1/{tenantId}/devices" />
                        <RouteHint method="GET" path="/api/v1/{tenantId}/devices/{id}" />
                        <RouteHint method="PATCH" path="/api/v1/{tenantId}/devices/{id}" />
                        <RouteHint method="DELETE" path="/api/v1/{tenantId}/devices/{id}" />
                    </div>
                </div>
            </aside>

            <main className={ styles.main }>
                <div className={ styles.mainHeader }>
                    <h1 className={ styles.mainTitle }>Devices</h1>
                    { hasLoaded && (
                        <span className={ styles.deviceCount }>
                            { devices.length } device{ devices.length !== 1 ? 's' : '' }
                        </span>
                    ) }
                </div>

                { error && (
                    <div className={ styles.errorBanner }>
                        <strong>Error:</strong> { error }
                        <button className={ styles.errorDismiss } onClick={ clearError }>✕</button>
                    </div>
                ) }

                { loading && (
                    <div className={ styles.loadingState }>
                        <div className={ styles.spinner } />
                        <span>Fetching from API…</span>
                    </div>
                ) }

                { !loading && !hasLoaded && !devices && (
                    <div className={ styles.emptyState }>
                        <div className={ styles.emptyIcon }>📡</div>
                        <p className={ styles.emptyTitle }>No devices loaded</p>
                        <p className={ styles.emptyBody }>
                            Enter a Tenant ID in the sidebar and click <strong>List All Devices</strong> to get started.
                        </p>
                    </div>
                ) }

                { !loading && hasLoaded && devices.length === 0 && (
                    <div className={ styles.emptyState }>
                        <div className={ styles.emptyIcon }>🔌</div>
                        <p className={ styles.emptyTitle }>No devices found</p>
                        <p className={ styles.emptyBody }>This tenant has no devices yet. Use <strong>Create Device</strong> to add one.</p>
                    </div>
                ) }

                { devices.length > 0 && (
                    <div className={ styles.grid }>
                        { devices.map((device) => (
                            <DeviceCard
                                key={ device.id }
                                device={ device }
                                onDelete={ handleDelete }
                                onUpdate={ handleUpdate }
                                onGetDevice={ handleGetDevice }
                            />
                        )) }
                    </div>
                ) }
            </main>

            { showCreate && (
                <CreateDeviceModal
                    tenantId={ tenantId }
                    onClose={ () => setShowCreate(false) }
                    onCreate={ handleCreate }
                />
            ) }

            { inspectedDevice && (
                <GetDeviceModal device={ inspectedDevice } onClose={ () => setInspectedDevice(null) } />
            ) }

            <ToastContainer toasts={ toasts } onDismiss={ dismissToast } />
        </div>
    );
}

interface ActionButtonProps {
    method: 'GET' | 'POST';
    label: string;
    description: string;
    onClick: () => void;
    loading?: boolean;
}

function ActionButton({ method, label, description, onClick, loading }: ActionButtonProps) {
    return (
        <button className={ styles.actionBtn } onClick={ onClick } disabled={ loading }>
            <div className={ styles.actionBtnTop }>
                <span className={ method === 'GET' ? styles.methodBadgeGet : styles.methodBadgePost }>
                    { method }
                </span>
                <span className={ styles.actionLabel }>{ label }</span>
            </div>
            <span className={ styles.actionDesc }>{ description }</span>
        </button>
    );
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function RouteHint({ method, path }: { method: HttpMethod; path: string }) {
    const cls = {
        GET: styles.methodBadgeGet,
        POST: styles.methodBadgePost,
        PATCH: styles.methodBadgePatch,
        DELETE: styles.methodBadgeDelete,
    }[ method ];
    return (
        <p className={ styles.routeHint }>
            <span className={ cls }>{ method }</span>
            { path }
        </p>
    );
}
