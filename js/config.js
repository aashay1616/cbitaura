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
   * Payment scanners (UPI QR). Each sport shows the scanner(s) that apply to it.
   * Each: { id, label, file, upiName?, upiId?, sports?, excludeSports? }
   *   sports         → ONLY these sport ids use this scanner
   *   excludeSports  → every sport EXCEPT these uses this scanner
   * Scanners with neither field apply to all sports.
   */
  PAYMENT_QRS: [
    // College account (ICICI Eazypay merchant QR) — every sport except cricket.
    {
      id: "cbit-student-activities",
      label: "CBIT Student Activities",
      file: "assets/payment-qrs/qr-college-student-activities.png",
      upiName: "CBITSTUDENTACTIVITIES",
      scanNote:
        "If the fee is more than ₹2,000, PhonePe/GPay on the same phone may block the scan. Use another phone to scan this QR, then upload the screenshot and UTR.",
      excludeSports: ["cricket"],
    },
    // Cricket only.
    {
      id: "saiteja-phonepe",
      label: "Saiteja Pampati",
      file: "assets/payment-qr.png",
      upiName: "Saiteja Pampati",
      upiId: "6303916754-2@ybl",
      sports: ["cricket"],
    },
    // Parked (not shown on the site). To re-enable, uncomment this entry —
    // the QR image is already at assets/payment-qr-2.png.
    // {
    //   id: "pranathi-upi",
    //   label: "Pranathi Yadav",
    //   file: "assets/payment-qr-2.png",
    //   upiName: "Pranathi Yadav",
    //   upiId: "pranathiyadav869@okicici",
    // },
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
    {
      id: "cricket",
      name: "Cricket",
      categories: ["men"],
      feeRupees: 6000,
      eventDates: "Starts 26 September 2026",
      eventDatesNote:
        "Cricket begins on 26 September 2026 (ahead of the main fest window of 7–9 October). Only the first 16 team registrations will be accepted.",
      capacityNote: "Limited to the first 16 team registrations.",
      closed: true,
      closedNote: "Cricket registrations are now closed.",
    },
    {
      id: "basketball",
      name: "Basketball",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 3500, women: 3000 },
      closed: true,
      closedNote: "Basketball registrations are now closed (men and women). For any queries, please contact Aashay: 9390206134.",
    },
    {
      id: "football",
      name: "Football",
      categories: ["men"],
      feeRupees: 4000,
      eventDates: "6–8 October 2026",
      eventDatesNote:
        "Football is scheduled 6–8 October 2026 (ahead of the main fest window of 7–9 October). Only the first 15 team registrations will be accepted.",
              capacityNote: "Limited to the first 15 team registrations.",
         closed: true,
         closedNote: "Football registrations are now closed. All 15 team slots are filled.",
       },
    {
      id: "volleyball",
      name: "Volleyball",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 2500, women: 2500 },
      closed: true,
      closedNote: "Volleyball registrations are now closed.",
    },
    {
      id: "kabaddi",
      name: "Kabaddi",
      categories: ["men"],
      feeRupees: 2500,
      closed: true,
      closedNote: "Kabaddi registrations are now closed.",
    },
    {
      id: "throwball",
      name: "Throwball",
      categories: ["women"],
      feeRupees: 2500,
      closed: true,
      closedNote: "Throwball registrations are now closed.",
    },
    {
      id: "badminton",
      name: "Badminton",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 2500, women: 2000 },
      closed: true,
      closedNote: "Badminton registrations are now closed.",
    },
    {
      id: "table-tennis",
      name: "Table Tennis",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 2000, women: 2000 },
      closed: true,
      closedNote: "Table Tennis registrations are now closed.",
    },
    {
      id: "chess",
      name: "Chess",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 1000, women: 1000 },
      closed: true,
      closedNote: "Chess registrations are now closed.",
    },
    {
      id: "carroms",
      name: "Carroms",
      categories: ["men", "women"],
      feeRupees: null,
      feeByCategory: { men: 1000, women: 1000 },
      closed: true,
      closedNote: "Carroms registrations are now closed.",
    },
  ],

  /**
   * Admin "Confirmed teams & money": every verified team counts at the fee it was charged
   * (fee_expected), as if paid in full. `sportTotals` replaces a sport's sum with an agreed
   * total; `extras` are one-off additions.
   */
  REVENUE_ADJUST: {
    sportTotals: { cricket: 81000 },
    extras: [{ label: "Extra received (CMRIT)", amount: 500 }],
  },

  /**
   * College grouping for the admin desk: one college can be typed many ways
   * ("Cmrit", "CMR institute of technology", ...). Any `match` phrase found in the
   * typed name (whole words, case-insensitive) puts the entry under `name`.
   * Colleges not listed here are grouped by their exact spelling.
   */
  COLLEGE_ALIASES: [
    { name: "CBIT", match: ["cbit", "chaitanya bharathi"] },
    { name: "MGIT", match: ["mgit", "mahatma gandhi institute"] },
    { name: "CMR Institute of Technology", match: ["cmrit", "cmr institute of technology"] },
    { name: "CMR College of Engineering & Technology", match: ["cmrcet", "cmr college of engineering"] },
    { name: "CVR College of Engineering", match: ["cvr"] },
    { name: "VNR VJIET", match: ["vnr", "vallurupalli nageswara rao"] },
    { name: "Vidya Jyothi Institute of Technology (VJIT)", match: ["vjit", "vidya jyothi"] },
    { name: "GRIET", match: ["griet", "gokaraju rangaraju"] },
    { name: "G. Narayanamma Institute of Technology & Science", match: ["g narayanamma", "gnits", "narayanamma"] },
    { name: "Gurunanak Institute of Technology (GNIT)", match: ["gnit", "gurunanak", "guru nanak"] },
    { name: "JBIET", match: ["jbiet", "jb institution", "jb institute"] },
    { name: "IIIT Hyderabad", match: ["iiit", "international institute of information technology"] },
    { name: "HITAM", match: ["hitam", "hyderabad institute of technology"] },
    { name: "ICFAI", match: ["icfai"] },
    { name: "Anurag University", match: ["anurag"] },
    { name: "Mahindra University", match: ["mahindra"] },
    { name: "NIAT", match: ["niat"] },
    { name: "KL University", match: ["klhu", "kl university", "klu"] },
    { name: "Vasavi College of Engineering", match: ["vasavi"] },
    { name: "MLRIT", match: ["mlrit", "marri laxman"] },
    { name: "Sreenidhi (SNIST)", match: ["sreenidhi", "snist"] },
    { name: "ISL Engineering College", match: ["isl"] },
    { name: "Osmania University College of Engineering", match: ["osmania"] },
    { name: "Mallareddy University", match: ["mallareddy", "malla reddy university"] },
    { name: "Muffakham Jah College of Engineering", match: ["muffakhan", "muffakham", "mjcet"] },
    { name: "Vardhaman College of Engineering", match: ["vardhaman"] },
    { name: "Keshav Memorial Engineering College", match: ["keshav memorial engineering"] },
    { name: "Keshav Memorial Institute of Technology", match: ["keshav memorial institute", "kmit"] },
  ],

  /**
   * "Standard" teams — host / automatic entries that are listed in the admin team
   * list but NOT counted in the website's registration numbers (and not payment-checked).
   *   match  → lower-case phrases looked for in the college name a team types in
   *   sports → optional: only these sport ids (omit = every sport and category)
   */
  STANDARD_TEAMS: [
    { name: "CBIT", match: ["cbit", "chaitanya bharathi"] },
    { name: "MGIT", match: ["mgit", "mahatma gandhi institute"] },
  ],

  /** Student coordinators (from sponsorship deck + fest captains) */
  COORDINATORS: [
    { name: "Pranathi", phone: "+918019242606", role: "Student coordinator" },
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
      title: "Men · Starts 26 September 2026 · Fee, format, and contacts.",
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
      title: "Team event · Swiss system, scoring, board order, and contacts.",
    },
    football: {
      file: "assets/rules/football-rules.png",
      title: "Men · 6–8 October 2026 · Eligibility, format, and contacts.",
    },
  },
};
