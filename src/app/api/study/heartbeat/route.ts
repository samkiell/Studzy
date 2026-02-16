import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Call the RPC function to increment time securely
    // We increment by 10 seconds per heartbeat
    const { error: rpcError } = await supabase.rpc('increment_study_time', { 
      increment_seconds: 10 
    });

    if (rpcError) {
      console.error("RPC Error incrementing study time:", rpcError);
      
      // Fallback: Direct update if RPC is not yet created
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_study_seconds')
        .eq('id', user.id)
        .single();
        
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          total_study_seconds: (profile?.total_study_seconds || 0) + 10 
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Study heartbeat error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to log study time" 
    }, { status: 500 });
  }
}
