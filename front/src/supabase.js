import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xdccatqqesubxzamdpej.supabase.co";
const supabaseKey = "sb_publishable_Ro8LKu7bPBWCC2ZLKN0q6A_35nHQCD1";

export const supabase = createClient(supabaseUrl, supabaseKey);