import React from 'react';
import { Mail, User, Briefcase, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { format } from 'date-fns';

interface UserListItemProps {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  department: string | null;
  createdAt: string;
  onDelete?: (userId: string) => void;
  currentUserRole?: string | null;
}

const UserListItem: React.FC<UserListItemProps> = ({
  id,
  email,
  fullName,
  role,
  department,
  createdAt,
  onDelete,
  currentUserRole,
}) => {
  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete user ${fullName}?`)) {
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
              {role === 'admin' ? 'Administrator' : 'User'}
            </span>
            {department && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Briefcase size={12} className="mr-1" />
                {department}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs text-gray-500">
            <div>Member since</div>
            <div>{format(new Date(createdAt), 'MMM d, yyyy')}</div>
          </div>
          {currentUserRole === 'admin' && role === 'user' && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              leftIcon={<Trash2 size={14} />}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListItem;