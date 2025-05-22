import React, { useState, useEffect } from 'react';
import { Plus, Search, Users2, X, LayoutGrid, List } from 'lucide-react';
import { Card, CardBody, CardHeader, CardFooter } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../lib/translations';

interface Staff {
  id: string;
  name: string;
  position_id: string | null;
  office_id: string | null;
  created_at: string;
  positions: {
    name: string;
  } | null;
  offices: {
    name: string;
  } | null;
}

const StaffTab: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const t = useTranslation();

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('staff')
          .select(`
            *,
            positions (name),
            offices (name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStaff(data || []);
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.positions?.name && person.positions.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (person.offices?.name && person.offices.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderListView = () => (
    <Card>
      <div className="divide-y divide-gray-200">
        {filteredStaff.map((person) => (
          <div key={person.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Users2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{person.name}</h3>
                  {person.positions && (
                    <p className="mt-1 text-sm text-gray-500">{person.positions.name}</p>
                  )}
                  {person.offices && (
                    <p className="mt-1 text-sm text-gray-500">{person.offices.name}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  {t('edit')}
                </Button>
                <Button variant="danger" size="sm">
                  {t('delete')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredStaff.map((person) => (
        <Card key={person.id}>
          <CardBody>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users2 className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{person.name}</h3>
                {person.positions && (
                  <p className="mt-1 text-sm text-gray-500">{person.positions.name}</p>
                )}
                {person.offices && (
                  <p className="mt-1 text-sm text-gray-500">{person.offices.name}</p>
                )}
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">
              {t('edit')}
            </Button>
            <Button variant="danger" size="sm">
              {t('delete')}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading staff..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 flex items-center gap-4">
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
          <div className="flex items-center bg-white border border-gray-300 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />}>
          Add Staff Member
        </Button>
      </div>

      {filteredStaff.length > 0 ? (
        viewMode === 'grid' ? renderGridView() : renderListView()
      ) : (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <Users2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No staff members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding a staff member'}
              </p>
              <div className="mt-6">
                <Button variant="primary" leftIcon={<Plus size={16} />}>
                  Add Staff Member
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default StaffTab;