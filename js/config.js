/**
 * AURA 2026 — registration config
 * ---------------------------------------------------------
 * CLOSED until rules PDFs + official payment QR are final.
 *
 * Already wired (demo today · live when keys flipped):
 *   multi-step form · fee display · QR step · screenshot
 *   localStorage demo · Supabase insert/upload · admin desk
 *   verify / reject · CSV · confirmation email hook
 *
 * You still provide later:
 *   1. feeRupees / feeByCategory per sport
 *   2. assets/payment-qr.png (official UPI/bank QR)
 *   3. SUPABASE_URL + SUPABASE_ANON_KEY
 *   4. REGISTRATION_OPEN: true
 *   5. Run supabase/schema.sql · set ADMIN_EMAILS
 *   6. Deploy edge function send-confirmation (Resend)
 *   7. Optional: rules PDF links per sport (RULES_PDF_PATH)
 */
window.AURA_CONFIG = {
  REGISTRATION_OPEN: false,

  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  /** Official payment QR — drop file when finance finalises UPI/account */
  PAYMENT_QR_PATH: "assets/payment-qr.png",

  SITE_URL: "https://cbitaura.in",

  /**
   * Organiser logins for live admin (must match Supabase Auth emails
   * and RLS policies in supabase/schema.sql).
   * Example: ["aashayrajgrandhi@gmail.com"]
   */
  ADMIN_EMAILS: [],

  /**
   * Who gets an email the moment a team submits (pending).
   * Put real Gmail/college addresses — set the same list as Edge secret NOTIFY_EMAILS.
   * Example: ["aashayrajgrandhi@gmail.com", "parin@…"]
   */
  NOTIFY_ORGANISER_EMAILS: [],

  /**
   * Captain confirmation email after you click Verify.
   * From-address is set on the Edge Function (Resend), not here.
   * Recommended: noreply@cbitaura.in once Resend domain is verified.
   */
  CONFIRMATION_FROM_EMAIL: "",
  CONFIRMATION_FROM_NAME: "AURA 2026 · Chaitanya Kreeda",
  CONFIRMATION_REPLY_TO: "",

  /** Optional later: folder or per-sport PDFs e.g. assets/rules/basketball.pdf */
  RULES_PDF_BASE: "assets/rules/",

  /**
   * feeRupees: number | null
   *   null   → payment step shows “Fee TBA”
   *   number → “Pay ₹X” and pre-fill amount
   * feeByCategory: { men: 3500, women: 2000 }  (optional override)
   *
   * Basketball fees set as decided; others TBA until you confirm.
   */
  SPORTS: [
    { id: "cricket", name: "Cricket", categories: ["men"], feeRupees: null },
    {
      id: "basketball",
      name: "Basketball",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 3500, women: 2000 },
    },
    { id: "football", name: "Football", categories: ["men"], feeRupees: null },
    { id: "volleyball", name: "Volleyball", categories: ["men", "women"], feeRupees: null },
    { id: "kabaddi", name: "Kabaddi", categories: ["men"], feeRupees: null },
    { id: "throwball", name: "Throwball", categories: ["women"], feeRupees: null },
    { id: "badminton", name: "Badminton", categories: ["men", "women"], feeRupees: null },
    { id: "table-tennis", name: "Table Tennis", categories: ["men", "women"], feeRupees: null },
    { id: "chess", name: "Chess", categories: ["men", "women"], feeRupees: null },
    { id: "carroms", name: "Carroms", categories: ["men", "women"], feeRupees: null },
  ],

  /** Student coordinators (from sponsorship deck + fest captains) */
  COORDINATORS: [
    { name: "Aashay", phone: "+919390206134", role: "Student coordinator" },
    { name: "Parin", phone: "+919100100507", role: "Student coordinator" },
    { name: "Sohan", phone: "+919550527704", role: "Student coordinator" },
  ],

  /**
   * Rules sheets — shown in-site at rules.html?sport=<id>
   * Pipeline: drop file in assets/rules/ then add key here.
   * Value: string path OR { file: "…", title: "optional lead line" }
   * Supports .png / .jpg / .webp / .pdf
   */
  RULES_SHEETS: {
    basketball: {
      file: "assets/rules/basketball-rules.png",
      title: "Men & women · Fees, group stage, FIBA, squad size, and captains.",
    },
    // cricket: "assets/rules/cricket-rules.png",
    // football: "assets/rules/football-rules.pdf",
  },
};
