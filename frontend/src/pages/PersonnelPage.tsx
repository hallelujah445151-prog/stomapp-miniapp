import React from 'react';
import { PersonnelManagement } from '../components/admin/PersonnelManagement';
import { withRoleProtection } from '../components/auth/RoleBasedAccess';

export const PersonnelPage: React.FC = () => {
  const RoleProtectedPage = withRoleProtection(['admin'])(() => (
    <PersonnelManagement />
  ));

  return <RoleProtectedPage />;
};

export const DoctorsPage: React.FC = () => {
  const RoleProtectedPage = withRoleProtection(['admin'])(() => (
    <PersonnelManagement role="doctor" />
  ));

  return <RoleProtectedPage />;
};

export const TechniciansPage: React.FC = () => {
  const RoleProtectedPage = withRoleProtection(['admin'])(() => (
    <PersonnelManagement role="technician" />
  ));

  return <RoleProtectedPage />;
};