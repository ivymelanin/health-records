import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('SUPABASE URL:', supabaseUrl);
console.log(
  'SUPABASE KEY EXISTS:',
  !!supabaseAnonKey
);

if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is missing'
  );
}

if (!supabaseUrl.startsWith('https://') &&
    !supabaseUrl.startsWith('http://')) {
  throw new Error(
    `Invalid Supabase URL format: ${supabaseUrl}`
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);