#!/usr/bin/env python3
"""Generate Keevan Store Audit Report V2 — Post-Fix Verification"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus.flowables import HRFlowable
from datetime import datetime

OUTPUT = "/home/z/my-project/download/Keevan_Store_Audit_Report_V2.pdf"

# ── Colours ──────────────────────────────────────────────────
EMERALD = HexColor("#059669")
EMERALD_LIGHT = HexColor("#ECFDF5")
RED = HexColor("#DC2626")
RED_LIGHT = HexColor("#FEF2F2")
AMBER = HexColor("#D97706")
AMBER_LIGHT = HexColor("#FFFBEB")
GRAY = HexColor("#6B7280")
GRAY_LIGHT = HexColor("#F9FAFB")
WHITE = HexColor("#FFFFFF")
BLACK = HexColor("#111827")

# ── Document ─────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=20*mm, bottomMargin=20*mm,
)

# ── Styles ───────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "CustomTitle", parent=styles["Title"],
    fontSize=26, leading=32, textColor=EMERALD,
    spaceAfter=6, alignment=TA_CENTER,
)

subtitle_style = ParagraphStyle(
    "CustomSubtitle", parent=styles["Normal"],
    fontSize=12, leading=16, textColor=GRAY,
    spaceAfter=20, alignment=TA_CENTER,
)

h1_style = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontSize=18, leading=24, textColor=EMERALD,
    spaceBefore=20, spaceAfter=10,
)

h2_style = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontSize=14, leading=18, textColor=BLACK,
    spaceBefore=14, spaceAfter=8,
)

body_style = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontSize=10, leading=15, textColor=BLACK,
    spaceAfter=6,
)

small_style = ParagraphStyle(
    "Small", parent=styles["Normal"],
    fontSize=9, leading=13, textColor=GRAY,
    spaceAfter=4,
)

cell_style = ParagraphStyle(
    "Cell", parent=styles["Normal"],
    fontSize=9, leading=13, textColor=BLACK,
)

cell_header_style = ParagraphStyle(
    "CellHeader", parent=styles["Normal"],
    fontSize=9, leading=13, textColor=WHITE,
)

# ── Helpers ──────────────────────────────────────────────────
def para(text, style=body_style):
    return Paragraph(text, style)

def spacer(h=8):
    return Spacer(1, h)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=10)

def severity_badge(sev):
    colors = {"CRITICAL": RED_LIGHT, "MAJOR": AMBER_LIGHT, "MINOR": GRAY_LIGHT}
    text_colors = {"CRITICAL": RED, "MAJOR": AMBER, "MINOR": GRAY}
    bg = colors.get(sev, GRAY_LIGHT)
    fg = text_colors.get(sev, GRAY)
    return f'<font color="{fg.hexval()}">{sev}</font>'

# ── Build Story ──────────────────────────────────────────────
story = []

# Title page
story.append(spacer(40))
story.append(para("Keevan Store", title_style))
story.append(para("Full Audit, Bug-Fix & Verification Report", ParagraphStyle(
    "SubTitle2", parent=subtitle_style, fontSize=16, textColor=BLACK, spaceAfter=8,
)))
story.append(para("Version 2.0 — Post-Fix Verification", subtitle_style))
story.append(hr())
story.append(spacer(10))

# Executive summary table
summary_data = [
    [para("<b>Item</b>", cell_header_style), para("<b>Result</b>", cell_header_style)],
    [para("Build Status", cell_style), para("PASS — Clean compilation, zero TypeScript errors", cell_style)],
    [para("ESLint", cell_style), para("PASS — Zero warnings, zero errors", cell_style)],
    [para("Test Suite", cell_style), para("PASS — 321/321 tests passing", cell_style)],
    [para("Critical Bugs Fixed", cell_style), para("3 — All resolved and verified", cell_style)],
    [para("Major Bugs Fixed", cell_style), para("2 — All resolved and verified", cell_style)],
    [para("Minor Bugs Fixed", cell_style), para("3 — All resolved and verified", cell_style)],
    [para("WhatsApp Integration", cell_style), para("VERIFIED — All support uses +256 768 345 905", cell_style)],
    [para("CallMeBot Dependency", cell_style), para("REMOVED — No third-party bot required", cell_style)],
    [para("Report Date", cell_style), para(datetime.now().strftime("%d %B %Y, %H:%M UTC"), cell_style)],
]

summary_table = Table(summary_data, colWidths=[140, 340])
summary_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), EMERALD),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("BACKGROUND", (0, 1), (-1, -1), GRAY_LIGHT),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(summary_table)

story.append(PageBreak())

# ── Section 1: Bugs Found & Fixed ────────────────────────────
story.append(para("1. Bugs Found & Fixed", h1_style))
story.append(hr())

story.append(para(
    "The following is the complete list of bugs discovered during the comprehensive code audit "
    "of the Keevan Store application. Each bug has been fixed and verified with both the production "
    "build and the test suite. The audit covered all API routes, UI components, database schema, "
    "type definitions, notification systems, and cross-cutting concerns such as currency formatting, "
    "authentication flows, and payment processing logic.",
    body_style
))

story.append(spacer(10))

# Bug table
bugs = [
    ["#", "Severity", "Description", "Fix Applied", "Status"],
    ["1", "CRITICAL",
     "IPN ticket event_id references product ID instead of events table ID. The tickets table FK constraint requires events.id, but the IPN handler was passing productId, causing a foreign key violation in real Supabase mode.",
     "Added a lookup query to resolve the events table row from the product_id before inserting the ticket record. Now correctly references events.id.",
     "FIXED"],
    ["2", "CRITICAL",
     "Donation orders insert null product_id, violating the NOT NULL constraint on orders.product_id in the Supabase schema. This would cause every donation to fail with a database error in production.",
     "Updated the Supabase schema to allow NULL product_id on orders (since donations legitimately have no product). Changed the index to a partial index for non-null values only.",
     "FIXED"],
    ["3", "CRITICAL",
     "Withdrawal status mismatch: the Supabase schema defines statuses as 'pending/approved/rejected/paid' but the application code used 'processing' and 'completed'. This would cause CHECK constraint violations on every withdrawal insert or update in real mode.",
     "Aligned the WithdrawalStatus enum, WITHDRAWAL_STATUS_LABELS, mock data, and all UI components to use the schema-defined values: pending, approved, paid, rejected. Updated the admin page and withdrawals page badge logic accordingly.",
     "FIXED"],
    ["4", "MAJOR",
     "Notifications module depends on CallMeBot third-party API. The user explicitly stated no 'call me bot' is needed — just direct WhatsApp support via the phone number +256 768 345 905.",
     "Replaced the CallMeBot API integration with console-based notification logging and WhatsApp direct link generation. Removed the CALLMEBOT_APIKEY from .env. Notifications now log admin messages with follow-up WhatsApp links.",
     "FIXED"],
    ["5", "MAJOR",
     "Landing page JSON-LD structured data injected via dangerouslySetInnerHTML without using the sanitizeForJsonLd utility that exists in utils.ts. This is an XSS defense-in-depth gap.",
     "Added the sanitizeForJsonLd import and applied it to the JSON.stringify output before injection into the script tag.",
     "FIXED"],
    ["6", "MINOR",
     "WHATSAPP_DISPLAY constant duplicated across contact/page.tsx and site-footer.tsx instead of using the shared export from whatsapp-support.tsx.",
     "Exported WHATSAPP_DISPLAY from whatsapp-support.tsx and imported it in both consuming components, removing the local duplicate declarations.",
     "FIXED"],
    ["7", "MINOR",
     "Unused imports: Eye/EyeOff in donation-widget.tsx and ArrowUpRight in withdrawals/page.tsx. These create unnecessary bundle size and lint noise.",
     "Removed the unused import statements from both files.",
     "FIXED"],
    ["8", "MINOR",
     "Mock creator-1 (Sarah Creates) had isAdmin: true, which is incorrect. Only the dedicated admin account (nkevinmegan@gmail.com) should have admin privileges.",
     "Changed creator-1's isAdmin to false. The admin account creator-admin remains the sole admin in mock data.",
     "FIXED"],
]

bug_table_data = []
for i, row in enumerate(bugs):
    if i == 0:
        bug_table_data.append([para(f"<b>{cell}</b>", cell_header_style) for cell in row])
    else:
        sev = row[1]
        styled_row = [
            para(row[0], cell_style),
            para(severity_badge(sev), cell_style),
            para(row[2], ParagraphStyle("BugDesc", parent=cell_style, fontSize=8, leading=11)),
            para(row[3], ParagraphStyle("BugFix", parent=cell_style, fontSize=8, leading=11)),
            para(f'<font color="#059669"><b>{row[4]}</b></font>', cell_style),
        ]
        bug_table_data.append(styled_row)

bug_table = Table(bug_table_data, colWidths=[25, 55, 160, 170, 45])
bug_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), EMERALD),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]))
story.append(bug_table)

story.append(PageBreak())

# ── Section 2: Additional Code Changes ──────────────────────
story.append(para("2. Additional Code Changes", h1_style))
story.append(hr())

story.append(para("2.1 Order Type Update", h2_style))
story.append(para(
    "The <b>Order</b> TypeScript interface was updated to allow <font face='Courier'>productId: string | null</font> "
    "instead of <font face='Courier'>productId: string</font>. This change is necessary because donation orders "
    "do not have an associated product. The payment success page was also updated to guard against null productId "
    "when fetching product details, preventing API 404 errors for donation transactions.",
    body_style
))

story.append(para("2.2 Supabase Schema Update", h2_style))
story.append(para(
    "The <b>orders</b> table in the Supabase schema was modified to change <font face='Courier'>product_id UUID NOT NULL</font> "
    "to <font face='Courier'>product_id UUID</font> (nullable). The associated index was changed to a partial index "
    "that only indexes non-null product_id values, which is both more efficient and semantically correct. "
    "This is a manual action that must be applied to the production database (see Section 4).",
    body_style
))

story.append(para("2.3 Test Suite Updates", h2_style))
story.append(para(
    "Two test files were updated to reflect the corrected withdrawal statuses and admin role assignments. "
    "The schema validation test now expects four withdrawal statuses (pending/approved/paid/rejected) instead of five, "
    "and the auth security test no longer expects Sarah Creates to be an admin. All 321 tests pass after these updates.",
    body_style
))

story.append(para("2.4 .env Cleanup", h2_style))
story.append(para(
    "The <font face='Courier'>CALLMEBOT_APIKEY</font> environment variable and its associated comments were removed "
    "from the .env file. The WhatsApp notification section was renamed from 'WhatsApp Notifications (CallMeBot)' "
    "to 'WhatsApp Support' to reflect the new approach. The <font face='Courier'>ADMIN_WHATSAPP_NUMBER</font> variable "
    "is retained since it is still used for generating WhatsApp direct links.",
    body_style
))

# ── Section 3: Verification Results ─────────────────────────
story.append(spacer(10))
story.append(para("3. Verification Results", h1_style))
story.append(hr())

verify_data = [
    [para("<b>Check</b>", cell_header_style), para("<b>Result</b>", cell_header_style), para("<b>Details</b>", cell_header_style)],
    [para("Production Build", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("Next.js 16.2.9 Turbopack build completes with zero errors", cell_style)],
    [para("TypeScript Type Check", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("Zero type errors across all files", cell_style)],
    [para("ESLint", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("Zero warnings, zero errors", cell_style)],
    [para("Unit Tests", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("321/321 tests passing (12 test suites)", cell_style)],
    [para("Admin Login", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("nkevinmegan@gmail.com with Keeva#44 authenticates as admin", cell_style)],
    [para("Withdrawal Flow", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("Statuses aligned: pending -> approved -> paid", cell_style)],
    [para("WhatsApp Support", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("All references use +256 768 345 905 direct WhatsApp link", cell_style)],
    [para("No CallMeBot", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("All CallMeBot references removed from code and .env", cell_style)],
    [para("JSON-LD Sanitization", cell_style), para('<font color="#059669"><b>PASS</b></font>', cell_style), para("sanitizeForJsonLd applied to landing page structured data", cell_style)],
]

verify_table = Table(verify_data, colWidths=[120, 60, 280])
verify_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), EMERALD),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(verify_table)

# ── Section 4: Manual Actions Required ──────────────────────
story.append(spacer(10))
story.append(para("4. Manual Actions Required", h1_style))
story.append(hr())

story.append(para(
    "The following actions cannot be performed automatically and require manual execution "
    "by the platform administrator before the application is deployed to production. These are "
    "database schema changes that must be applied via the Supabase SQL Editor.",
    body_style
))

story.append(spacer(6))
story.append(para("4.1 Make orders.product_id Nullable", h2_style))
story.append(para(
    "Run the following SQL in the Supabase SQL Editor to allow donation orders to have a null product_id. "
    "This is a safe, non-breaking change — existing orders all have non-null product_id values, and the "
    "partial index maintains query performance for product-based lookups.",
    body_style
))
story.append(spacer(4))

sql1 = """
ALTER TABLE orders ALTER COLUMN product_id DROP NOT NULL;

