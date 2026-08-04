/**
 * AURA 2026 — registration config (full pipeline scaffolded)
 * ---------------------------------------------------------
 * REGISTRATION_OPEN stays false until:
 *   • assets/payment-qr.png (real UPI/bank QR)
 *   • rules for sports you want open (RULES_SHEETS)
 *   • fees set per sport
 *   • Supabase keys + Resend Edge Functions (see GO-LIVE.md)
 *
 * Pipeline already wired:
 *   form → pending → notify organisers → admin verify/reject
 *   → captain confirmation email · rules viewer · CSV export
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
    // Uncomment + add files under assets/rules/ when ready:
    // cricket: { file: "assets/rules/cricket-rules.png", title: "Cricket · AURA 2026" },
    // football: { file: "assets/rules/football-rules.png", title: "Football · AURA 2026" },
    // volleyball: { file: "assets/rules/volleyball-rules.png", title: "Volleyball · AURA 2026" },
    // kabaddi: { file: "assets/rules/kabaddi-rules.png", title: "Kabaddi · AURA 2026" },
    // throwball: { file: "assets/rules/throwball-rules.png", title: "Throwball · AURA 2026" },
    // badminton: { file: "assets/rules/badminton-rules.png", title: "Badminton · AURA 2026" },
    // "table-tennis": { file: "assets/rules/table-tennis-rules.png", title: "Table Tennis · AURA 2026" },
    // chess: { file: "assets/rules/chess-rules.png", title: "Chess · AURA 2026" },
    // carroms: { file: "assets/rules/carroms-rules.png", title: "Carroms · AURA 2026" },
  },
};
