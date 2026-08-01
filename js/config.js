/**
 * AURA 2026 — registration config
 * ---------------------------------------------------------
 * CLOSED until rules + fees + payment QR are final.
 *
 * Go live:
 *   1. Set feeRupees (or feeByCategory) per sport
 *   2. Drop official QR → assets/payment-qr.png
 *   3. Fill SUPABASE_URL + SUPABASE_ANON_KEY
 *   4. Set REGISTRATION_OPEN: true
 *   5. Run supabase/schema.sql + replace admin emails
 *
 * Form fields: sport, category, name, phone, email,
 * college, PD name, PD phone → fee + QR payment.
 */
window.AURA_CONFIG = {
  REGISTRATION_OPEN: false,

  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  PAYMENT_QR_PATH: "assets/payment-qr.png",
  SITE_URL: "https://cbitaura.in",

  // Used later for live admin auth checks (match schema RLS emails)
  ADMIN_EMAILS: [],

  /**
   * feeRupees: number | null
   *   null   → payment step shows “Fee TBA”
   *   number → “Pay ₹X” and pre-fill amount
   * feeByCategory: { men: 2000, women: 1500 }  (optional override)
   */
  SPORTS: [
    { id: "cricket", name: "Cricket", categories: ["men"], feeRupees: null },
    { id: "basketball", name: "Basketball", categories: ["men", "women"], feeRupees: null },
    { id: "football", name: "Football", categories: ["men"], feeRupees: null },
    { id: "volleyball", name: "Volleyball", categories: ["men", "women"], feeRupees: null },
    { id: "kabaddi", name: "Kabaddi", categories: ["men"], feeRupees: null },
    { id: "throwball", name: "Throwball", categories: ["women"], feeRupees: null },
    { id: "badminton", name: "Badminton", categories: ["men", "women"], feeRupees: null },
    { id: "table-tennis", name: "Table Tennis", categories: ["men", "women"], feeRupees: null },
    { id: "chess", name: "Chess", categories: ["men", "women"], feeRupees: null },
    { id: "carroms", name: "Carroms", categories: ["men", "women"], feeRupees: null },
  ],
};
