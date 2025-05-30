import React from 'react';
import { Mail, User, Briefcase, Trash2, Edit } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { format } from 'date-fns';
import { useTranslation } from '../../lib/translations';

interface UserListItemProps {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  department: string | null;
  position: string | null;
  createdAt: string;
  onDelete?: (userId: string) => void;
  onEdit?: (userId: string) => void;
  currentUserRole?: string | null;
}

const UserListItem: React.FC<UserListItemProps> = ({
  id,
  email,
  fullName,
  role,
  department,
  position,
  createdAt,
  onDelete,
  onEdit,
  currentUserRole,
}) => {
  const t = useTranslation();

  const handleDelete = () => {
    if (onDelete && window.confirm(t('confirmDeleteUser').replace('{name}', fullName))) {
      onDelete(id);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <Avatar name={fullName} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
          <div className="flex items-center text-gray-500 text-xs mt-1">
            <Mail size={14} className="mr-1" />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <User size={12} className="mr-1" />
              {role === 'admin' ? t('administrator') : t('user')}
            </span>
            {position && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Briefcase size={12} className="mr-1" />
                {position}
              </span>
            )}
            {department && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Briefcase size={12} className="mr-1" />
                {department}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs text-gray-500">
            <div>{t('memberSince')}</div>
            <div>{format(new Date(createdAt), 'MMM d, yyyy')}</div>
          </div>
          {currentUserRole === 'admin' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(id)}
                leftIcon={<Edit size={14} />}
              >
                {t('edit')}
              </Button>
              {role !== 'admin' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  leftIcon={<Trash2 size={14} />}
                >
                  {t('remove')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListItem;