/**
 * AURA 2026 — registration config
 * Fill Supabase keys when ready. Leave empty = demo mode (localStorage).
 * Payment QR: put image at assets/payment-qr.png when you have it.
 */
window.AURA_CONFIG = {
  // Flip true when forms should accept real submissions
  REGISTRATION_OPEN: false,

  // Supabase project (https://supabase.com)
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Public paths
  PAYMENT_QR_PATH: "assets/payment-qr.png",
  SITE_URL: "https://cbitaura.in",

  // Admin emails allowed to use admin.html (must match auth user email)
  // Also set the same list in Supabase RLS policies
  ADMIN_EMAILS: [],

  // Sports offered (mirrors site)
  SPORTS: [
    { id: "cricket", name: "Cricket", categories: ["men"], teamMin: 11, teamMax: 15 },
    { id: "basketball", name: "Basketball", categories: ["men", "women"], teamMin: 5, teamMax: 12 },
    { id: "football", name: "Football", categories: ["men"], teamMin: 11, teamMax: 18 },
    { id: "volleyball", name: "Volleyball", categories: ["men", "women"], teamMin: 6, teamMax: 12 },
    { id: "kabaddi", name: "Kabaddi", categories: ["men"], teamMin: 7, teamMax: 12 },
    { id: "throwball", name: "Throwball", categories: ["women"], teamMin: 7, teamMax: 12 },
    { id: "badminton", name: "Badminton", categories: ["men", "women"], teamMin: 1, teamMax: 4 },
    { id: "table-tennis", name: "Table Tennis", categories: ["men", "women"], teamMin: 1, teamMax: 4 },
    { id: "chess", name: "Chess", categories: ["men", "women"], teamMin: 1, teamMax: 4 },
    { id: "carroms", name: "Carroms", categories: ["men", "women"], teamMin: 1, teamMax: 4 },
  ],
};
