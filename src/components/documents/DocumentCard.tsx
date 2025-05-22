import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from '../ui/StatusBadge';
import { Card, CardBody } from '../ui/Card';

interface DocumentCardProps {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userName: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  title,
  description,
  status,
  createdAt,
  updatedAt,
  userName,
}) => {
  return (
    <Link to={`/documents/${id}`}>
      <Card hoverable className="h-full transition-all duration-200 hover:translate-y-[-2px]">
        <CardBody>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
              <StatusBadge status={status} className="mb-3" />
              {description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center text-gray-500 text-xs">
                  <User size={14} className="mr-1.5" />
                  <span>{userName}</span>
                </div>
                <div className="flex items-center text-gray-500 text-xs">
                  <Calendar size={14} className="mr-1.5" />
                  <span>Created: {format(new Date(createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-500 text-xs">
                  <Calendar size={14} className="mr-1.5" />
                  <span>Updated: {format(new Date(updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-50 rounded-full text-primary-700">
                <FileText size={20} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

export default DocumentCard;