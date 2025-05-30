import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Users, ShieldAlert } from 'lucide-react';
import { Card, CardBody, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import UserListItem from '../components/users/UserListItem';
import Loader from '../components/ui/Loader';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/translations';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  department: string | null;
  position: string | null;
  created_at: string;
}

interface Position {
  id: string;
  name: string;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  department: string;
  position: string;
  password?: string;
}

const initialFormData: UserFormData = {
  email: '',
  full_name: '',
  role: 'user',
  department: '',
  position: '',
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const t = useTranslation();

  // Fetch current user's role
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        setCurrentUserRole(data?.role || null);
      } catch (error) {
        console.error('Error in fetchCurrentUserRole:', error);
      }
    };

    fetchCurrentUserRole();
  }, []);

  // Fetch users and positions if current user is admin
  useEffect(() => {
    if (currentUserRole === 'admin') {
      Promise.all([fetchUsers(), fetchPositions()]);
    }
  }, [currentUserRole]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to load positions');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEdit = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit) return;

    setFormData({
      email: userToEdit.email,
      full_name: userToEdit.full_name,
      role: userToEdit.role,
      department: userToEdit.department || '',
      position: userToEdit.position || '',
    });
    setEditingUserId(userId);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name) {
      setError(t('requiredFields'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      if (editingUserId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            department: formData.department || null,
            position: formData.position || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUserId);

        if (updateError) throw updateError;
      } else {
        // Create new user
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create user');
        }
      }

      await fetchUsers();
      setFormData(initialFormData);
      setShowForm(false);
      setEditingUserId(null);
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.position && user.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (currentUserRole !== 'admin') {
    return (
      <Card className="bg-warning-50 border-warning-200">
        <CardBody className="p-12">
          <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-warning-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('adminOnly')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('noPermission')}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader size="lg" text={t('loadingUsers')} />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Card className="mb-6 bg-error-50 border-error-200">
          <CardBody className="text-error-700">
            {error}
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end mb-6">
        <Button 
          variant="primary" 
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setFormData(initialFormData);
            setEditingUserId(null);
            setShowForm(true);
          }}
        >
          {t('addUser')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                {editingUserId ? t('edit') : t('addUser')}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowForm(false);
                  setEditingUserId(null);
                  setFormData(initialFormData);
                }}
                className="text-gray-500"
              >
                <X size={18} />
              </Button>
            </CardHeader>
            
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('email')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  disabled={!!editingUserId}
                />

                <Input
                  label={t('fullName')}
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role')}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('administrator')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('position')}
                  </label>
                  <select
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">{t('selectPosition')}</option>
                    {positions.map(position => (
                      <option key={position.id} value={position.name}>
                        {position.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label={t('departmentOptional')}
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              {!editingUserId && (
                <Input
                  label={t('password')}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              )}
            </CardBody>
            
            <CardFooter className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setEditingUserId(null);
                  setFormData(initialFormData);
                }}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {editingUserId ? t('save') : t('addUser')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="mb-6">
        <CardBody className="p-4">
          <Input
            placeholder={t('searchUsers')}
            value={searchQuery}
            onChange={handleSearchChange}
            leftIcon={<Search size={18} />}
            fullWidth
          />
        </CardBody>
      </Card>

      <div>
        {filteredUsers.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <UserListItem
                key={user.id}
                id={user.id}
                email={user.email}
                fullName={user.full_name}
                role={user.role}
                department={user.department}
                position={user.position}
                createdAt={user.created_at}
                onDelete={handleDeleteUser}
                onEdit={handleEdit}
                currentUserRole={currentUserRole}
              />
            ))}
          </div>
        ) : (
          <div className="py-12">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <Users size={24} className="text-gray-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">{t('noUsersFound')}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery
                  ? t('noMatchingUsers').replace('{query}', searchQuery)
                  : t('getStartedAddUser')}
              </p>
              <div className="mt-6">
                <Button 
                  variant="primary" 
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    setFormData(initialFormData);
                    setEditingUserId(null);
                    setShowForm(true);
                  }}
                >
                  {t('addUser')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;