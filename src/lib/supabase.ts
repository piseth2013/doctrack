import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error checking for environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file and ensure VITE_SUPABASE_URL is set to your Supabase project URL.');
  throw new Error('Supabase configuration error: Missing project URL. Please check your environment variables.');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file and ensure VITE_SUPABASE_ANON_KEY is set to your Supabase anonymous key.');
  throw new Error('Supabase configuration error: Missing anonymous key. Please check your environment variables.');
}

// Validate URL format and provide helpful error messages
if (supabaseUrl === 'your_supabase_project_url_here') {
  console.error('VITE_SUPABASE_URL is still set to placeholder value. Please update .env file with your actual Supabase project URL.');
  throw new Error('Supabase configuration error: Please update your environment variables with actual values.');
}

if (supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('VITE_SUPABASE_ANON_KEY is still set to placeholder value. Please update .env file with your actual Supabase anonymous key.');
  throw new Error('Supabase configuration error: Please update your environment variables with actual values.');
}

try {
  new URL(supabaseUrl);
} catch (error) {
  console.error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}. Please ensure it's a valid URL (e.g., https://your-project-id.supabase.co)`);
  throw new Error('Supabase configuration error: Invalid project URL format. Please check your environment variables.');
}

// Ensure URL uses HTTPS
const secureSupabaseUrl = supabaseUrl.replace('http://', 'https://');

export const supabase = createClient<Database>(secureSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'doctrack-web',
    },
  },
});

// Authentication helpers
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('fetch')) {
        throw new Error('Unable to connect to authentication service. Please check your internet connection and Supabase configuration.');
      }
      throw error;
    }
    
    return { data, error };
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof Error && error.message.includes('fetch')) {
      return { 
        data: null, 
        error: new Error('Connection failed. Please check your internet connection and try again.') 
      };
    }
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error && error.message.includes('fetch')) {
      throw new Error('Unable to connect to authentication service. Please check your internet connection.');
    }
    
    return { user: data.user, error };
  } catch (error) {
    console.error('Get user error:', error);
    if (error instanceof Error && error.message.includes('fetch')) {
      return { 
        user: null, 
        error: new Error('Connection failed. Please check your internet connection and try again.') 
      };
    }
    return { user: null, error };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('fetch')) {
      throw new Error('Unable to connect to authentication service. Please check your internet connection.');
    }
    
    return { session: data.session, error };
  } catch (error) {
    console.error('Get session error:', error);
    if (error instanceof Error && error.message.includes('fetch')) {
      return { 
        session: null, 
        error: new Error('Connection failed. Please check your internet connection and try again.') 
      };
    }
    return { session: null, error };
  }
};