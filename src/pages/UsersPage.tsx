import React, { useEffect, useState } from 'react';
import { Filter, Search, Plus, Users, ShieldAlert } from 'lucide-react';
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
  created_at: string;
}

interface NewUserFormData {
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  department: string;
  password: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const t = useTranslation();
  const [newUser, setNewUser] = useState<NewUserFormData>({
    email: '',
    full_name: '',
    role: 'user',
    department: '',
    password: '',
  });

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setCurrentUserRole(profile?.role || null);
      }
    };

    fetchCurrentUserRole();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUserRole !== 'admin') {
      setError(t('noPermission'));
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (!confirm(t('confirmDelete').replace('{name}', userToDelete.full_name))) {
      return;
    }

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUserRole !== 'admin') {
      setError(t('noPermission'));
      return;
    }

    if (!newUser.email || !newUser.full_name || !newUser.password) {
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      await fetchUsers();
      
      setNewUser({
        email: '',
        full_name: '',
        role: 'user',
        department: '',
        password: '',
      });
      setShowAddUserForm(false);
    } catch (error) {
      console.error('Error adding user:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" text={t('loadingUsers')} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('users')}</h1>
          <p className="text-gray-600 mt-1">{t('manageSystemUsers')}</p>
        </div>
        {currentUserRole === 'admin' && (
          <div className="mt-4 md:mt-0">
            <Button 
              variant="primary" 
              leftIcon={<Plus size={16} />}
              onClick={() => setShowAddUserForm(true)}
            >
              {t('addUser')}
            </Button>
          </div>
        )}
      </div>

      {currentUserRole !== 'admin' && (
        <Card className="mb-6 bg-warning-50 border-warning-200">
          <CardBody className="flex items-center gap-3 text-warning-800">
            <ShieldAlert className="h-5 w-5" />
            <p>{t('adminOnly')}</p>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card className="mb-6 bg-error-50 border-error-200">
          <CardBody className="text-error-700">
            {error}
          </CardBody>
        </Card>
      )}

      {showAddUserForm && currentUserRole === 'admin' && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">{t('addUser')}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAddUserForm(false)}
              className="text-gray-500"
            >
              <X size={18} />
            </Button>
          </CardHeader>
          
          <form onSubmit={handleAddUser}>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('email')}
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />

                <Input
                  label={t('fullName')}
                  name="full_name"
                  value={newUser.full_name}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role')}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('administrator')}</option>
                  </select>
                </div>

                <Input
                  label={t('departmentOptional')}
                  name="department"
                  value={newUser.department}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <Input
                label={t('password')}
                name="password"
                type="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </CardBody>
            
            <CardFooter className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddUserForm(false)}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {t('addUser')}
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

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            {t('users')} ({filteredUsers.length})
          </h2>
        </CardHeader>
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
                  createdAt={user.created_at}
                  onDelete={handleDeleteUser}
                  currentUserRole={currentUserRole}
                />
              ))}
            </div>
          ) : (
            <CardBody className="py-12">
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
                {currentUserRole === 'admin' && (
                  <div className="mt-6">
                    <Button 
                      variant="primary" 
                      leftIcon={<Plus size={16} />}
                      onClick={() => setShowAddUserForm(true)}
                    >
                      {t('addUser')}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UsersPage;