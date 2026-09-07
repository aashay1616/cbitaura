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
  REGISTRATION_OPEN: true,

  SUPABASE_URL: "https://jfrxlqpurrznwgltdkkj.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcnhscXB1cnJ6bndnbHRka2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NzE1NzQsImV4cCI6MjEwNDM0NzU3NH0.r3fNyY1IgIvqm0XB0wpnaCj0-vaMt87d8tvfxQpK_VE",

  /**
   * Payment scanners (UPI QR). First entry is default.
   * Add more objects later for alternate accounts / higher limits.
   * Each: { id, label, file, upiName?, note? }
   */
  PAYMENT_QRS: [
    {
      id: "saiteja-phonepe",
      label: "Official scanner · Saiteja Pampati (PhonePe)",
      file: "assets/payment-qr.png",
      upiName: "Saiteja Pampati",
    },
    // Example for later:
    // { id: "scanner-2", label: "Scanner 2 · …", file: "assets/payment-qrs/qr-2.png", upiName: "…" },
  ],

  /** @deprecated use PAYMENT_QRS[0].file — kept for older code paths */
  PAYMENT_QR_PATH: "assets/payment-qr.png",

  /** Show this note under every scanner (UPI device limits) */
  PAYMENT_SCAN_NOTE:
    "If the fee is more than ₹2,000, PhonePe/GPay on the same phone may block the scan. Use another device to scan this QR, or pay via UPI ID / bank transfer, then upload the screenshot.",

  SITE_URL: "https://cbitaura.in",

  /**
   * Shared Core Committee admin login (ONE account for everyone).
   * Must match Supabase Auth user + RLS emails in supabase/schema.sql.
   */
  ADMIN_EMAILS: ["aura.cbit.cc@gmail.com"],

  /**
   * Who gets an email when a team submits (pending).
   * Can be personal inboxes even if admin login is shared.
   * Also set the same list as Edge secret NOTIFY_EMAILS when emails go live.
   */
  NOTIFY_ORGANISER_EMAILS: [
    "aashayrajgrandhi@gmail.com",
    // add Parin / Sohan personal emails for alerts if you want
  ],

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
  // Fees — latest captain / CC list
  SPORTS: [
    { id: "cricket", name: "Cricket", categories: ["men"], feeRupees: 6000 },
    {
      id: "basketball",
      name: "Basketball",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 3500, women: 2500 },
    },
    { id: "football", name: "Football", categories: ["men"], feeRupees: 4000 },
    {
      id: "volleyball",
      name: "Volleyball",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 2500, women: 2000 },
    },
    {
      id: "kabaddi",
      name: "Kabaddi",
      categories: ["men"],
      feeRupees: 2500,
    },
    { id: "throwball", name: "Throwball", categories: ["women"], feeRupees: 2500 },
    {
      id: "badminton",
      name: "Badminton",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 2500, women: 2000 },
    },
    {
      id: "table-tennis",
      name: "Table Tennis",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 2000, women: 2000 },
    },
    {
      id: "chess",
      name: "Chess",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 1000, women: 1000 },
    },
    {
      id: "carroms",
      name: "Carroms",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 1000, women: 1000 },
    },
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
    cricket: {
      file: "assets/rules/cricket-rules.png",
      title: "Men · Eligibility, squad lock, T20 format, powerplay, and contacts.",
    },
    volleyball: {
      file: "assets/rules/volleyball-rules.png",
      title: "Men & women · Fees, squad, sets, net height, and captains.",
    },
    kabaddi: {
      file: "assets/rules/kabaddi-rules.png",
      title: "Men · Fees, raid timing, scoring, halves, and captains.",
    },
    throwball: {
      file: "assets/rules/throwball-rules.png",
      title: "Women · Court specs, catch-throw rules, scoring, and captains.",
    },
    badminton: {
      file: "assets/rules/badminton-rules.png",
      title: "Men & women · Fees, tie format, shuttle, BWF rules, and captains.",
    },
    carroms: {
      file: "assets/rules/carroms-rules.png",
      title: "Men & women · Fees, tie format, OU laws, squad size, and captains.",
    },
    "table-tennis": {
      file: "assets/rules/table-tennis-rules.png",
      title: "Men & women · Fees, formats, scoring, equipment, and captains.",
    },
    chess: {
      file: "assets/rules/chess-rules.png",
      title: "Open · Fees, Swiss format, FIDE rules, time control, and captains.",
    },
    football: {
      file: "assets/rules/football-rules.png",
      title: "Men · Eligibility, format, duration, extras, and contacts.",
    },
  },
};
