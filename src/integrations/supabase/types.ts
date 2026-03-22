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
      eventos: {
        Row: any;
        Insert: any;
        Update: any;
      };
      inscricoes: {
        Row: any;
        Insert: any;
        Update: any;
      };
      contatos: {
        Row: any;
        Insert: any;
        Update: any;
      };
      doacoes: {
        Row: any;
        Insert: any;
        Update: any;
      };
      dizimo: {
        Row: any;
        Insert: any;
        Update: any;
      };
      [key: string]: any;
    }
    Views: {
      [key: string]: any;
    }
    Functions: {
      [key: string]: any;
    }
    Enums: {
      [key: string]: any;
    }
  }
}
