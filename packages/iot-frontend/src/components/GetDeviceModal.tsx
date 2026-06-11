import type { Device } from 'iot-api';
import cardStyles from './DeviceCard.module.css';
import styles from './Modal.module.css';
import { StatusBadge } from './StatusBadge';

interface Props {
    device: Device;
    onClose: () => void;
}

function formatDate(iso?: string) {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleString();
}

export function GetDeviceModal({ device, onClose }: Props) {
    return (
        <div className={ styles.overlay } onClick={ onClose }>
            <div className={ styles.modal } onClick={ (e) => e.stopPropagation() }>
                <div className={ styles.modalHeader }>
                    <h2 className={ styles.modalTitle }>Device Details</h2>
                    <button className={ styles.closeBtn } onClick={ onClose }>✕</button>
                </div>

                <div className={ styles.body }>
                    <div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
                        <span style={ { fontWeight: 700, fontSize: '1rem', color: '#111827' } }>{ device.name }</span>
                        <StatusBadge status={ device.status } />
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>Identity</p>
                        <div className={ cardStyles.fields }>
                            <Field label="Device ID" value={ device.id } mono />
                            <Field label="Tenant ID" value={ device.tenantId } mono />
                            <Field label="Type" value={ device.type } />
                            <Field label="Location" value={ device.location } />
                            <Field label="Firmware" value={ device.firmwareVersion } />
                            <Field label="Description" value={ device.description ?? '—' } />
                        </div>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>Connectivity</p>
                        <div className={ cardStyles.fields }>
                            <Field label="Protocol" value={ device.connectivity.protocol.toUpperCase() } />
                            <Field label="IP Address" value={ device.connectivity.ipAddress } mono />
                            <Field label="MAC Address" value={ device.connectivity.macAddress } mono />
                        </div>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>Timestamps</p>
                        <div className={ cardStyles.fields }>
                            <Field label="Created" value={ formatDate(device.createdAt) } />
                            <Field label="Updated" value={ formatDate(device.updatedAt) } />
                            <Field label="Last Seen" value={ formatDate(device.lastSeen) } />
                        </div>
                    </div>

                    <div>
                        <p className={ styles.sectionTitle }>State</p>
                        <pre className={ cardStyles.json }>{ JSON.stringify(device.state, null, 2) }</pre>
                    </div>

                    { device.metadata && (
                        <div>
                            <p className={ styles.sectionTitle }>Metadata</p>
                            <pre className={ cardStyles.json }>{ JSON.stringify(device.metadata, null, 2) }</pre>
                        </div>
                    ) }
                </div>

                <div className={ styles.footer }>
                    <button className={ styles.btnPrimary } onClick={ onClose }>Close</button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className={ cardStyles.field }>
            <span className={ cardStyles.fieldLabel }>{ label }</span>
            <span className={ `${cardStyles.fieldValue} ${mono ? cardStyles.mono : ''}` }>{ value }</span>
        </div>
    );
}
