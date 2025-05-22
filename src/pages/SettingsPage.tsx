import React from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { useTranslation } from '../lib/translations';
import UsersPage from './UsersPage';

const SettingsPage: React.FC = () => {
  const t = useTranslation();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-1">{t('manageSystemUsers')}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">{t('users')}</h2>
          </CardHeader>
          <CardBody className="p-0">
            <UsersPage />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;