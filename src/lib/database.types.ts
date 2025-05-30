export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'approved' | 'rejected'
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      document_files: {
        Row: {
          id: string
          document_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          file_path?: string
          file_name?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'user'
          department: string | null
          position: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'user'
          department?: string | null
          position?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'user'
          department?: string | null
          position?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}