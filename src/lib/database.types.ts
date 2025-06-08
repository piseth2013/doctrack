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
          status: 'pending' | 'approved' | 'rejected' | 'needs_changes'
          user_id: string
          created_at: string
          updated_at: string
          document_date: string
          approver_id: string | null
          note_to_approver: string | null
          approver_comment: string | null
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'needs_changes'
          user_id: string
          created_at?: string
          updated_at?: string
          document_date?: string
          approver_id?: string | null
          note_to_approver?: string | null
          approver_comment?: string | null
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'needs_changes'
          user_id?: string
          created_at?: string
          updated_at?: string
          document_date?: string
          approver_id?: string | null
          note_to_approver?: string | null
          approver_comment?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          position_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'user'
          department?: string | null
          position_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'user'
          department?: string | null
          position_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      offices: {
        Row: {
          id: string
          name: string
          location: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      verification_codes: {
        Row: {
          id: string
          email: string
          code: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          code: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          code?: string
          expires_at?: string
          created_at?: string
        }
      }
      logo_settings: {
        Row: {
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          logo_url?: string | null
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