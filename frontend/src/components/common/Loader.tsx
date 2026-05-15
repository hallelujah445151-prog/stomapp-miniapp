import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'medium', text }) => {
  const sizeMap = {
    small: { width: '20px', height: '20px', borderWidth: '2px' },
    medium: { width: '40px', height: '40px', borderWidth: '4px' },
    large: { width: '60px', height: '60px', borderWidth: '6px' }
  };

  const styles = sizeMap[size];

  return (
    <div className="loading">
      <div
        className="loading-spinner"
        style={{
          width: styles.width,
          height: styles.height,
          borderWidth: styles.borderWidth
        }}
      />
      {text && <p style={{ marginTop: '16px' }}>{text}</p>}
    </div>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h3 style={{ marginBottom: '16px' }}>Произошла ошибка</h3>
      <p style={{ color: 'var(--danger-color, #f44336)', marginBottom: '24px' }}>
        {message}
      </p>
      {onRetry && (
        <button className="button button-primary" onClick={onRetry}>
          Попробовать снова
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p style={{ marginTop: '8px' }}>{description}</p>}
      {action && <div style={{ marginTop: '24px' }}>{action}</div>}
    </div>
  );
};