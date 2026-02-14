import { createClient } from "@/lib/supabase/server";

export type ActivityAction = 
  | "login" 
  | "view_resource" 
  | "complete_resource" 
  | "ai_chat" 
  | "ai_image" 
  | "ai_code";

export async function logActivity(actionType: ActivityAction, resourceId?: string, metadata: any = {}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("user_activity").upsert({
    user_id: user.id,
    action_type: actionType,
    resource_id: resourceId || null,
    metadata,
    created_at: new Date().toISOString()
  }, {
    onConflict: "user_id,resource_id,action_type"
  });

  if (error) {
    console.error("Failed to log activity:", error);
  }
}
