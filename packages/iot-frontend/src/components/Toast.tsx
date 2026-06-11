import { useEffect } from 'react';

import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface Props {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: Props) {
    return (
        <div className={ styles.container }>
            { toasts.map((t) => (
                <Toast key={ t.id } toast={ t } onDismiss={ onDismiss } />
            )) }
        </div>
    );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [ toast.id, onDismiss ]);

    const icons: Record<ToastType, string> = { success: '✓', error: '✕', info: 'ℹ' };

    return (
        <div className={ `${styles.toast} ${styles[ toast.type ]}` }>
            <span className={ styles.icon }>{ icons[ toast.type ] }</span>
            <span className={ styles.message }>{ toast.message }</span>
            <button className={ styles.dismiss } onClick={ () => onDismiss(toast.id) }>✕</button>
        </div>
    );
}
