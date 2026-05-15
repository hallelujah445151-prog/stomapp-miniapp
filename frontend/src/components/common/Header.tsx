import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  actions,
  showLogout = true 
}) => {
  return (
    <div className="header" style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      {/* Заголовок */}
      {subtitle && (
        <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999999)' }}>
          {subtitle}
        </div>
      )}

      {/* Основной заголовок */}
      <h1 style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center' }}>
        {title}
      </h1>

      {/* Дополнительные действия */}
      {actions && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
};