import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// MVP: 타입 제네릭 없이 사용 — 각 훅에서 반환 타입을 명시
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
