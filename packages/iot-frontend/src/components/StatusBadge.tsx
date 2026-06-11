import type { DeviceStatus } from 'iot-api';
import styles from './StatusBadge.module.css';

const STATUS_LABELS: Record<DeviceStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    maintenance: 'Maintenance',
    unknown: 'Unknown',
};

interface Props {
    status: DeviceStatus;
}

export function StatusBadge({ status }: Props) {
    return (
        <span className={ `${styles.badge} ${styles[ status ]}` }>
            <span className={ styles.dot } />
            { STATUS_LABELS[ status ] }
        </span>
    );
}