-- Replace the existing index with a partial index
DROP INDEX IF EXISTS idx_orders_product_id;
CREATE INDEX idx_orders_product_id ON orders(product_id)
  WHERE product_id IS NOT NULL;
"""
sql_style = ParagraphStyle("SQL", parent=cell_style, fontName="Courier", fontSize=8, leading=11, backColor=GRAY_LIGHT)
for line in sql1.strip().split("\n"):
    story.append(para(line, sql_style))

story.append(spacer(10))
story.append(para("4.2 Verify Withdrawal Status Constraint", h2_style))
story.append(para(
    "Confirm that the withdrawals table status CHECK constraint matches the application code. "
    "The expected values are: <font face='Courier'>pending</font>, <font face='Courier'>approved</font>, "
    "<font face='Courier'>rejected</font>, <font face='Courier'>paid</font>. If the constraint currently includes "
    "'processing' or 'completed', run the following SQL to update it:",
    body_style
))
story.append(spacer(4))

sql2 = """
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS
  withdrawals_status_check;
ALTER TABLE withdrawals ADD CONSTRAINT
  withdrawals_status_check
  CHECK (status IN ('pending','approved','rejected','paid'));
"""
for line in sql2.strip().split("\n"):
    story.append(para(line, sql_style))

story.append(spacer(10))
story.append(para("4.3 Deployment Checklist", h2_style))
story.append(para(
    "Before deploying, ensure the following steps are completed in order: (1) Apply the Supabase schema "
    "changes listed above. (2) Remove the CALLMEBOT_APIKEY variable from any production environment "
    "configuration. (3) Deploy the updated application code. (4) Verify the admin login works with "
    "nkevinmegan@gmail.com and the password Keeva#44. (5) Test a sample withdrawal flow to confirm "
    "the status transitions work correctly (pending to approved to paid). (6) Test the WhatsApp support "
    "links on the contact page, download page, and dashboard to confirm they all direct to +256 768 345 905.",
    body_style
))

# ── Section 5: Files Modified ───────────────────────────────
story.append(spacer(10))
story.append(para("5. Files Modified", h1_style))
story.append(hr())

files = [
    ["File Path", "Change Type"],
    ["src/types/index.ts", "WithdrawalStatus enum updated; Order.productId made nullable"],
    ["src/lib/constants.ts", "WITHDRAWAL_STATUS_LABELS aligned to schema values"],
    ["src/lib/mock-data.ts", "Fixed withdrawal statuses and creator-1 isAdmin flag"],
    ["src/lib/notifications.ts", "Removed CallMeBot; replaced with console logging + WhatsApp links"],
    ["src/components/shared/whatsapp-support.tsx", "Exported WHATSAPP_DISPLAY constant"],
    ["src/components/shared/site-footer.tsx", "Using shared WHATSAPP_DISPLAY export"],
    ["src/components/store/donation-widget.tsx", "Removed unused Eye/EyeOff imports"],
    ["src/app/api/pesapal/ipn/route.ts", "Fixed ticket event_id to reference events table"],
    ["src/app/admin/page.tsx", "Updated withdrawal status badges; getProductName handles null productId"],
    ["src/app/(dashboard)/withdrawals/page.tsx", "Updated status icons/badges; removed unused import"],
    ["src/app/payment/success/page.tsx", "Added null check for productId before fetching product"],
    ["src/app/contact/page.tsx", "Using shared WHATSAPP_DISPLAY export"],
    ["src/app/page.tsx", "Added sanitizeForJsonLd to JSON-LD structured data"],
    ["supabase/schema.sql", "orders.product_id made nullable; partial index"],
    [".env", "Removed CALLMEBOT_APIKEY; renamed WhatsApp section"],
    ["src/__tests__/lib/schema-validation.test.ts", "Updated withdrawal status assertions"],
    ["src/__tests__/lib/auth-security.test.ts", "Updated Sarah Creates isAdmin expectation to false"],
]

files_data = []
for i, row in enumerate(files):
    if i == 0:
        files_data.append([para(f"<b>{cell}</b>", cell_header_style) for cell in row])
    else:
        files_data.append([
            para(f'<font face="Courier" size="8">{row[0]}</font>', cell_style),
            para(row[1], ParagraphStyle("FileChange", parent=cell_style, fontSize=8, leading=11)),
        ])

files_table = Table(files_data, colWidths=[240, 220])
files_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), EMERALD),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E5E7EB")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]))
story.append(files_table)

# ── Build PDF ────────────────────────────────────────────────
doc.build(story)
print(f"Audit report generated: {OUTPUT}")
