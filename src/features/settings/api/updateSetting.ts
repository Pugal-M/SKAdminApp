import { supabase } from "../../../lib/supabase";

export async function updateSetting(key: string, value: any, adminId: string): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .update({ 
      value,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    })
    .eq("key", key);

  if (error) {
    throw new Error(error.message);
  }
}
