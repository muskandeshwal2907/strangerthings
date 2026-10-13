import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pxlbktdaldicbtrtbqxu.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_iKT9y41Wq-DcLheDzYkE6Q_W1uxW8V_";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
