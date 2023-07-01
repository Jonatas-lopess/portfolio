import { Database } from "@/types_db"
import { createClient } from "@supabase/supabase-js"

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

const supabase =  createClient<Database>(
        supabaseUrl,
        supabaseKey
    );

export default supabase;