export interface User {
  id: number;
  email: string;
  password?: string; // Password should not always be present in User objects
  created_at?: string;
  updated_at?: string;
}

export interface PersonalAccessToken {
  id: number;
  user_id: number;
  name: string;
  token: string; // This will be the hashed token
  abilities: string; // JSON string
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
