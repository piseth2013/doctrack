import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../lib/translations';

interface Office {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

const OfficesTab: React.FC = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslation();

  useEffect(() => {
    const fetchOffices = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('offices')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOffices(data || []);
      } catch (error) {
        console.error('Error fetching offices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffices();
  }, []);

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (office.location && office.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" text="Loading offices..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Input
          placeholder="Search offices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} />}
        />
        <Button variant="primary" leftIcon={<Plus size={16} />}>
          Add Office
        </Button>
      </div>

      {filteredOffices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffices.map((office) => (
            <Card key={office.id}>
              <CardBody>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{office.name}</h3>
                    {office.location && (
                      <p className="mt-1 text-sm text-gray-500">{office.location}</p>
                    )}
                    {office.phone && (
                      <p className="mt-1 text-sm text-gray-500">{office.phone}</p>
                    )}
                    {office.email && (
                      <p className="mt-1 text-sm text-gray-500">{office.email}</p>
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
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No offices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding an office'}
              </p>
              <div className="mt-6">
                <Button variant="primary" leftIcon={<Plus size={16} />}>
                  Add Office
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default OfficesTab;