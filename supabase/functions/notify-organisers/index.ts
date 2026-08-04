/**
 * Notify organisers when a team submits a registration.
 * Deploy: supabase functions deploy notify-organisers
 * Secrets: RESEND_API_KEY, CONFIRMATION_FROM, NOTIFY_EMAILS (comma-separated)
 *
 * Called after public insert succeeds (registration.js live path).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

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
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from =
      Deno.env.get("CONFIRMATION_FROM") ||
      "AURA 2026 <onboarding@resend.dev>";
    const notifyRaw =
      Deno.env.get("NOTIFY_EMAILS") ||
      Deno.env.get("ORGANISER_EMAILS") ||
      "";
    const to = notifyRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!resendKey || !to.length) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: !resendKey ? "no RESEND_API_KEY" : "no NOTIFY_EMAILS",
        }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const site = Deno.env.get("SITE_URL") || "https://cbitaura.in";
    const subject = `[AURA] New registration · ${reg.sport} · ${reg.college_name} · ${reg.ref_code}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0a0e16">
        <h2 style="margin:0 0 8px">New team registration (pending)</h2>
        <p style="color:#444">A captain submitted payment proof. Review and verify in the admin desk.</p>
        <table style="font-size:14px;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#666">Ref</td><td><strong>${reg.ref_code}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">College</td><td>${reg.college_name}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Sport</td><td>${reg.sport} · ${reg.category}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Captain</td><td>${reg.captain_name}<br>${reg.captain_phone}<br>${reg.captain_email}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">PD</td><td>${reg.pd_name || "—"} · ${reg.pd_phone || ""}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Fee / paid</td><td>${reg.fee_expected ?? "TBA"} / ${reg.payment_amount || "—"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">UTR</td><td>${reg.payment_txn_id || "—"}</td></tr>
        </table>
        <p><a href="${site}/admin.html" style="display:inline-block;padding:10px 16px;background:#3a66d6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open admin desk</a></p>
      </div>
    `;

    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!mailRes.ok) {
      return new Response(JSON.stringify({ error: await mailRes.text() }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, notified: to.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
