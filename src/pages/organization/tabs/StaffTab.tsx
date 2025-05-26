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
  email: string;
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

interface Position {
  id: string;
  name: string;
}

interface Office {
  id: string;
  name: string;
}

interface StaffFormData {
  name: string;
  email: string;
  position_id: string;
  office_id: string;
}

const initialFormData: StaffFormData = {
  name: '',
  email: '',
  position_id: '',
  office_id: '',
};

const StaffTab: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const t = useTranslation();

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          positions (id, name),
          offices (id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositionsAndOffices = async () => {
    try {
      const [positionsResult, officesResult] = await Promise.all([
        supabase.from('positions').select('id, name').order('name'),
        supabase.from('offices').select('id, name').order('name'),
      ]);

      if (positionsResult.error) throw positionsResult.error;
      if (officesResult.error) throw officesResult.error;

      setPositions(positionsResult.data || []);
      setOffices(officesResult.data || []);
    } catch (error) {
      console.error('Error fetching positions and offices:', error);
      setError('Failed to load positions and offices');
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchPositionsAndOffices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (person: Staff) => {
    setFormData({
      name: person.name,
      email: person.email || '',
      position_id: person.position_id || '',
      office_id: person.office_id || '',
    });
    setEditingStaff(person.id);
    setShowForm(true);
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm(t('confirmDelete').replace('{item}', 'staff member'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      await fetchStaff();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      setError('Failed to delete staff member');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        throw new Error('Name and email are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      if (editingStaff) {
        // Update existing staff member
        const { error } = await supabase
          .from('staff')
          .update({
            name: formData.name,
            email: formData.email,
            position_id: formData.position_id || null,
            office_id: formData.office_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStaff);

        if (error) throw error;
      } else {
        // Create new staff member with verification
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.staff) {
          throw new Error('Invalid response from server');
        }
      }

      // Reset form and refresh staff
      setFormData(initialFormData);
      setShowForm(false);
      setEditingStaff(null);
      await fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
      setError(error instanceof Error ? error.message : 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staff.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
                  <p className="mt-1 text-sm text-gray-500">{person.email}</p>
                  {person.positions && (
                    <p className="mt-1 text-sm text-gray-500">{person.positions.name}</p>
                  )}
                  {person.offices && (
                    <p className="mt-1 text-sm text-gray-500">{person.offices.name}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(person)}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(person.id)}
                >
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
                <p className="mt-1 text-sm text-gray-500">{person.email}</p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(person)}
            >
              {t('edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(person.id)}
            >
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
      {error && (
        <div className="mb-4 p-4 text-sm text-error-700 bg-error-50 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 flex items-center gap-4">
          <Input
            placeholder={t('searchPlaceholder').replace('{item}', 'staff')}
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
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setFormData(initialFormData);
            setEditingStaff(null);
            setShowForm(true);
          }}
        >
          {t('addStaff')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium">
                {editingStaff ? t('editStaff') : t('addStaff')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingStaff(null);
                  setFormData(initialFormData);
                }}
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label={t('staffName')}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <div>
                <label htmlFor="position_id" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('staffPosition')}
                </label>
                <select
                  id="position_id"
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleInputChange}
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">{t('selectPosition')}</option>
                  {positions.map(position => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="office_id" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('staffOffice')}
                </label>
                <select
                  id="office_id"
                  name="office_id"
                  value={formData.office_id}
                  onChange={handleInputChange}
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">{t('selectOffice')}</option>
                  {offices.map(office => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardBody>
            <CardFooter className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingStaff(null);
                  setFormData(initialFormData);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              >
                {editingStaff ? t('save') : t('addStaff')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {filteredStaff.length > 0 ? (
        viewMode === 'grid' ? renderGridView() : renderListView()
      ) : (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <Users2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noStaffFound')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding a staff member'}
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    setFormData(initialFormData);
                    setEditingStaff(null);
                    setShowForm(true);
                  }}
                >
                  {t('addStaff')}
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