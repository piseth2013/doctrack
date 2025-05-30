import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FileLock, Mail, Lock } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { signIn, supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';
import { useTranslation } from '../lib/translations';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const t = useTranslation();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('logo_settings')
          .select('logo_url')
          .maybeSingle();

        if (error) throw error;
        if (data?.logo_url) {
          // Get the file name from the full URL
          const fileName = data.logo_url.split('/').pop();
          if (fileName) {
            // Create a new signed URL for the file
            const { data: { signedUrl } } = await supabase.storage
              .from('logoUpload')
              .createSignedUrl(fileName, 60 * 60); // 1 hour expiry

            if (signedUrl) {
              setLogoUrl(signedUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
      }
    };

    fetchLogo();
  }, []);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setErrorMessage('Invalid email or password. Please check your credentials and try again.');
        } else {
          setErrorMessage(error.message);
        }
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard\" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          { (
            <div className="w-[512px] h-[512px] max-w-[200px] max-h-[200px] flex items-center justify-center">
              <img 
                src={"https://tmlolxujcdfktggozuzt.supabase.co/storage/v1/object/public/logoUpload/logo-1748445368677.png"} 
                alt="Company Logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-full bg-primary-100 p-3">
              <FileLock size={40} className="text-primary-600" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('signIn')} DocTrack
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Document management and tracking system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label={t('email')}
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              leftIcon={<Mail size={18} />}
            />

            <Input
              label={t('password')}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              leftIcon={<Lock size={18} />}
            />

            {errorMessage && (
              <div className="text-sm text-error-600 bg-error-50 p-3 rounded-md">
                {errorMessage}
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                fullWidth
                className="py-2.5"
              >
                {t('signIn')}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('demoCredentials')}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="text-sm text-center text-gray-600">
                <p>Email: demo.admin@doctrack.com</p>
                <p>Password: Demo123!</p>
                <p className="mt-2 text-xs">
                  These credentials will log you in as an admin user with full access to the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;