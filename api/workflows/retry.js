import { assertAdmin, getSupabaseAdmin } from "../_lib/supabase-admin.js";
import { handleError, HttpError, json, readJson } from "../_lib/http.js";

export const config = { runtime: "nodejs" };

export async function POST(request) {
  try {
    await assertAdmin(request);
    const { workflow_run_id: id } = await readJson(request);
    if (!id) throw new HttpError(422, "workflow_run_id is required");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("workflow_runs").update({
      status: "retrying", error_message: null, next_retry_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "failed").select().maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(409, "Only failed workflows can be retried");
    return json({ workflow: data });
  } catch (error) { return handleError(error); }
}
