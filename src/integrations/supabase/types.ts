export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      items: {
        Row: {
          addons: string[] | null
          allergens: Json | null
          created_at: string | null
          EN: Json | null
          HU: Json | null
          HU_name: string | null
          id: string
          img: string | null
          nutrition: Json | null
          parents: string[] | null
          prices: Json | null
          pricesEUR: Json | null
          selfID: string | null
          sizes: Json | null
          SKU: string | null
          stock_available: boolean | null
          stock_inStock: boolean | null
          type: string | null
        }
        Insert: {
          addons?: string[] | null
          allergens?: Json | null
          created_at?: string | null
          EN?: Json | null
          HU?: Json | null
          HU_name?: string | null
          id?: string
          img?: string | null
          nutrition?: Json | null
          parents?: string[] | null
          prices?: Json | null
          pricesEUR?: Json | null
          selfID?: string | null
          sizes?: Json | null
          SKU?: string | null
          stock_available?: boolean | null
          stock_inStock?: boolean | null
          type?: string | null
        }
        Update: {
          addons?: string[] | null
          allergens?: Json | null
          created_at?: string | null
          EN?: Json | null
          HU?: Json | null
          HU_name?: string | null
          id?: string
          img?: string | null
          nutrition?: Json | null
          parents?: string[] | null
          prices?: Json | null
          pricesEUR?: Json | null
          selfID?: string | null
          sizes?: Json | null
          SKU?: string | null
          stock_available?: boolean | null
          stock_inStock?: boolean | null
          type?: string | null
        }
        Relationships: []
      }
      kiosks: {
        Row: {
          created_at: string | null
          id: string
          kiosk: number
          lastStartedDate: string | null
          location: string
          locationID: string | null
          operational: boolean
          posDeviceCode: string | null
          posRefreshToken: string | null
          posTerminalID: string | null
          posTerminalSerial: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kiosk: number
          lastStartedDate?: string | null
          location: string
          locationID?: string | null
          operational?: boolean
          posDeviceCode?: string | null
          posRefreshToken?: string | null
          posTerminalID?: string | null
          posTerminalSerial?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kiosk?: number
          lastStartedDate?: string | null
          location?: string
          locationID?: string | null
          operational?: boolean
          posDeviceCode?: string | null
          posRefreshToken?: string | null
          posTerminalID?: string | null
          posTerminalSerial?: string | null
        }
        Relationships: []
      }
      kockabarlang_reservations: {
        Row: {
          created_at: string
          end_date: string
          end_time: string
          id: string
          start_date: string
          start_time: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time: string
          id?: string
          start_date: string
          start_time: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string
          id?: string
          start_date?: string
          start_time?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kockabarlang_szulinapok: {
        Row: {
          birthday: string
          child: string
          created_at: string
          date: string
          email: string
          id: string
          message: string | null
          parent: string
          phone: string
          theme: string
          time: string
          updated_at: string
        }
        Insert: {
          birthday: string
          child: string
          created_at?: string
          date: string
          email: string
          id?: string
          message?: string | null
          parent: string
          phone: string
          theme: string
          time: string
          updated_at?: string
        }
        Update: {
          birthday?: string
          child?: string
          created_at?: string
          date?: string
          email?: string
          id?: string
          message?: string | null
          parent?: string
          phone?: string
          theme?: string
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      kockabarlang_szulinapthemes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          id: number
          location: string
          orderNumber: number
          posCity: string | null
          posCountry: string | null
          posStoreID: string | null
          posStreetAddress1: string | null
          posStreetAddress2: string | null
          posZipCode: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          location?: string
          orderNumber?: number
          posCity?: string | null
          posCountry?: string | null
          posStoreID?: string | null
          posStreetAddress1?: string | null
          posStreetAddress2?: string | null
          posZipCode?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          location?: string
          orderNumber?: number
          posCity?: string | null
          posCountry?: string | null
          posStoreID?: string | null
          posStreetAddress1?: string | null
          posStreetAddress2?: string | null
          posZipCode?: string | null
        }
        Relationships: []
      }
      nyirok_locations: {
        Row: {
          created_at: string
          id: string
          location: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nyirok_personnel: {
        Row: {
          calendar_id: string | null
          created_at: string
          description: string | null
          expert: boolean
          id: string
          key: string
          location_id: string | null
          name: string
          rank: number
          role: string
          service_ids: string[] | null
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          expert?: boolean
          id?: string
          key: string
          location_id?: string | null
          name: string
          rank?: number
          role: string
          service_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          expert?: boolean
          id?: string
          key?: string
          location_id?: string | null
          name?: string
          rank?: number
          role?: string
          service_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nyirok_personnel_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "nyirok_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      nyirok_reservations: {
        Row: {
          birthday: string | null
          created_at: string
          date: string
          email: string
          id: string
          iranyitoszam: string | null
          location: string
          name: string
          notes: string | null
          phone: string
          service: string
          therapist: string
          therapist_link: string | null
          time: string
          updated_at: string
          utca: string | null
          varos: string | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          date: string
          email: string
          id?: string
          iranyitoszam?: string | null
          location: string
          name: string
          notes?: string | null
          phone: string
          service: string
          therapist: string
          therapist_link?: string | null
          time: string
          updated_at?: string
          utca?: string | null
          varos?: string | null
        }
        Update: {
          birthday?: string | null
          created_at?: string
          date?: string
          email?: string
          id?: string
          iranyitoszam?: string | null
          location?: string
          name?: string
          notes?: string | null
          phone?: string
          service?: string
          therapist?: string
          therapist_link?: string | null
          time?: string
          updated_at?: string
          utca?: string | null
          varos?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nyirok_reservations_therapist_link_fkey"
            columns: ["therapist_link"]
            isOneToOne: false
            referencedRelation: "nyirok_personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      nyirok_services: {
        Row: {
          created_at: string
          description: string | null
          fields: string[] | null
          id: string
          key: string
          name: string
          price: number
          time: number
          time_end: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: string[] | null
          id?: string
          key: string
          name: string
          price: number
          time: number
          time_end?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: string[] | null
          id?: string
          key?: string
          name?: string
          price?: number
          time?: number
          time_end?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          addons: string[] | null
          created_at: string | null
          currency: string | null
          id: string
          img: string | null
          item: string | null
          name: string | null
          parent: string | null
          price: number | null
          priceTotal: number | null
          quantity: number | null
          size: string | null
          sku: string | null
          status: string | null
          time: string | null
          time_string: string | null
          type: string | null
          user: string | null
        }
        Insert: {
          addons?: string[] | null
          created_at?: string | null
          currency?: string | null
          id?: string
          img?: string | null
          item?: string | null
          name?: string | null
          parent?: string | null
          price?: number | null
          priceTotal?: number | null
          quantity?: number | null
          size?: string | null
          sku?: string | null
          status?: string | null
          time?: string | null
          time_string?: string | null
          type?: string | null
          user?: string | null
        }
        Update: {
          addons?: string[] | null
          created_at?: string | null
          currency?: string | null
          id?: string
          img?: string | null
          item?: string | null
          name?: string | null
          parent?: string | null
          price?: number | null
          priceTotal?: number | null
          quantity?: number | null
          size?: string | null
          sku?: string | null
          status?: string | null
          time?: string | null
          time_string?: string | null
          type?: string | null
          user?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          created_at_fixed: string | null
          currency: string
          end: string | null
          equalizer_amount: number | null
          id: string
          invoice: Json | null
          kiosk: number | null
          language: string | null
          location: string | null
          logging: string | null
          orderNumber: number | null
          payment_type: string | null
          place: string | null
          posGatewayID: string | null
          posPaymentID: string | null
          posState: string | null
          priceTotal: number | null
          quantity: number | null
          receiptNumber: string | null
          start: string | null
          status: string | null
          stornoReceiptNumber: string | null
        }
        Insert: {
          created_at?: string
          created_at_fixed?: string | null
          currency?: string
          end?: string | null
          equalizer_amount?: number | null
          id?: string
          invoice?: Json | null
          kiosk?: number | null
          language?: string | null
          location?: string | null
          logging?: string | null
          orderNumber?: number | null
          payment_type?: string | null
          place?: string | null
          posGatewayID?: string | null
          posPaymentID?: string | null
          posState?: string | null
          priceTotal?: number | null
          quantity?: number | null
          receiptNumber?: string | null
          start?: string | null
          status?: string | null
          stornoReceiptNumber?: string | null
        }
        Update: {
          created_at?: string
          created_at_fixed?: string | null
          currency?: string
          end?: string | null
          equalizer_amount?: number | null
          id?: string
          invoice?: Json | null
          kiosk?: number | null
          language?: string | null
          location?: string | null
          logging?: string | null
          orderNumber?: number | null
          payment_type?: string | null
          place?: string | null
          posGatewayID?: string | null
          posPaymentID?: string | null
          posState?: string | null
          priceTotal?: number | null
          quantity?: number | null
          receiptNumber?: string | null
          start?: string | null
          status?: string | null
          stornoReceiptNumber?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_member: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "therapist" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "therapist", "staff"],
    },
  },
} as const
