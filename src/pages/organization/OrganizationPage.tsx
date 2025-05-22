import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Building2, Users2, Briefcase } from 'lucide-react';
import { useTranslation } from '../../lib/translations';
import OfficesTab from './tabs/OfficesTab';
import StaffTab from './tabs/StaffTab';
import PositionsTab from './tabs/PositionsTab';

type OrganizationTab = 'office' | 'staff' | 'position';

const OrganizationPage: React.FC = () => {
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<OrganizationTab>('office');

  const tabs = [
    {
      id: 'office',
      label: t('office'),
      icon: <Building2 size={20} />,
    },
    {
      id: 'staff',
      label: t('staff'),
      icon: <Users2 size={20} />,
    },
    {
      id: 'position',
      label: t('position'),
      icon: <Briefcase size={20} />,
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </CardHeader>

      <CardBody>
        {activeTab === 'office' && <OfficesTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'position' && <PositionsTab />}
      </CardBody>
    </Card>
  );
};

export default OrganizationPage;