import { DeviceStatus, DeviceType } from 'iot-api';
import { useState } from 'react';

import styles from './Modal.module.css';

import type { DeviceCreationInput } from 'iot-api';
interface Props {
    tenantId: string;
    onClose: () => void;
    onCreate: (data: DeviceCreationInput) => void;
}

const defaultForm: DeviceCreationInput = {
    tenantId: '',
    name: '',
    type: DeviceType.THERMOSTAT,
    status: DeviceStatus.UNKNOWN,
    firmwareVersion: '1.0.0',
    location: '',
    connectivity: { protocol: 'http', ipAddress: '', macAddress: '' },
    state: {},
    description: '',
};

export function CreateDeviceModal({ tenantId, onClose, onCreate }: Props) {
    const [ form, setForm ] = useState<DeviceCreationInput>({
        ...defaultForm,
        tenantId,
    });
    const [ stateJson, setStateJson ] = useState('');
    const [ stateError, setStateError ] = useState('');
    const [ metadataJson, setMetadataJson ] = useState('');
    const [ metadataError, setMetadataError ] = useState('');

    function set<K extends keyof DeviceCreationInput>(key: K, value: DeviceCreationInput[ K ]) {
        setForm((prev) => ({ ...prev, [ key ]: value }));
    }

    function setConn(key: keyof DeviceCreationInput[ 'connectivity' ], value: string) {
        setForm((prev) => ({
            ...prev,
            connectivity: { ...prev.connectivity, [ key ]: value },
        }));
    }

    function handleSubmit() {
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

        onCreate({ ...form, state: parsedState, metadata: parsedMetadata });
    }

    return (
        <div className={ styles.overlay } onClick={ onClose }>
            <div className={ styles.modal } onClick={ (e) => e.stopPropagation() }>
                <div className={ styles.modalHeader }>
                    <h2 className={ styles.modalTitle }>Create Device</h2>
                    <button className={ styles.closeBtn } onClick={ onClose }>✕</button>
                </div>

                <div className={ styles.body }>
                    <Section title="Identity">
                        <FormRow label="Name *">
                            <input className={ styles.input } value={ form.name } onChange={ (e) => set('name', e.target.value) } placeholder="e.g. Living Room Thermostat" />
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
                        <FormRow label="Location *">
                            <input className={ styles.input } value={ form.location } onChange={ (e) => set('location', e.target.value) } placeholder="e.g. kitchen" />
                        </FormRow>
                        <FormRow label="Firmware Version">
                            <input className={ styles.input } value={ form.firmwareVersion } onChange={ (e) => set('firmwareVersion', e.target.value) } placeholder="1.0.0" />
                        </FormRow>
                        <FormRow label="Description">
                            <input className={ styles.input } value={ form.description ?? '' } onChange={ (e) => set('description', e.target.value) } placeholder="Optional description" />
                        </FormRow>
                    </Section>

                    <Section title="Connectivity">
                        <FormRow label="Protocol">
                            <select className={ styles.input } value={ form.connectivity.protocol } onChange={ (e) => setConn('protocol', e.target.value) }>
                                <option value="http">HTTP</option>
                                <option value="mqtt">MQTT</option>
                            </select>
                        </FormRow>
                        <FormRow label="IP Address *">
                            <input className={ styles.input } value={ form.connectivity.ipAddress } onChange={ (e) => setConn('ipAddress', e.target.value) } placeholder="192.168.1.100" />
                        </FormRow>
                        <FormRow label="MAC Address *">
                            <input className={ styles.input } value={ form.connectivity.macAddress } onChange={ (e) => setConn('macAddress', e.target.value) } placeholder="AA:BB:CC:DD:EE:FF" />
                        </FormRow>
                    </Section>

                    <Section title="State">
                        <FormRow label="State (JSON)">
                            <textarea
                                className={ `${styles.input} ${styles.textarea}` }
                                value={ stateJson }
                                onChange={ (e) => { setStateJson(e.target.value); setStateError(''); } }
                                placeholder='{ "temperature": 21 }'
                            />
                            { stateError && <p className={ styles.error }>{ stateError }</p> }
                        </FormRow>
                    </Section>

                    <Section title="Metadata">
                        <FormRow label="Metadata (JSON)">
                            <textarea
                                className={ `${styles.input} ${styles.textarea}` }
                                value={ metadataJson }
                                onChange={ (e) => { setMetadataJson(e.target.value); setMetadataError(''); } }
                                placeholder='{ "colour": "white" }'
                            />
                            { metadataError && <p className={ styles.error }>{ metadataError }</p> }
                        </FormRow>
                    </Section>
                </div>

                <div className={ styles.footer }>
                    <button className={ styles.btnCancel } onClick={ onClose }>Cancel</button>
                    <button className={ styles.btnPrimary } onClick={ handleSubmit }>Create Device</button>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className={ styles.sectionTitle }>{ title }</p>
            <div className={ styles.sectionGrid }>{ children }</div>
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
