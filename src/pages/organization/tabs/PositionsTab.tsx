import React, { useState, useEffect } from 'react';
import { Plus, Search, Briefcase } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../lib/translations';

interface Position {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const PositionsTab: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslation();

  useEffect(() => {
    const fetchPositions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPositions(data || []);
      } catch (error) {
        console.error('Error fetching positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const filteredPositions = positions.filter(position =>
    position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (position.description && position.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading positions..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Input
          placeholder="Search positions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} />}
        />
        <Button variant="primary" leftIcon={<Plus size={16} />}>
          Add Position
        </Button>
      </div>

      {filteredPositions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPositions.map((position) => (
            <Card key={position.id}>
              <CardBody>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{position.name}</h3>
                    {position.description && (
                      <p className="mt-1 text-sm text-gray-500">{position.description}</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No positions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding a position'}
              </p>
              <div className="mt-6">
                <Button variant="primary" leftIcon={<Plus size={16} />}>
                  Add Position
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default PositionsTab;