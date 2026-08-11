import { supabase } from "../../../lib/supabase";

export async function updateUserRole(userId: string, roleId: string): Promise<void> {
  // First, check if a role already exists for the user
  const { data: existingRoles, error: checkError } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (existingRoles && existingRoles.length > 0) {
    // Update existing role
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({ role_id: roleId })
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    // Insert new role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert([
        {
          user_id: userId,
          role_id: roleId,
        }
      ]);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}
