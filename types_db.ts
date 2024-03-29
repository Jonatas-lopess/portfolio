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
      projects: {
        Row: {
          created_at: string | null
          demo_url: string | null
          description: string | null
          git_url: string | null
          id: number
          image_path: string | null
          name: string | null
          stack: string | null
        }
        Insert: {
          created_at?: string | null
          demo_url?: string | null
          description?: string | null
          git_url?: string | null
          id?: number
          image_path?: string | null
          name?: string | null
          stack?: string | null
        }
        Update: {
          created_at?: string | null
          demo_url?: string | null
          description?: string | null
          git_url?: string | null
          id?: number
          image_path?: string | null
          name?: string | null
          stack?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
