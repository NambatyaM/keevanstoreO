const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, HeadingLevel, PageNumber, PageBreak, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, TableOfContents } = require("docx");
const fs = require("fs");

// Color palette — Warm tech (Cool + Light + Active)
const P = {
  primary: "#0A1628",
  body: "#1A2B40",
  secondary: "#6878A0",
  accent: "#5B8DB8",
  surface: "#F4F8FC",
};
const c = (hex) => hex.replace("#", "");

// Helper: heading
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

// Helper: body paragraph
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } })],
  });
}

// Helper: body paragraph with no indent (for lists, code, etc.)
function bodyNoIndent(text) {
  return new Paragraph({
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } })],
  });
}

// Helper: bold label + normal text
function labelBody(label, text) {
  return new Paragraph({
    spacing: { line: 312, after: 60 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
    ],
  });
}

// Helper: code block style paragraph
function codeBlock(text) {
  return new Paragraph({
    spacing: { line: 276, after: 40 },
    indent: { left: 480 },
    children: [new TextRun({ text, size: 20, color: "2D3748", font: { ascii: "Consolas", eastAsia: "Consolas" } })],
  });
}

// Helper: bullet point
function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { line: 312, after: 60 },
    indent: { left: 480 + level * 360 },
    children: [
      new TextRun({ text: "\u2022 ", size: 24, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
    ],
  });
}

// Helper: numbered point
function numbered(num, text) {
  return new Paragraph({
    spacing: { line: 312, after: 60 },
    indent: { left: 480 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
    ],
  });
}

// Helper: separator
function separator() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    children: [new TextRun({ text: "\u2500".repeat(60), size: 16, color: c(P.secondary) })],
  });
}

