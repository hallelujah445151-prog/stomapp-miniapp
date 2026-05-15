import React from 'react';
import { useAuthStore } from '../../store/auth';

interface RoleBasedContentProps {
  admin: React.ReactNode;
  doctor: React.ReactNode;
  technician: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({ 
  admin, 
  doctor, 
  technician, 
  fallback 
}) => {
  const { user } = useAuthStore();

  // Если пользователь не авторизован, показываем fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // Определяем контент на основе роли пользователя
  switch (user.role) {
    case 'admin':
      return <>{admin}</>;
    case 'doctor':
      return <>{doctor}</>;
    case 'technician':
      return <>{technician}</>;
    default:
      return <>{fallback}</>;
  }
};

export const withRoleProtection = (
  requiredRoles: ('admin' | 'doctor' | 'technician')[]
) => {
  return (Component: React.ComponentType<any>) => {
    return (props: any) => {
      const { user, isAuthenticated } = useAuthStore();

      // Проверяем авторизацию
      if (!isAuthenticated) {
        return (
          <div style={{ 
            padding: '40px',
            textAlign: 'center',
            fontSize: '16px',
            color: 'var(--tg-theme-hint-color, #999999)'
          }}>
            🔐 Требуется авторизация
          </div>
        );
      }

      // Проверяем роль пользователя
      if (user && requiredRoles.includes(user.role)) {
        return <Component {...props} />;
      }

      // Роль не соответствует требованиям
      return (
        <div style={{ 
          padding: '40px',
          textAlign: 'center',
          fontSize: '16px',
          color: '#f44336'
        }}>
          ⛔ Недостаточно прав доступа
          <div style={{ 
            fontSize: '14px',
            color: 'var(--tg-theme-hint-color, #999999)',
            marginTop: '16px'
          }}>
            Требуется одна из ролей: {requiredRoles.join(', ')}
          </div>
        </div>
      );
    };
  };
};