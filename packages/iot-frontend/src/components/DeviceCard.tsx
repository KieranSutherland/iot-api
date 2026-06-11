import { useState } from 'react';

import styles from './DeviceCard.module.css';
import { EditDeviceModal } from './EditDeviceModal';
import { StatusBadge } from './StatusBadge';

import type { Device } from 'iot-api';
const DEVICE_TYPE_LABELS: Record<string, string> = {
    thermostat: '🌡 Thermostat',
    light: '💡 Light',
    moisture_sensor: '💧 Moisture Sensor',
    carbon_dioxide_sensor: '🫧 CO₂ Sensor',
};

interface Props {
    device: Device;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: Partial<Device>) => void;
    onGetDevice: (id: string) => void;
}

function formatDate(iso?: string) {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleString();
}

export function DeviceCard({ device, onDelete, onUpdate, onGetDevice }: Props) {
    const [ expanded, setExpanded ] = useState(false);
    const [ showEdit, setShowEdit ] = useState(false);

    return (
        <>
            <div className={ styles.card }>
                <div className={ styles.header }>
                    <div className={ styles.titleRow }>
                        <span className={ styles.typeLabel }>{ DEVICE_TYPE_LABELS[ device.type ] ?? device.type }</span>
                        <StatusBadge status={ device.status } />
                    </div>
                    <h3 className={ styles.name }>{ device.name }</h3>
                    <p className={ styles.meta }>
                        <span className={ styles.metaItem }>📍 { device.location }</span>
                        <span className={ styles.metaItem }>🔌 { device.connectivity.protocol.toUpperCase() }</span>
                        <span className={ styles.metaItem }>⚙ v{ device.firmwareVersion }</span>
                    </p>
                </div>

                <div className={ styles.fields }>
                    <Field label="Device ID" value={ device.id } mono />
                    <Field label="Tenant ID" value={ device.tenantId } mono />
                    <Field label="IP Address" value={ device.connectivity.ipAddress } mono />
                    <Field label="MAC Address" value={ device.connectivity.macAddress } mono />
                    <Field label="Last Seen" value={ formatDate(device.lastSeen) } />
                    <Field label="Created" value={ formatDate(device.createdAt) } />
                    <Field label="Updated" value={ formatDate(device.updatedAt) } />
                </div>

                { device.description && (
                    <p className={ styles.description }>{ device.description }</p>
                ) }

                <button
                    className={ styles.expandToggle }
                    onClick={ () => setExpanded((v) => !v) }
                >
                    { expanded ? '▲ Hide state & metadata' : '▼ Show state & metadata' }
                </button>

                { expanded && (
                    <div className={ styles.jsonSection }>
                        <>
                            <p className={ styles.jsonLabel }>State</p>
                            <pre className={ styles.json }>
                                { typeof device.state === 'undefined' ? 'undefined' : JSON.stringify(device.state, null, 2) }
                            </pre>
                        </>
                            <>
                                <p className={ styles.jsonLabel }>Metadata</p>
                                <pre className={ styles.json }>
                                { typeof device.metadata === 'undefined' ? 'undefined' : JSON.stringify(device.metadata, null, 2) }
                            </pre>
                            </>
                    </div>
                ) }

                <div className={ styles.actions }>
                    <button className={ styles.btnSecondary } onClick={ () => onGetDevice(device.id) }>
                        Refresh
                    </button>
                    <button className={ styles.btnPrimary } onClick={ () => setShowEdit(true) }>
                        Edit
                    </button>
                    <button className={ styles.btnDanger } onClick={ () => onDelete(device.id) }>
                        Delete
                    </button>
                </div>
            </div>

            { showEdit && (
                <EditDeviceModal
                    device={ device }
                    onClose={ () => setShowEdit(false) }
                    onSave={ (data) => {
                        onUpdate(device.id, data);
                        setShowEdit(false);
                    } }
                />
            ) }
        </>
    );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className={ styles.field }>
            <span className={ styles.fieldLabel }>{ label }</span>
            <span className={ `${styles.fieldValue} ${mono ? styles.mono : ''}` }>{ value }</span>
        </div>
    );
}
