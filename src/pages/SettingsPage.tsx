import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Users, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import UsersPage from './UsersPage';

const SettingsPage: React.FC = () => {
  const t = useTranslation();
  const [activeSection, setActiveSection] = useState<'users' | 'general'>('users');

  const menuItems = [
    {
      id: 'users',
      label: t('users'),
      icon: <Users size={20} />,
    },
    {
      id: 'general',
      label: t('general'),
      icon: <SettingsIcon size={20} />,
    },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-1">{t('manageSystemUsers')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        <div className="lg:col-span-3">
          {activeSection === 'users' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">{t('users')}</h2>
              </CardHeader>
              <CardBody className="p-0">
                <UsersPage />
              </CardBody>
            </Card>
          )}

          {activeSection === 'general' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">{t('general')}</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-500">{t('comingSoon')}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;