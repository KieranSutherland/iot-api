import { DeviceStatus, DeviceType } from 'iot-api';
import { useState } from 'react';

import styles from './Modal.module.css';

import type { Device } from 'iot-api';
interface Props {
    device: Device;
    onClose: () => void;
    onSave: (data: Partial<Device>) => void;
}

export function EditDeviceModal({ device, onClose, onSave }: Props) {
    const [ form, setForm ] = useState({
        name: device.name,
        type: device.type,
        status: device.status,
        location: device.location,
        firmwareVersion: device.firmwareVersion,
        description: device.description ?? '',
        protocol: device.connectivity.protocol,
        ipAddress: device.connectivity.ipAddress,
        macAddress: device.connectivity.macAddress,
    });
    const [ stateJson, setStateJson ] = useState(JSON.stringify(device.state, null, 2));
    const [ stateError, setStateError ] = useState('');
    const [ metadataJson, setMetadataJson ] = useState(JSON.stringify(device.metadata, null, 2));
    const [ metadataError, setMetadataError ] = useState('');

    function set<K extends keyof typeof form>(key: K, value: (typeof form)[ K ]) {
        setForm((prev) => ({ ...prev, [ key ]: value }));
    }

    function handleSave() {
        let parsedState;
        try {
            parsedState = typeof stateJson === 'undefined' || stateJson === '' ? undefined : JSON.parse(stateJson)
            setStateError('');
        } catch {
            setStateError('State must be valid JSON');
            return;
        }

        let parsedMetadata;
        try {
            parsedMetadata = typeof metadataJson === 'undefined' || metadataJson === '' ? undefined : JSON.parse(metadataJson)
            setMetadataError('');
        } catch {
            setMetadataError('Metadata must be valid JSON');
            return;
        }

        onSave({
                name: form.name,
                type: form.type,
                status: form.status,
                location: form.location,
                firmwareVersion: form.firmwareVersion,
                description: form.description,
                connectivity: {
                    protocol: form.protocol,
                    ipAddress: form.ipAddress,
                    macAddress: form.macAddress,
                },
                state: parsedState,
                metadata: parsedMetadata
            });
    }

    return (
        <div className={ styles.overlay } onClick={ onClose }>
            <div className={ styles.modal } onClick={ (e) => e.stopPropagation() }>
                <div className={ styles.modalHeader }>
                    <h2 className={ styles.modalTitle }>Edit Device</h2>
                    <button className={ styles.closeBtn } onClick={ onClose }>✕</button>
                </div>

                <div className={ styles.body }>
                    <div className={ styles.deviceIdBanner }>
                        <span className={ styles.label }>Device ID</span>
                        <span className={ styles.deviceIdValue }>{ device.id }</span>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>Identity</p>
                        <div className={ styles.sectionGrid }>
                            <FormRow label="Name">
                                <input className={ styles.input } value={ form.name } onChange={ (e) => set('name', e.target.value) } />
                            </FormRow>
                            <FormRow label="Type">
                                <select className={ styles.input } value={ form.type } onChange={ (e) => set('type', e.target.value as DeviceType) }>
                                    { Object.values(DeviceType).map((t) => <option key={ t } value={ t }>{ t }</option>) }
                                </select>
                            </FormRow>
                            <FormRow label="Status">
                                <select className={ styles.input } value={ form.status } onChange={ (e) => set('status', e.target.value as DeviceStatus) }>
                                    { Object.values(DeviceStatus).map((s) => <option key={ s } value={ s }>{ s }</option>) }
                                </select>
                            </FormRow>
                            <FormRow label="Location">
                                <input className={ styles.input } value={ form.location } onChange={ (e) => set('location', e.target.value) } />
                            </FormRow>
                            <FormRow label="Firmware Version">
                                <input className={ styles.input } value={ form.firmwareVersion } onChange={ (e) => set('firmwareVersion', e.target.value) } />
                            </FormRow>
                            <FormRow label="Description">
                                <input className={ styles.input } value={ form.description } onChange={ (e) => set('description', e.target.value) } />
                            </FormRow>
                        </div>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>Connectivity</p>
                        <div className={ styles.sectionGrid }>
                            <FormRow label="Protocol">
                                <select className={ styles.input } value={ form.protocol } onChange={ (e) => set('protocol', e.target.value as 'http' | 'mqtt') }>
                                    <option value="http">HTTP</option>
                                    <option value="mqtt">MQTT</option>
                                </select>
                            </FormRow>
                            <FormRow label="IP Address">
                                <input className={ styles.input } value={ form.ipAddress } onChange={ (e) => set('ipAddress', e.target.value) } />
                            </FormRow>
                            <FormRow label="MAC Address">
                                <input className={ styles.input } value={ form.macAddress } onChange={ (e) => set('macAddress', e.target.value) } />
                            </FormRow>
                        </div>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>State</p>
                        <div className={ styles.sectionGrid }>
                            <FormRow label="State (JSON)">
                                <textarea
                                    className={ `${styles.input} ${styles.textarea}` }
                                    value={ stateJson }
                                    onChange={ (e) => { setStateJson(e.target.value); setStateError(''); } }
                                />
                                { stateError && <p className={ styles.error }>{ stateError }</p> }
                            </FormRow>
                        </div>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>Metadata</p>
                        <div className={ styles.sectionGrid }>
                            <FormRow label="Metadata (JSON)">
                                <textarea
                                    className={ `${styles.input} ${styles.textarea}` }
                                    value={ metadataJson }
                                    onChange={ (e) => { setMetadataJson(e.target.value); setMetadataError(''); } }
                                />
                                { metadataError && <p className={ styles.error }>{ metadataError }</p> }
                            </FormRow>
                        </div>
                    </div>
                </div>

                <div className={ styles.footer }>
                    <button className={ styles.btnCancel } onClick={ onClose }>Cancel</button>
                    <button className={ styles.btnPrimary } onClick={ handleSave }>Save Changes</button>
                </div>
            </div>
        </div>
    );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className={ styles.formRow }>
            <span className={ styles.label }>{ label }</span>
            { children }
        </label>
    );
}
