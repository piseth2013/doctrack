import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FileLock, Mail, Lock, KeyRound } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthWrapper';
import { useTranslation } from '../lib/translations';

const VerifyStaffPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-staff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Verification failed');
      }

      // Sign in with the new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary-100 p-3">
            <FileLock size={40} className="text-primary-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Staff Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your verification code to complete your account setup
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail size={18} />}
              />

              <Input
                label="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                leftIcon={<KeyRound size={18} />}
              />

              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock size={18} />}
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock size={18} />}
              />

              {errorMessage && (
                <div className="text-sm text-error-600 bg-error-50 p-3 rounded-md">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                fullWidth
                className="py-2.5"
              >
                Complete Account Setup
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default VerifyStaffPage;