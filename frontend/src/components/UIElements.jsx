import './Card.css';

export const Card = ({ children, className = '', style }) => {
    return (
        <div className={`premium-card animate-fade-in ${className}`} style={style}>
            {children}
        </div>
    );
};

export const Badge = ({ status }) => {
    const getStatusStyle = () => {
        switch (status.toLowerCase()) {
            case 'available':
            case 'active':
            case 'returned':
                return 'badge-success';
            case 'overdue':
            case 'delayed':
            case 'unavailable':
                return 'badge-danger';
            default:
                return 'badge-neutral';
        }
    };

    return (
        <span className={`premium-badge ${getStatusStyle()}`}>
            {status}
        </span>
    );
};