// Build document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // COVER SECTION
    {
      properties: {
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          size: { width: 11906, height: 16838 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 4800 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "KEEVAN STORE", size: 72, bold: true, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Production-Ready AI Audit & Fix Prompt", size: 40, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Complete Bug-Fixing, Code Optimization & Deployment Guide", size: 28, color: c(P.secondary), font: { ascii: "Calibri" } })],
        }),
        separator(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Version 1.0  |  June 2026", size: 22, color: c(P.secondary), font: { ascii: "Calibri" } })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "For: NambatyaM / keevan-store", size: 22, color: c(P.secondary), font: { ascii: "Calibri" } })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Target: GitHub + Vercel Production Deployment", size: 22, color: c(P.secondary), font: { ascii: "Calibri" } })],
        }),
      ],
    },
    // TABLE OF CONTENTS + BODY
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          size: { width: 11906, height: 16838 },
          pageNumbers: { start: 1 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Keevan Store ", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary), font: { ascii: "Calibri" } }),
              ],
            }),
          ],
        }),
      },
      children: [
        // TOC
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          children: [new PageBreak()],
        }),

        // ================================================================
        // SECTION 1: THE MASTER PROMPT
        // ================================================================
        heading("1. The Master AI Audit & Fix Prompt"),
        body("Below is the complete, copy-paste-ready prompt you should give to an AI coding assistant (Claude, ChatGPT, Cursor, Copilot, etc.) to perform a full production-readiness audit, bug fix, code optimization, and deployment preparation of the Keevan Store project. This prompt is designed to be exhaustive and force the AI to examine every single file, fix every bug, remove unnecessary code, and ensure the application is 100% production-ready for Vercel deployment."),

        separator(),
        new Paragraph({
          spacing: { before: 120, after: 120 },
          shading: { type: ShadingType.CLEAR, fill: "F0F4F8" },
          children: [new TextRun({ text: "  COPY THE PROMPT BELOW THIS LINE", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        separator(),

        // The actual prompt text - written as code-style paragraphs
        codeBlock("---PROMPT START---"),
        codeBlock(""),
        codeBlock("You are a senior full-stack engineer tasked with performing a COMPLETE production-readiness audit, bug fix, code optimization, and deployment preparation of the Keevan Store project. This is a Next.js 16 (App Router) application with Supabase (PostgreSQL), Prisma ORM (SQLite for local dev), Pesapal payment integration (LIVE mode), Cloudflare R2 file storage, and shadcn/ui components."),
        codeBlock(""),
        codeBlock("PROJECT OVERVIEW:"),
        codeBlock("Keevan Store is a creator commerce platform for Ugandan creators to sell digital products, event tickets, and accept donations via mobile money payments (MTN MoMo, Airtel Money). The production domain is keevanstore.in."),
        codeBlock(""),
        codeBlock("YOUR MANDATE - YOU MUST DO ALL OF THE FOLLOWING IN ORDER:"),
        codeBlock(""),
        codeBlock("PHASE 1: EXHAUSTIVE FILE-BY-FILE AUDIT (NO SKIPPING)"),
        codeBlock("You must read and analyze EVERY file in the project. Do NOT skip any file. For each file, identify:"),
        codeBlock("  - TypeScript type errors (mismatched types, missing properties, incorrect casts)"),
        codeBlock("  - Import/export errors (missing imports, wrong paths, circular dependencies)"),
        codeBlock("  - Runtime bugs (null reference errors, unhandled promises, race conditions)"),
        codeBlock("  - Logic errors (incorrect business logic, wrong calculations, missing validations)"),
        codeBlock("  - Security vulnerabilities (SQL injection, XSS, exposed secrets, missing auth checks)"),
        codeBlock("  - Dead code (unused imports, unreachable code, deprecated functions)"),
        codeBlock("  - Redundant or duplicate code that can be consolidated"),
        codeBlock("  - Missing error handling (try/catch blocks, error boundaries, fallbacks)"),
        codeBlock("  - Inconsistent data handling (snake_case vs camelCase mismatches between Supabase and TypeScript types)"),
        codeBlock(""),
        codeBlock("PHASE 2: FIX ALL BUGS AND ERRORS"),
        codeBlock("After completing the audit, fix EVERY issue found. Rules for fixing:"),
        codeBlock("  - Fix TypeScript errors by adding correct types, not by using 'any' or @ts-ignore"),
        codeBlock("  - Fix import paths using the @/ alias consistently"),
        codeBlock("  - Fix all null/undefined reference errors with proper null checks and optional chaining"),
        codeBlock("  - Fix all async/await issues (missing awaits, unhandled promise rejections)"),
        codeBlock("  - Fix all business logic errors (fee calculations, status transitions, capacity checks)"),
        codeBlock("  - Add proper error handling where missing (try/catch, error responses, fallbacks)"),
        codeBlock("  - Fix all security issues (input validation, auth checks on protected routes, sanitization)"),
        codeBlock("  - Ensure the dual data layer (mock + real Supabase) works correctly in both modes"),
        codeBlock("  - Ensure all API routes return proper error responses with correct status codes"),
        codeBlock("  - Fix the Prisma schema to match the Supabase schema exactly (both must be in sync)"),
        codeBlock("  - Fix the db-mappers.ts to handle all edge cases in snake_case/camelCase conversion"),
        codeBlock(""),
        codeBlock("PHASE 3: REMOVE UNNECESSARY CODE AND FILES"),
        codeBlock("Clean up the project by removing:"),
        codeBlock("  - Files that are NOT needed for production deployment:"),
        codeBlock("    - Caddyfile (this is for local reverse proxy, NOT needed on Vercel)"),
        codeBlock("    - examples/ directory (reference code, not used in production)"),
        codeBlock("    - agent-ctx/ directory (build context, not needed in production)"),
        codeBlock("    - generate_report.py, generate_audit_report.py, generate_audit_report_v2.py, generate_manual_actions.py (audit scripts, not part of the app)"),
        codeBlock("    - Any .bak files (examples/websocket/*.bak)"),
        codeBlock("    - download/ directory (generated reports, not part of the app)"),
        codeBlock("    - db/custom.db (local SQLite database, not used on Vercel with Supabase)"),
        codeBlock("    - bun.lock (if using npm, this is not needed; keep package-lock.json)"),
        codeBlock("  - Unused imports in every file"),
        codeBlock("  - Unused variables and functions"),
        codeBlock("  - Duplicate logic that can be consolidated into shared utilities"),
        codeBlock("  - Console.log statements in production code (replace with proper logging or remove)"),
        codeBlock("  - The entire mock-data.ts layer should be KEPT but only used when NEXT_PUBLIC_SUPABASE_URL is empty or 'mock'. Do NOT remove it."),
        codeBlock(""),
        codeBlock("PHASE 4: VERIFY AND PROTECT THE .ENV FILE"),
        codeBlock("The .env file contains LIVE production credentials. You MUST:"),
        codeBlock("  - NOT remove or change any existing environment variable"),
        codeBlock("  - NOT add placeholder values that overwrite real ones"),
        codeBlock("  - Verify all required environment variables are present"),
        codeBlock("  - Create a .env.example file with ALL the same variable names but with placeholder values (no real secrets)"),
        codeBlock(""),
        codeBlock("Required environment variables (ALL must exist in .env):"),
        codeBlock("  DATABASE_URL=file:./db/custom.db"),
        codeBlock("  NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co"),
        codeBlock("  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."),
        codeBlock("  SUPABASE_SERVICE_ROLE_KEY=eyJ..."),
        codeBlock("  R2_ACCOUNT_ID=<cloudflare-account-id>"),
        codeBlock("  R2_ACCESS_KEY_ID=<r2-access-key>"),
        codeBlock("  R2_SECRET_ACCESS_KEY=<r2-secret-key>"),
        codeBlock("  R2_BUCKET_NAME=keevanstore"),
        codeBlock("  PESAPAL_CONSUMER_KEY=<pesapal-consumer-key>"),
        codeBlock("  PESAPAL_CONSUMER_SECRET=<pesapal-consumer-secret>"),
        codeBlock("  PESAPAL_API_URL=https://pay.pesapal.com/v3/api"),
        codeBlock("  PESAPAL_IPN_URL=https://keevanstore.in/api/pesapal/ipn"),
        codeBlock("  PESAPAL_MODE=live"),
        codeBlock("  NEXT_PUBLIC_APP_URL=https://keevanstore.in"),
        codeBlock("  ADMIN_WHATSAPP_NUMBER=256768345905"),
        codeBlock(""),
        codeBlock("PHASE 5: BUILD AND TEST LOOP"),
        codeBlock("After making all fixes, you MUST:"),
        codeBlock("  1. Run 'npm install' to ensure all dependencies are installed"),
        codeBlock("  2. Run 'npx prisma generate' to generate the Prisma client"),
        codeBlock("  3. Run 'npm run build' (next build) and fix ALL build errors"),
        codeBlock("  4. Run 'npm run lint' and fix all linting errors"),
        codeBlock("  5. Run 'npm test' (vitest) and ensure all tests pass"),
        codeBlock("  6. If ANY step fails, go back, fix the issue, and repeat from step 1"),
        codeBlock("  7. Continue this loop until ALL of the following are true:"),
        codeBlock("     - npm install completes with no errors"),
        codeBlock("     - npx prisma generate completes successfully"),
        codeBlock("     - npm run build completes with ZERO errors (warnings are acceptable)"),
        codeBlock("     - npm run lint passes with no errors"),
        codeBlock("     - npm test passes with all tests green"),
        codeBlock("  8. You MUST NOT stop until all 5 steps pass. If you cannot fix an issue, document it explicitly."),
        codeBlock(""),
        codeBlock("PHASE 6: DEPLOYMENT CONFIGURATION VERIFICATION"),
        codeBlock("Verify the following are correct for Vercel deployment:"),
        codeBlock("  - next.config.ts does NOT have output: 'standalone' (Vercel handles this)"),
        codeBlock("  - next.config.ts has reactStrictMode: true"),
        codeBlock("  - package.json has correct scripts: dev, build, start, lint, test"),
        codeBlock("  - package.json does NOT have prisma in dependencies (should be devDependency only)"),
        codeBlock("  - .gitignore includes .env*, .vercel, node_modules, .next, /db/"),
        codeBlock("  - tsconfig.json has correct paths and compiler options"),
        codeBlock("  - No hardcoded localhost URLs in production code (use env vars)"),
        codeBlock("  - All API routes handle CORS properly for the keevanstore.in domain"),
        codeBlock(""),
        codeBlock("PHASE 7: FINAL VERIFICATION CHECKLIST"),
        codeBlock("Before declaring the project production-ready, verify:"),
        codeBlock("  - Every page route renders without errors"),
        codeBlock("  - Every API route returns correct responses"),
        codeBlock("  - Authentication flow works (signup, login, logout, session refresh)"),
        codeBlock("  - Payment flow works (checkout, Pesapal redirect, IPN callback, order completion)"),
        codeBlock("  - File upload works (auth required, MIME type validation, size limits)"),
        codeBlock("  - Download delivery works (token-based, 24h expiry, max 5 downloads)"),
        codeBlock("  - Admin routes are protected and require is_admin"),
        codeBlock("  - Dashboard routes are protected and require authentication"),
        codeBlock("  - Public store pages render correctly"),
        codeBlock("  - Middleware correctly protects routes and refreshes sessions"),
        codeBlock("  - Rate limiting is active on all sensitive endpoints"),
        codeBlock("  - Revenue split calculation is correct (10% platform, 90% creator)"),
        codeBlock(""),
        codeBlock("IMPORTANT RULES:"),
        codeBlock("  - Do NOT remove the mock data layer. It is intentional and needed for development/sandbox mode."),
        codeBlock("  - Do NOT change any environment variable values in .env"),
        codeBlock("  - Do NOT add new npm packages without explicit justification"),
        codeBlock("  - Do NOT change the database schema without updating both Prisma AND Supabase SQL"),
        codeBlock("  - Do NOT remove any shadcn/ui components even if they appear unused (they may be needed)"),
        codeBlock("  - Do NOT modify the Pesapal integration logic (it is in LIVE mode with real money)"),
        codeBlock("  - Do NOT change the Supabase schema.sql (it is the source of truth for the database)"),
        codeBlock("  - DO ensure the build completes with zero errors before finishing"),
        codeBlock("  - DO provide a final summary of all changes made"),
        codeBlock("  - DO provide a deployment readiness score out of 100"),
        codeBlock(""),
        codeBlock("PROJECT FILE STRUCTURE REFERENCE:"),
        codeBlock("src/app/ - Next.js App Router pages and API routes"),
        codeBlock("src/app/api/ - All API route handlers"),
        codeBlock("src/app/(auth)/ - Login and signup pages"),
        codeBlock("src/app/(dashboard)/ - Dashboard, analytics, products, events, withdrawals, store settings"),
        codeBlock("src/app/store/[username]/ - Public storefront pages"),
        codeBlock("src/app/download/[token]/ - Secure download delivery"),
        codeBlock("src/components/ui/ - 44 shadcn/ui components"),
        codeBlock("src/components/layout/ - Dashboard layout, sidebar, header"),
        codeBlock("src/components/shared/ - Copy button, currency display, file upload, footer, WhatsApp"),
        codeBlock("src/components/store/ - Donation widget, product card, store hero"),
        codeBlock("src/lib/ - Core utilities: auth-helpers, constants, db, db-mappers, mock-data, notifications, pesapal, r2, rate-limit, utils"),
        codeBlock("src/lib/supabase/ - Browser client, server client, middleware helper"),
        codeBlock("src/types/ - All TypeScript interfaces and enums"),
        codeBlock("src/hooks/ - Custom React hooks (use-auth, use-mobile, use-toast)"),
        codeBlock("src/middleware.ts - Auth guard for protected routes"),
        codeBlock("prisma/schema.prisma - Local SQLite schema"),
        codeBlock("supabase/schema.sql - Production PostgreSQL schema with RLS and functions"),
        codeBlock(""),
        codeBlock("---PROMPT END---"),

        separator(),

        // ================================================================
        // SECTION 2: KNOWN ISSUES TO WATCH FOR
        // ================================================================
        heading("2. Known Issues the AI Must Watch For"),
        body("Based on a thorough analysis of the codebase, the following are specific issues that the AI must investigate and fix. These are not theoretical problems; they are real issues identified in the current codebase that will cause build failures, runtime errors, or deployment problems."),

        heading("2.1 Prisma Schema Mismatch with Supabase", HeadingLevel.HEADING_2),
        body("The Prisma schema (prisma/schema.prisma) uses SQLite and defines models with different field names than the Supabase PostgreSQL schema (supabase/schema.sql). Key mismatches include: the Supabase 'withdrawals' table uses 'method' and 'account_details' (JSONB), but the Prisma schema uses 'phoneNumber', 'provider', and flat fields. The Supabase 'orders' table has 'product_id' as nullable (for donations), but the Prisma schema requires it. The Supabase schema has an 'events' table and 'download_sessions' table that are not fully represented in Prisma. The Supabase 'creators' table has 'is_active', 'is_verified', and 'is_admin' fields, while the Prisma schema only has implicit admin support. The AI must ensure that when running with real Supabase (production mode), all API routes correctly use snake_case column names and map them to camelCase TypeScript types via db-mappers.ts."),

        heading("2.2 prisma in dependencies Instead of devDependencies", HeadingLevel.HEADING_2),
        body("In package.json, 'prisma' is listed in 'dependencies' (line 55) rather than 'devDependencies'. Prisma CLI is a development tool and should be in devDependencies. The '@prisma/client' package should remain in dependencies since it is needed at runtime. Having prisma in dependencies bloats the production bundle and may cause issues during Vercel build."),

        heading("2.3 Missing Post-Build Prisma Generate Step", HeadingLevel.HEADING_2),
        body("For Vercel deployment, the Prisma client must be generated during the build process. The package.json does not have a 'postinstall' script that runs 'prisma generate'. Without this, the Prisma client will not be available when the app starts on Vercel, causing runtime errors. The fix is to add: \"postinstall\": \"prisma generate\" to the scripts section of package.json."),

        heading("2.4 In-Memory Rate Limiting Does Not Scale on Vercel", HeadingLevel.HEADING_2),
        body("The rate-limit.ts uses an in-memory Map for tracking request counts. On Vercel's serverless architecture, each function invocation runs in a separate instance with its own memory space. This means rate limiting will NOT work across different invocations. While this is not a blocking issue (it will not cause errors), it means rate limiting is effectively disabled in production. The AI should note this as a known limitation but NOT attempt to implement a distributed rate limiter (that would require Redis or a database-backed solution, which is beyond the scope of a bug-fix pass)."),

        heading("2.5 File Upload Fallback Uses Local Filesystem", HeadingLevel.HEADING_2),
        body("The r2.ts module falls back to writing files to the local filesystem when R2 is not configured. On Vercel's serverless environment, the filesystem is read-only (except for /tmp). This means file uploads will fail if R2 is not configured. Since the .env has R2 credentials, this should work in production, but the fallback code should at minimum use os.tmpdir() instead of process.cwd() + '/uploads'. The AI should fix the fallback path to use /tmp on Vercel."),

        heading("2.6 Missing .env.example File", HeadingLevel.HEADING_2),
        body("The project does not have a .env.example file. This is required for Vercel deployment because Vercel needs to know which environment variables to configure. The AI must create a .env.example file with all required variable names and placeholder values. This file should be committed to Git so that Vercel can read it, but it must NOT contain any real secret values."),

        heading("2.7 Middleware Route Protection Edge Cases", HeadingLevel.HEADING_2),
        body("The middleware (src/middleware.ts) has a potential issue with the route protection logic. The condition `(pathname.startsWith('/store') && !pathname.startsWith('/store/'))` is meant to protect the dashboard store settings page at /store while allowing public store pages at /store/[username]. However, this logic could be fragile if new routes are added. Additionally, routes like /about, /contact, /privacy, /terms, /download, /payment are not explicitly listed in the 'allow public' section; they fall through to the default case which calls updateSession but does not enforce authentication. This is correct behavior, but should be verified for all pages."),

        heading("2.8 Ticket Mapper Uses event_id as productId", HeadingLevel.HEADING_2),
        body("In db-mappers.ts, the mapTicketFromDb function maps 'event_id' to 'productId' (line 190: `productId: (row.event_id ?? row.eventId ?? row.productId)`). In the Supabase schema, the tickets table has 'event_id' (referencing events table) but NOT 'product_id'. The TypeScript Ticket type has 'productId'. This mapping is incorrect because event_id is not the same as productId. The ticket should reference the event, and the event references the product. The mapper should either resolve the product ID through the event, or the Ticket type should be updated to include both eventId and productId."),

        heading("2.9 Download Route Does Not Exist as API Route", HeadingLevel.HEADING_2),
        body("There is a page at src/app/download/[token]/page.tsx for displaying downloads, but the actual secure download API route is at src/app/api/download/[token]/route.ts. The AI should verify that both exist and that the page correctly calls the API route. The download flow must ensure that the download token is validated, the session is not expired, and the download count is incremented atomically."),

        heading("2.10 Pesapal IPN Registration on Every Checkout", HeadingLevel.HEADING_2),
        body("The checkout route (src/app/api/checkout/route.ts) calls registerIPN() on every checkout request (line 226). Pesapal's IPN registration should ideally be done once and the IPN ID cached. Registering IPN on every checkout is unnecessary and may hit rate limits or cause issues. The AI should implement caching for the IPN ID (similar to how the auth token is cached in pesapal.ts)."),

        heading("2.11 Mock Data Mutability in Production", HeadingLevel.HEADING_2),
        body("The mock-data.ts module uses mutable arrays (mockOrders, mockProducts, mockCreators) that are modified in-place during mock checkout (lines 113, 119-133 of checkout/route.ts). In a serverless environment like Vercel, these mutations are lost between invocations. While mock mode is not used in production (since real Supabase credentials are provided), this is still a code quality issue. The AI should ensure that when isUsingMockData() returns false (production mode), none of the mock mutation code is executed."),

        heading("2.12 Missing contact_messages Table in Prisma Schema", HeadingLevel.HEADING_2),
        body("The Supabase schema has a contact_messages table referenced by the contact API route, but this table is not defined in the Prisma schema. If the app tries to use Prisma for contact messages, it will fail. The AI should verify that the contact API route uses Supabase directly (not Prisma) and add the table to Prisma if needed for consistency."),

        separator(),

        // ================================================================
        // SECTION 3: ENVIRONMENT VARIABLES REFERENCE
        // ================================================================
        heading("3. Environment Variables Complete Reference"),
        body("This section provides the complete list of environment variables required by Keevan Store. The AI must verify that all of these are present in the .env file and must create a .env.example file with placeholder values. The AI must NOT modify the actual values in .env."),

        heading("3.1 Database Variables", HeadingLevel.HEADING_2),
        labelBody("DATABASE_URL", " - Local SQLite database path for Prisma dev mode. Value: file:./db/custom.db. On Vercel with Supabase, this is not used for production queries but is needed for prisma generate."),
        labelBody("NEXT_PUBLIC_SUPABASE_URL", " - Supabase project URL. Used by both browser and server clients. Format: https://[project-ref].supabase.co"),
        labelBody("NEXT_PUBLIC_SUPABASE_ANON_KEY", " - Supabase anonymous key. Safe to expose in browser. Used for client-side auth and data access with RLS."),
        labelBody("SUPABASE_SERVICE_ROLE_KEY", " - Supabase service role key. SECRET - never expose in browser. Used server-side to bypass RLS for admin operations, payment webhooks, and signup."),

        heading("3.2 Cloudflare R2 Variables", HeadingLevel.HEADING_2),
        labelBody("R2_ACCOUNT_ID", " - Cloudflare account ID for R2 storage endpoint construction."),
        labelBody("R2_ACCESS_KEY_ID", " - R2 API access key. Used for S3-compatible uploads."),
        labelBody("R2_SECRET_ACCESS_KEY", " - R2 API secret key. SECRET - never expose in browser."),
        labelBody("R2_BUCKET_NAME", " - R2 bucket name (keevanstore). Used for file storage of product thumbnails and digital product files."),

        heading("3.3 Pesapal Payment Variables", HeadingLevel.HEADING_2),
        labelBody("PESAPAL_CONSUMER_KEY", " - Pesapal API consumer key for authentication."),
        labelBody("PESAPAL_CONSUMER_SECRET", " - Pesapal API consumer secret. SECRET."),
        labelBody("PESAPAL_API_URL", " - Pesapal API base URL. LIVE: https://pay.pesapal.com/v3/api. SANDBOX: https://cybqa.pesapal.com/pesapalv3/api"),
        labelBody("PESAPAL_IPN_URL", " - Instant Payment Notification URL. Must be publicly accessible. Value: https://keevanstore.in/api/pesapal/ipn"),
        labelBody("PESAPAL_MODE", " - Payment mode. 'live' for production, 'sandbox' for testing."),

        heading("3.4 Application Variables", HeadingLevel.HEADING_2),
        labelBody("NEXT_PUBLIC_APP_URL", " - Public URL of the application. Used for callback URLs, sitemap generation, and SEO metadata. Value: https://keevanstore.in"),
        labelBody("ADMIN_WHATSAPP_NUMBER", " - WhatsApp number for admin notifications. Used in notification utilities and WhatsApp support links."),

        separator(),

        // ================================================================
        // SECTION 4: STEP-BY-STEP DEPLOYMENT GUIDE
        // ================================================================
        heading("4. Step-by-Step Deployment Guide: GitHub to Vercel"),

        heading("4.1 Prerequisites", HeadingLevel.HEADING_2),
        numbered(1, "Node.js 18+ installed on your machine"),
        numbered(2, "Git installed and configured"),
        numbered(3, "A GitHub account (github.com/NambatyaM)"),
        numbered(4, "A Vercel account (sign up at vercel.com with your GitHub account)"),
        numbered(5, "The project files in your local directory"),
        numbered(6, "A GitHub Personal Access Token with 'repo' scope (Settings > Developer settings > Personal access tokens > Fine-grained tokens)"),

        heading("4.2 Step 1: Prepare the Project Locally", HeadingLevel.HEADING_2),
        body("Open Command Prompt or PowerShell and navigate to your project directory:"),
        codeBlock("cd C:\\Users\\nkevi\\Downloads\\My Keevan Store"),
        body("Ensure all the source code is at the ROOT level, not inside a subdirectory. If your code is nested inside keevan-store-codebase/, you need to move all files up one level:"),
        codeBlock("xcopy keevan-store-codebase\\* . /E /Y /I"),
        codeBlock("rmdir /S /Q keevan-store-codebase"),
        body("This is critical because Vercel expects package.json to be at the repository root."),

        heading("4.3 Step 2: Verify .gitignore", HeadingLevel.HEADING_2),
        body("Create or update your .gitignore file at the project root with the following contents:"),
        codeBlock("# dependencies"),
        codeBlock("node_modules"),
        codeBlock("/.pnp"),
        codeBlock(".pnp.*"),
        codeBlock(""),
        codeBlock("# next.js"),
        codeBlock("/.next/"),
        codeBlock("/out/"),
        codeBlock(""),
        codeBlock("# production"),
        codeBlock("/build"),
        codeBlock(""),
        codeBlock("# misc"),
        codeBlock(".DS_Store"),
        codeBlock("*.pem"),
        codeBlock(""),
        codeBlock("# debug"),
        codeBlock("npm-debug.log*"),
        codeBlock(""),
        codeBlock("# env files"),
        codeBlock(".env"),
        codeBlock(".env*.local"),
        codeBlock(""),
        codeBlock("# vercel"),
        codeBlock(".vercel"),
        codeBlock(""),
        codeBlock("# typescript"),
        codeBlock("*.tsbuildinfo"),
        codeBlock("next-env.d.ts"),
        codeBlock(""),
        codeBlock("# prisma local db"),
        codeBlock("/db/"),
        codeBlock(""),
        codeBlock("# uploads"),
        codeBlock("/uploads/"),
        codeBlock(""),
        codeBlock("# archive files (too large for git)"),
        codeBlock("*.tar.gz"),
        codeBlock("*.zip"),
        codeBlock(""),
        codeBlock("# scripts and reports"),
        codeBlock("generate_*.py"),
        codeBlock("/download/"),
        codeBlock("/agent-ctx/"),
        codeBlock("worklog.md"),
        codeBlock(""),
        codeBlock("# ide"),
        codeBlock(".claude"),
        codeBlock(".z-ai-config"),
        codeBlock("*.log"),

        heading("4.4 Step 3: Initialize Git and Commit", HeadingLevel.HEADING_2),
        body("Set up Git with your identity (if not already done):"),
        codeBlock("git config --global user.email \"keevanstore@gmail.com\""),
        codeBlock("git config --global user.name \"NambatyaM\""),
        body("Initialize the repository:"),
        codeBlock("git init"),
        codeBlock("git add ."),
        codeBlock("git commit -m \"Initial commit: Keevan Store v1.0\""),
        body("If you already have a .git directory from a previous attempt, delete it first:"),
        codeBlock("rmdir /S /Q .git"),
        codeBlock("git init"),
        codeBlock("git add ."),
        codeBlock("git commit -m \"Initial commit: Keevan Store v1.0\""),

        heading("4.5 Step 4: Push to GitHub", HeadingLevel.HEADING_2),
        body("Add the remote origin with your Personal Access Token embedded in the URL:"),
        codeBlock("git remote add origin https://NambatyaM:YOUR_TOKEN@github.com/NambatyaM/keevan-store.git"),
        body("Replace YOUR_TOKEN with your GitHub Personal Access Token. Make sure the token has the 'repo' scope checkbox checked."),
        body("If 'origin' already exists from a previous attempt:"),
        codeBlock("git remote set-url origin https://NambatyaM:YOUR_TOKEN@github.com/NambatyaM/keevan-store.git"),
        body("Increase the HTTP post buffer to handle large pushes:"),
        codeBlock("git config --global http.postBuffer 157286400"),
        body("Push to GitHub:"),
        codeBlock("git branch -M main"),
        codeBlock("git push -u origin main"),
        body("If you get a timeout error, verify that large files (.tar.gz, .zip) are excluded by .gitignore and not tracked by Git. If they were previously committed, remove them:"),
        codeBlock("git rm --cached keevan-store-codebase.tar.gz"),
        codeBlock("git rm --cached keevan-store-codebase.zip"),
        codeBlock("git commit -m \"Remove large archive files\""),
        codeBlock("git push -u origin main"),

        heading("4.6 Step 5: Set Up Vercel Project", HeadingLevel.HEADING_2),
        numbered(1, "Go to vercel.com and sign in with your GitHub account"),
        numbered(2, "Click 'Add New...' > 'Project'"),
        numbered(3, "Under 'Import Git Repository', find 'NambatyaM/keevan-store'"),
        numbered(4, "Click 'Import'"),
        numbered(5, "Configure the project settings:"),

        labelBody("Framework Preset: ", "Next.js (Vercel should auto-detect this)"),
        labelBody("Root Directory: ", "./ (leave default - code should be at repo root)"),
        labelBody("Build Command: ", "npm run build (leave default)"),
        labelBody("Output Directory: ", ".next (leave default)"),
        labelBody("Install Command: ", "npm install (leave default)"),

        heading("4.7 Step 6: Configure Environment Variables on Vercel", HeadingLevel.HEADING_2),
        body("This is the most critical step. Before deploying, you must add ALL environment variables to Vercel. Click 'Environment Variables' on the project configuration page and add each variable:"),
        body("Add the following variables one by one. Set the Environment dropdown to 'Production', 'Preview', and 'Development' for each:"),
        codeBlock("DATABASE_URL = file:./db/custom.db"),
        codeBlock("NEXT_PUBLIC_SUPABASE_URL = https://snkqgqeiuxgusgtwwssc.supabase.co"),
        codeBlock("NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."),
        codeBlock("SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."),
        codeBlock("R2_ACCOUNT_ID = <your-r2-account-id>"),
        codeBlock("R2_ACCESS_KEY_ID = <your-r2-access-key>"),
        codeBlock("R2_SECRET_ACCESS_KEY = <your-r2-secret-key>"),
        codeBlock("R2_BUCKET_NAME = keevanstore"),
        codeBlock("PESAPAL_CONSUMER_KEY = <your-pesapal-consumer-key>"),
        codeBlock("PESAPAL_CONSUMER_SECRET = <your-pesapal-consumer-secret>"),
        codeBlock("PESAPAL_API_URL = https://pay.pesapal.com/v3/api"),
        codeBlock("PESAPAL_IPN_URL = https://keevanstore.in/api/pesapal/ipn"),
        codeBlock("PESAPAL_MODE = live"),
        codeBlock("NEXT_PUBLIC_APP_URL = https://keevanstore.in"),
        codeBlock("ADMIN_WHATSAPP_NUMBER = 256768345905"),
        body("IMPORTANT: Variables prefixed with NEXT_PUBLIC_ are exposed to the browser. All other variables are server-side only and remain secret. Never add SUPABASE_SERVICE_ROLE_KEY or R2_SECRET_ACCESS_KEY to a NEXT_PUBLIC_ variable."),

        heading("4.8 Step 7: Deploy", HeadingLevel.HEADING_2),
        body("Click 'Deploy' on the Vercel project configuration page. Vercel will:"),
        numbered(1, "Clone your GitHub repository"),
        numbered(2, "Run 'npm install' to install dependencies"),
        numbered(3, "Run 'npx prisma generate' (if postinstall script is set up)"),
        numbered(4, "Run 'npm run build' to build the Next.js application"),
        numbered(5, "Deploy the built application to Vercel's CDN"),
        body("The first deployment typically takes 2-5 minutes. If it fails, check the build logs for errors. Common issues include missing environment variables, TypeScript errors, and build configuration problems."),

        heading("4.9 Step 8: Configure Custom Domain (keevanstore.in)", HeadingLevel.HEADING_2),
        body("After the first successful deployment:"),
        numbered(1, "Go to your Vercel project dashboard"),
        numbered(2, "Click 'Settings' > 'Domains'"),
        numbered(3, "Add 'keevanstore.in' and 'www.keevanstore.in'"),
        numbered(4, "Vercel will provide DNS records to add to your domain registrar"),
        numbered(5, "Add the following DNS records at your domain registrar:"),
        bullet("A record: @ points to 76.76.21.21 (Vercel's IP)"),
        bullet("CNAME record: www points to cname.vercel-dns.com"),
        numbered(6, "Wait for DNS propagation (can take up to 48 hours, usually 5-15 minutes)"),
        numbered(7, "Vercel will automatically provision an SSL certificate via Let's Encrypt"),

        heading("4.10 Step 9: Verify Pesapal IPN URL", HeadingLevel.HEADING_2),
        body("After deployment, verify that the Pesapal IPN callback URL is accessible:"),
        numbered(1, "Visit https://keevanstore.in/api/pesapal/ipn in your browser"),
        numbered(2, "You should get a response (even an error response means the route exists)"),
        numbered(3, "If you get a 404, the route is not deployed correctly - check your build logs"),
        numbered(4, "Register the IPN URL with Pesapal if not already done (the app does this automatically on first checkout, but you can also do it manually through the Pesapal dashboard)"),

        heading("4.11 Step 10: Post-Deployment Verification", HeadingLevel.HEADING_2),
        body("After deployment, verify the following:"),
        numbered(1, "Visit https://keevanstore.in - the landing page should load"),
        numbered(2, "Visit https://keevanstore.in/login - the login page should render"),
        numbered(3, "Visit https://keevanstore.in/signup - the signup page should render"),
        numbered(4, "Create a test account and verify you can log in"),
        numbered(5, "Visit https://keevanstore.in/dashboard - should show the creator dashboard (requires login)"),
        numbered(6, "Visit https://keevanstore.in/store/sarah-creates - should show the public store page"),
        numbered(7, "Try a test checkout flow (use a small amount)"),
        numbered(8, "Check Vercel Functions logs for any runtime errors"),
        numbered(9, "Test on mobile (the site should be responsive)"),

        separator(),

        // ================================================================
        // SECTION 5: VERCEL-SPECIFIC DEPENDENCY SETUP
        // ================================================================
        heading("5. Vercel Dependencies and Build Configuration"),

        heading("5.1 Required Vercel Build Settings", HeadingLevel.HEADING_2),
        body("Vercel automatically detects Next.js projects and configures most build settings. However, there are specific configurations needed for Keevan Store:"),

        labelBody("Build Command: ", "npm run build (default)"),
        labelBody("Output Directory: ", ".next (default)"),
        labelBody("Install Command: ", "npm install (default)"),
        labelBody("Node.js Version: ", "18.x or 20.x (set in Vercel project settings)"),

        heading("5.2 Package.json Build Script Requirements", HeadingLevel.HEADING_2),
        body("The package.json must have a 'postinstall' script that runs 'prisma generate'. This ensures the Prisma client is generated after npm install on Vercel:"),
        codeBlock("\"scripts\": {"),
        codeBlock("  \"dev\": \"next dev -p 3000\","),
        codeBlock("  \"build\": \"next build\","),
        codeBlock("  \"start\": \"next start\","),
        codeBlock("  \"lint\": \"eslint .\","),
        codeBlock("  \"test\": \"vitest run\","),
        codeBlock("  \"postinstall\": \"prisma generate\""),
        codeBlock("}"),

        heading("5.3 Prisma Configuration for Vercel", HeadingLevel.HEADING_2),
        body("Vercel's serverless functions have a read-only filesystem except for /tmp. Prisma needs to generate its client in a writable location during build. The prisma/schema.prisma should have:"),
        codeBlock("generator client {"),
        codeBlock("  provider = \"prisma-client-js\""),
        codeBlock("}"),
        body("This is already correct. The 'postinstall' script will handle generation during Vercel's build step."),

        heading("5.4 Move prisma to devDependencies", HeadingLevel.HEADING_2),
        body("The prisma CLI package should be in devDependencies, not dependencies. This reduces the production bundle size:"),
        codeBlock("\"dependencies\": {"),
        codeBlock("  \"@prisma/client\": \"^6.11.1\","),
        codeBlock("  ..."),
        codeBlock("},"),
        codeBlock("\"devDependencies\": {"),
        codeBlock("  \"prisma\": \"^6.11.1\","),
        codeBlock("  ..."),
        codeBlock("}"),

        heading("5.5 Vercel Environment Variable Configuration", HeadingLevel.HEADING_2),
        body("When adding environment variables in Vercel, you can use the Vercel CLI or the dashboard. Using the dashboard:"),
        numbered(1, "Go to your project > Settings > Environment Variables"),
        numbered(2, "Add each variable with its value"),
        numbered(3, "Select which environments (Production, Preview, Development) the variable applies to"),
        numbered(4, "For sensitive values (SUPABASE_SERVICE_ROLE_KEY, R2_SECRET_ACCESS_KEY, PESAPAL_CONSUMER_SECRET), ensure they are NOT prefixed with NEXT_PUBLIC_"),
        body("Using the Vercel CLI (alternative method):"),
        codeBlock("npm i -g vercel"),
        codeBlock("vercel login"),
        codeBlock("vercel link  # Link to your project"),
        codeBlock("vercel env add NEXT_PUBLIC_SUPABASE_URL production"),
        codeBlock("# Paste the value when prompted"),
        codeBlock("# Repeat for each variable"),

        heading("5.6 Vercel Serverless Function Configuration", HeadingLevel.HEADING_2),
        body("Vercel automatically configures serverless functions for Next.js API routes. However, some API routes may need longer timeouts for payment processing. You can configure this in next.config.ts:"),
        codeBlock("const nextConfig: NextConfig = {"),
        codeBlock("  reactStrictMode: true,"),
        codeBlock("  experimental: {"),
        codeBlock("    serverActions: {"),
        codeBlock("      bodySizeLimit: '10mb',"),
        codeBlock("    },"),
        codeBlock("  },"),
        codeBlock("};"),
        body("For the file upload endpoint, you may also need to configure the maximum request body size. Vercel's default limit is 4.5MB for serverless functions. For larger uploads, consider using direct-to-R2 uploads via presigned URLs instead of routing through the API."),

        separator(),

        // ================================================================
        // SECTION 6: SECURITY CHECKLIST
        // ================================================================
        heading("6. Security Checklist for Production"),

        heading("6.1 Critical Security Items", HeadingLevel.HEADING_2),
        numbered(1, "Revoke all GitHub Personal Access Tokens that were shared in chat. Create a new one with only the 'repo' scope and do not share it in any chat."),
        numbered(2, "Verify .env is in .gitignore and NOT committed to GitHub. Run: git ls-files | grep .env (should return nothing)"),
        numbered(3, "Verify SUPABASE_SERVICE_ROLE_KEY is only used server-side, never in client components"),
        numbered(4, "Verify R2_SECRET_ACCESS_KEY is only used server-side"),
        numbered(5, "Verify PESAPAL_CONSUMER_SECRET is only used server-side"),
        numbered(6, "All admin API routes (/api/admin/*) must verify is_admin before processing requests"),
        numbered(7, "All protected API routes must call verifyAuth() before processing"),
        numbered(8, "Rate limiting must be active on all sensitive endpoints"),
        numbered(9, "File uploads must validate MIME types, file extensions, and file sizes"),
        numbered(10, "Download tokens must have expiration (24h) and download count limits (5 max)"),

        heading("6.2 Vercel-Specific Security", HeadingLevel.HEADING_2),
        numbered(1, "Never add server-side secrets as NEXT_PUBLIC_ variables in Vercel"),
        numbered(2, "Use Vercel's Environment Variables encryption (enabled by default)"),
        numbered(3, "Enable Vercel's DDoS protection (included with Pro plan)"),
        numbered(4, "Configure Content Security Policy headers in next.config.ts if needed"),
        numbered(5, "Ensure the Pesapal IPN endpoint validates the origin of incoming requests"),

        separator(),

        // ================================================================
        // SECTION 7: TROUBLESHOOTING COMMON DEPLOYMENT ISSUES
        // ================================================================
        heading("7. Troubleshooting Common Deployment Issues"),

        heading("7.1 Build Fails on Vercel but Works Locally", HeadingLevel.HEADING_2),
        body("This is usually caused by: missing environment variables (Vercel does not have access to your local .env file), TypeScript strict mode catching errors that were ignored locally, or platform-specific code (filesystem operations that work locally but fail on Vercel's read-only filesystem). Solution: ensure all environment variables are configured in Vercel's dashboard, fix all TypeScript errors, and replace filesystem-dependent code with Vercel-compatible alternatives."),

        heading("7.2 500 Internal Server Error on API Routes", HeadingLevel.HEADING_2),
        body("Check the Vercel Function Logs (Project > Functions tab) for the specific error. Common causes include: Supabase connection failures (verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set), missing Prisma client (ensure postinstall script runs prisma generate), and unhandled exceptions in API route handlers. The fix depends on the specific error message in the logs."),

        heading("7.3 Authentication Not Working (Redirect Loops)", HeadingLevel.HEADING_2),
        body("This typically happens when the Supabase cookies are not being set correctly. Verify that: the NEXT_PUBLIC_APP_URL matches the actual deployed URL, the Supabase project's Site URL is set to keevanstore.in in the Supabase dashboard (Authentication > URL Configuration), and the middleware is correctly refreshing sessions. Also check that the cookies are being set with the correct domain and secure flag."),

        heading("7.4 Pesapal Payments Not Completing", HeadingLevel.HEADING_2),
        body("If payments are initiated but never complete: verify the PESAPAL_IPN_URL is accessible from Pesapal's servers (not blocked by firewall or Vercel's bot protection), check that the IPN handler (/api/pesapal/ipn) is correctly processing the webhook, and ensure the PESAPAL_MODE is set to 'live' (not 'sandbox') when using live Pesapal credentials."),

        heading("7.5 File Uploads Failing", HeadingLevel.HEADING_2),
        body("If file uploads return errors: verify R2 credentials are correct, check that the R2 bucket exists and has the correct CORS configuration (allow uploads from keevanstore.in), and ensure the file size does not exceed Vercel's serverless function body limit (4.5MB default). For large files, implement direct-to-R2 uploads using presigned URLs."),

        heading("7.6 Push to GitHub Fails (Timeout)", HeadingLevel.HEADING_2),
        body("If git push times out: verify large files are excluded by .gitignore, remove any large files from git tracking with 'git rm --cached <file>', increase the HTTP post buffer with 'git config --global http.postBuffer 157286400', and try pushing again. If the repository is too large, consider using Git LFS for large binary files or restructuring the repository."),

        separator(),

        // ================================================================
        // SECTION 8: QUICK REFERENCE COMMANDS
        // ================================================================
        heading("8. Quick Reference: Essential Commands"),

        heading("8.1 Local Development", HeadingLevel.HEADING_2),
        codeBlock("npm install              # Install dependencies"),
        codeBlock("npx prisma generate      # Generate Prisma client"),
        codeBlock("npm run dev              # Start dev server on port 3000"),
        codeBlock("npm run build            # Build for production"),
        codeBlock("npm run lint             # Run ESLint"),
        codeBlock("npm test                 # Run Vitest tests"),

        heading("8.2 Git Commands", HeadingLevel.HEADING_2),
        codeBlock("git init                              # Initialize git repository"),
        codeBlock("git add .                             # Stage all files"),
        codeBlock("git commit -m \"message\"               # Commit changes"),
        codeBlock("git remote add origin <url>           # Add GitHub remote"),
        codeBlock("git push -u origin main               # Push to GitHub"),
        codeBlock("git rm --cached <file>                 # Remove file from git tracking"),
        codeBlock("git config --global http.postBuffer 157286400  # Increase push buffer"),

        heading("8.3 Vercel CLI Commands", HeadingLevel.HEADING_2),
        codeBlock("npm i -g vercel           # Install Vercel CLI globally"),
        codeBlock("vercel login              # Login to Vercel"),
        codeBlock("vercel                    # Deploy to preview"),
        codeBlock("vercel --prod             # Deploy to production"),
        codeBlock("vercel env ls             # List environment variables"),
        codeBlock("vercel env add <name> <env>  # Add environment variable"),
        codeBlock("vercel logs               # View deployment logs"),
        codeBlock("vercel inspect <url>      # Inspect a deployment"),

        separator(),

        // ================================================================
        // SECTION 9: FINAL NOTES
        // ================================================================
        heading("9. Final Notes"),
        body("This document provides everything needed to make Keevan Store production-ready. The master prompt in Section 1 is designed to be copy-pasted directly into an AI coding assistant to perform a comprehensive audit and fix cycle. The known issues in Section 2 are based on a thorough analysis of the current codebase and represent the most likely sources of build failures and runtime errors."),
        body("The deployment guide in Section 4 provides step-by-step instructions for pushing the code to GitHub and deploying on Vercel, including all the configuration details for environment variables, DNS setup, and post-deployment verification."),
        body("The security checklist in Section 6 is critical because GitHub Personal Access Tokens were shared in previous conversations. Those tokens MUST be revoked immediately. Create new tokens with minimal required permissions and never share them in chat."),
        body("After the AI completes the audit and fix cycle, the project should achieve a deployment readiness score of 90+ out of 100. The remaining 10 points would be addressed by implementing distributed rate limiting (requires Redis), adding end-to-end tests, setting up monitoring and alerting, and implementing a CI/CD pipeline with automated testing."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/home/z/my-project/download/Keevan_Store_AI_Audit_Prompt_and_Deployment_Guide.docx", buffer);
  console.log("Document generated successfully!");
});
