/**
 * Supabase Edge Function: send-confirmation
 * Deploy when going live:
 *   supabase functions deploy send-confirmation
 * Set secrets:
 *   RESEND_API_KEY=re_...
 *   CONFIRMATION_FROM="AURA 2026 <noreply@cbitaura.in>"
 *
 * Called by admin.js after status → verified.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { ref_code } = await req.json();
    if (!ref_code) {
      return new Response(JSON.stringify({ error: "ref_code required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: reg, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("ref_code", ref_code)
      .single();

    if (error || !reg) {
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (reg.status !== "verified") {
      return new Response(JSON.stringify({ error: "Not verified yet" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const from =
      Deno.env.get("CONFIRMATION_FROM") ||
      "AURA 2026 · Chaitanya Kreeda <onboarding@resend.dev>";
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY not set — email skipped",
          ref_code,
        }),
        { status: 501, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const subject = `AURA 2026 · Registration confirmed · ${reg.ref_code}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0a0e16">
        <h1 style="font-size:22px;margin:0 0 8px">You're in — AURA 2026</h1>
        <p style="color:#444;line-height:1.5">
          Hi ${reg.captain_name}, your team registration has been <strong>verified</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0"><strong>${reg.ref_code}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666">College</td><td style="padding:6px 0">${reg.college_name}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Sport</td><td style="padding:6px 0">${reg.sport} · ${reg.category}</td></tr>
        </table>
        <p style="color:#444;line-height:1.5">
          Keep this email. Bring Aadhaar, college ID, and portal access on match days as required.
        </p>
        <p style="color:#888;font-size:12px;margin-top:24px">
          Chaitanya Kreeda · CBIT · <a href="https://cbitaura.in">cbitaura.in</a>
        </p>
      </div>
    `;

    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [reg.captain_email],
        subject,
        html,
      }),
    });

    if (!mailRes.ok) {
      const errText = await mailRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", detail: errText }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("registrations")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("ref_code", ref_code);

    return new Response(JSON.stringify({ ok: true, ref_code }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
