export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          user_id: string | null;
          client_name: string | null;
          client_email: string | null;
          client_phone: string | null;
          title: string | null;
          date: string | null;
          time: string | null;
          type: string | null;
          method: string | null;
          status: string | null;
          notes: string | null;
          attorney: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          title?: string | null;
          date?: string | null;
          time?: string | null;
          type?: string | null;
          method?: string | null;
          status?: string | null;
          notes?: string | null;
          attorney?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          client_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          title?: string | null;
          date?: string | null;
          time?: string | null;
          type?: string | null;
          method?: string | null;
          status?: string | null;
          notes?: string | null;
          attorney?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      attorney_unavailable_slots: {
        Row: {
          id: string;
          date: string | null;
          time: string | null;
          reason: string | null;
        };
        Insert: {
          id?: string;
          date?: string | null;
          time?: string | null;
          reason?: string | null;
        };
        Update: {
          id?: string;
          date?: string | null;
          time?: string | null;
          reason?: string | null;
        };
        Relationships: [];
      };
      email_verification_tokens: {
        Row: {
          id: string;
          email: string | null;
          token: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          token?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          token?: string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          id: string;
          section: string | null;
          content: Json | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          section?: string | null;
          content?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          section?: string | null;
          content?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
