#!/usr/bin/env python3
"""
Generate the KEEVAN STORE — Manual Actions Required PDF document.
Professional layout with emerald green accents.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem, HRFlowable
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── Brand Colours ──────────────────────────────────────────────────
EMERALD_DARK   = HexColor("#065f46")   # darkest green
EMERALD        = HexColor("#047857")   # primary emerald
EMERALD_MED    = HexColor("#059669")   # medium emerald
EMERALD_LIGHT  = HexColor("#10b981")   # lighter emerald
EMERALD_PALE   = HexColor("#d1fae5")   # very light green bg
EMERALD_BG     = HexColor("#ecfdf5")   # faintest green bg
TEXT_DARK      = HexColor("#1f2937")   # near-black for body
TEXT_MED       = HexColor("#4b5563")   # grey for secondary text
TEXT_LIGHT     = HexColor("#6b7280")   # lighter grey
BORDER_GREY    = HexColor("#e5e7eb")   # subtle border
WHITE          = HexColor("#ffffff")
CHECK_GREEN    = HexColor("#34d399")   # checkbox green

OUTPUT_PATH = "/home/z/my-project/download/keevan-store-manual-actions.pdf"
PAGE_W, PAGE_H = A4

# ── Custom Flowables ───────────────────────────────────────────────

class SectionHeader(Flowable):
    """A full-width emerald banner with the section number and title."""
    def __init__(self, number, title, width=None):
        Flowable.__init__(self)
        self.number = number
        self.title = title
        self._width = width or (PAGE_W - 50*mm)
        self.height = 18*mm

    def wrap(self, availWidth, availHeight):
        self._width = min(self._width, availWidth)
        return (self._width, self.height)

    def draw(self):
        c = self.canv
        w, h = self._width, self.height
        # Emerald background with rounded corners
        c.setFillColor(EMERALD)
        c.roundRect(0, 0, w, h, 4*mm, fill=1, stroke=0)
        # Number circle
        cx, cy = 13*mm, h/2
        c.setFillColor(WHITE)
        c.circle(cx, cy, 6.5*mm, fill=1, stroke=0)
        c.setFillColor(EMERALD)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(cx, cy - 3*mm, str(self.number))
        # Title text
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(24*mm, cy - 3.5*mm, self.title)


class WarningBox(Flowable):
    """A pale-red/orange warning callout box."""
    def __init__(self, text, width=None):
        Flowable.__init__(self)
        self.text = text
        self._width = width or (PAGE_W - 50*mm)
        # Estimate height
        self._height = max(12*mm, 8*mm + len(text) // 70 * 5*mm)

    def wrap(self, availWidth, availHeight):
        self._width = min(self._width, availWidth)
        return (self._width, self._height)

    def draw(self):
        c = self.canv
        w, h = self._width, self._height
        # Amber-tinted background
        c.setFillColor(HexColor("#fffbeb"))
        c.roundRect(0, 0, w, h, 3*mm, fill=1, stroke=0)
        # Left accent bar
        c.setFillColor(HexColor("#f59e0b"))
        c.roundRect(0, 0, 4*mm, h, 2*mm, fill=1, stroke=0)
        # Icon / text
        c.setFillColor(HexColor("#92400e"))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(7*mm, h - 6*mm, "⚠  IMPORTANT")
        c.setFont("Helvetica", 8.5)
        # Wrap the text roughly
        lines = []
        words = self.text.split()
        line = ""
        max_chars = int((w - 12*mm) / (4.2))
        for word in words:
            if len(line) + len(word) + 1 > max_chars:
                lines.append(line)
                line = word
            else:
                line = line + " " + word if line else word
        if line:
            lines.append(line)
        y = h - 6*mm - 4*mm
        for ln in lines:
            c.drawString(7*mm, y, ln)
            y -= 4*mm


class CheckboxItem(Flowable):
    """A single checklist row with a styled checkbox."""
    def __init__(self, text, width=None):
        Flowable.__init__(self)
        self.text = text
        self._width = width or (PAGE_W - 50*mm)
        self.height = 8*mm

    def wrap(self, availWidth, availHeight):
        self._width = min(self._width, availWidth)
        return (self._width, self.height)

    def draw(self):
        c = self.canv
        # Checkbox
        bx, by = 3*mm, 2*mm
        c.setStrokeColor(EMERALD_MED)
        c.setLineWidth(1.2)
        c.roundRect(bx, by, 4.5*mm, 4.5*mm, 1*mm, fill=0, stroke=1)
        # Text
        c.setFillColor(TEXT_DARK)
        c.setFont("Helvetica", 10)
        c.drawString(10*mm, 3*mm, self.text)


class DividerLine(Flowable):
    """A thin horizontal divider."""
    def __init__(self, width=None, color=BORDER_GREY):
        Flowable.__init__(self)
        self._width = width or (PAGE_W - 50*mm)
        self.height = 2*mm
        self.color = color

    def wrap(self, availWidth, availHeight):
        self._width = min(self._width, availWidth)
        return (self._width, self.height)

    def draw(self):
        c = self.canv
        c.setStrokeColor(self.color)
        c.setLineWidth(0.5)
        c.line(0, 1*mm, self._width, 1*mm)


# ── Page Decorations ───────────────────────────────────────────────

def page_background(canvas, doc):
    """Draws the top emerald stripe and footer on every page."""
    canvas.saveState()
    # Top accent bar
    canvas.setFillColor(EMERALD_DARK)
    canvas.rect(0, PAGE_H - 6*mm, PAGE_W, 6*mm, fill=1, stroke=0)
    # Thin secondary line
    canvas.setFillColor(EMERALD)
    canvas.rect(0, PAGE_H - 8*mm, PAGE_W, 2*mm, fill=1, stroke=0)
    # Footer
    canvas.setFillColor(TEXT_LIGHT)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(25*mm, 10*mm, "KEEVAN STORE — Manual Actions Required")
    canvas.drawRightString(PAGE_W - 25*mm, 10*mm, f"Page {doc.page}")
    # Footer line
    canvas.setStrokeColor(BORDER_GREY)
    canvas.setLineWidth(0.4)
    canvas.line(25*mm, 14*mm, PAGE_W - 25*mm, 14*mm)
    canvas.restoreState()


def first_page_background(canvas, doc):
    """Custom decoration for the title page."""
    canvas.saveState()
    # Top accent bar
    canvas.setFillColor(EMERALD_DARK)
    canvas.rect(0, PAGE_H - 6*mm, PAGE_W, 6*mm, fill=1, stroke=0)
    canvas.setFillColor(EMERALD)
    canvas.rect(0, PAGE_H - 8*mm, PAGE_W, 2*mm, fill=1, stroke=0)
    # Footer
    canvas.setFillColor(TEXT_LIGHT)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(25*mm, 10*mm, "KEEVAN STORE — Manual Actions Required")
    canvas.drawRightString(PAGE_W - 25*mm, 10*mm, f"Page {doc.page}")
    canvas.setStrokeColor(BORDER_GREY)
    canvas.setLineWidth(0.4)
    canvas.line(25*mm, 14*mm, PAGE_W - 25*mm, 14*mm)
    canvas.restoreState()


# ── Styles ─────────────────────────────────────────────────────────

styles = getSampleStyleSheet()

sTitle = ParagraphStyle(
    "DocTitle", parent=styles["Title"],
    fontName="Helvetica-Bold", fontSize=26, leading=32,
    textColor=EMERALD_DARK, alignment=TA_LEFT,
    spaceAfter=4*mm,
)
sSubtitle = ParagraphStyle(
    "DocSubtitle", parent=styles["Normal"],
    fontName="Helvetica", fontSize=11, leading=16,
    textColor=TEXT_MED, alignment=TA_LEFT,
    spaceAfter=8*mm,
)
sIntro = ParagraphStyle(
    "Intro", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, leading=15,
    textColor=TEXT_DARK, alignment=TA_JUSTIFY,
    spaceAfter=4*mm,
)
sBody = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, leading=15,
    textColor=TEXT_DARK, alignment=TA_JUSTIFY,
    spaceAfter=3*mm,
)
sBodyBold = ParagraphStyle(
    "BodyBold", parent=sBody,
    fontName="Helvetica-Bold",
)
sStep = ParagraphStyle(
    "Step", parent=styles["Normal"],
    fontName="Helvetica", fontSize=9.8, leading=14.5,
    textColor=TEXT_DARK, alignment=TA_LEFT,
    leftIndent=8*mm,
    spaceAfter=2.2*mm,
)
sStepNum = ParagraphStyle(
    "StepNum", parent=sStep,
    fontName="Helvetica-Bold",
    textColor=EMERALD,
)
sSubStep = ParagraphStyle(
    "SubStep", parent=sStep,
    leftIndent=16*mm,
    fontSize=9.3,
    spaceAfter=1.8*mm,
)
sCallout = ParagraphStyle(
    "Callout", parent=styles["Normal"],
    fontName="Helvetica-Oblique", fontSize=9.5, leading=14,
    textColor=EMERALD_DARK, alignment=TA_LEFT,
    leftIndent=6*mm, rightIndent=6*mm,
    spaceBefore=3*mm, spaceAfter=3*mm,
    backColor=EMERALD_BG,
    borderPadding=(3*mm, 4*mm, 3*mm, 4*mm),
)
sSectionNote = ParagraphStyle(
    "SectionNote", parent=styles["Normal"],
    fontName="Helvetica-Oblique", fontSize=9.5, leading=14,
    textColor=HexColor("#92400e"), alignment=TA_LEFT,
    leftIndent=6*mm, rightIndent=6*mm,
    spaceBefore=2*mm, spaceAfter=3*mm,
)
sChecklistHead = ParagraphStyle(
    "ChecklistHead", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=13, leading=18,
    textColor=EMERALD_DARK,
    spaceAfter=4*mm,
)

# ── Helper Functions ───────────────────────────────────────────────

def step_html(num, text):
    """Return a Paragraph for a numbered step with the number in emerald."""
    return Paragraph(
        f'<font name="Helvetica-Bold" color="{EMERALD.hexval()}">{num}.</font>  {text}',
        sStep
    )

def substep_html(letter, text):
    """Return a Paragraph for a sub-step."""
    return Paragraph(
        f'<font name="Helvetica-Bold" color="{EMERALD_MED.hexval()}">{letter})</font>  {text}',
        sSubStep
    )

def body(text):
    return Paragraph(text, sBody)

def bold_body(text):
    return Paragraph(text, sBodyBold)

def callout(text):
    return Paragraph(text, sCallout)

def note(text):
    return Paragraph(text, sSectionNote)

def spc(h=3*mm):
    return Spacer(1, h)

# ── Build the Story ────────────────────────────────────────────────

story = []

# ─── Title Page ────────────────────────────────────────────────────
story.append(Spacer(1, 30*mm))
story.append(Paragraph("KEEVAN STORE", sTitle))

# Green accent line under title
story.append(HRFlowable(
    width="40%", thickness=2.5, color=EMERALD,
    spaceAfter=5*mm, spaceBefore=0, hAlign='LEFT'
))

story.append(Paragraph(
    "Manual Actions Required",
    ParagraphStyle("SubTitle2", parent=sTitle, fontSize=20, leading=26, textColor=EMERALD)
))
story.append(spc(8*mm))
story.append(Paragraph(
    "A step-by-step guide for completing setup tasks that cannot be done within the "
    "codebase itself. Each item explains <b>what</b> needs to be done, <b>why</b> it matters, "
    "and <b>exactly how</b> to do it — no technical jargon left unexplained.",
    sIntro
))
story.append(spc(6*mm))

# Metadata table
meta_data = [
    ["Document:", "Manual Actions Required"],
    ["Project:", "Keevan Store v2"],
    ["Prepared:", "2026-03-04"],
    ["Status:", "Action Required"],
]
meta_table = Table(meta_data, colWidths=[35*mm, 100*mm])
meta_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 9.5),
    ('TEXTCOLOR', (0, 0), (0, -1), EMERALD_DARK),
    ('TEXTCOLOR', (1, 0), (1, -1), TEXT_DARK),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
    ('TOPPADDING', (0, 0), (-1, -1), 1.5*mm),
    ('LINEBELOW', (0, 0), (-1, -2), 0.3, BORDER_GREY),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(meta_table)

story.append(PageBreak())

# ─── Section 1: WhatsApp Notifications ────────────────────────────
story.append(SectionHeader(1, "Set Up WhatsApp Notifications (CallMeBot)"))
story.append(spc(4*mm))

story.append(body(
    "Right now, when someone submits the contact form or requests a withdrawal, the system "
    "tries to send you a WhatsApp notification — but it <b>silently fails</b> because the "
    "CallMeBot API key is not configured."
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_1 = [
    "Open WhatsApp on your phone",
    'Send a message saying <font name="Courier" size="9">"I allow callmebot to send me messages"</font> to the number <b>+34 644 52 74 88</b>',
    "Wait about 30 seconds — you will receive a reply with your API key",
    "Copy that API key",
    "Open your <b>.env</b> file (this is the file where secret settings live on your server)",
    'Find the line that says <font name="Courier" size="9">CALLMEBOT_APIKEY=</font> (it is currently empty)',
    'Paste your API key after the <font name="Courier" size="9">=</font> sign',
    "Save the file",
    "Restart your server (ask your developer or hosting provider to do this)",
]
for i, s in enumerate(steps_1, 1):
    story.append(step_html(i, s))

story.append(spc(3*mm))
story.append(callout(
    "After this, you will receive WhatsApp messages whenever someone contacts you or requests a withdrawal."
))

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 2: Pesapal IPN URL ───────────────────────────────────
story.append(SectionHeader(2, "Register Your Pesapal IPN URL"))
story.append(spc(4*mm))

story.append(body(
    "Pesapal needs to know where to send payment confirmations. This is called the "
    '<b>"IPN URL"</b> and it must be registered in your Pesapal merchant dashboard.'
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_2 = [
    'Log in to your Pesapal merchant dashboard at <font name="Courier" size="9">https://developer.pesapal.com</font>',
    'Go to <b>"IPN Settings"</b> or <b>"Webhook Configuration"</b>',
    'Enter this URL: <font name="Courier" size="9" color="' + EMERALD.hexval() + '">https://keevanstore.in/api/pesapal/ipn</font>',
    'Select <b>"POST"</b> as the method',
    'Save the settings',
    'Pesapal will send a test notification — check your server logs to confirm it was received',
]
for i, s in enumerate(steps_2, 1):
    story.append(step_html(i, s))

story.append(spc(3*mm))
story.append(note(
    "Without this, Pesapal will not notify your site when payments complete, and orders will "
    'stay in "pending" status forever.'
))

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 3: Cloudflare R2 CORS ────────────────────────────────
story.append(SectionHeader(3, "Configure Cloudflare R2 Bucket CORS"))
story.append(spc(4*mm))

story.append(body(
    "If creators are having trouble uploading files (photos, product files), it might be because "
    "your R2 bucket is not allowing uploads from your website domain."
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_3 = [
    'Log in to your Cloudflare dashboard at <font name="Courier" size="9">https://dash.cloudflare.com</font>',
    'Go to <b>"R2 Object Storage"</b> and click on your bucket',
    'Go to the <b>"Settings"</b> tab',
    'Find <b>"CORS Policy"</b> and click <b>"Edit"</b>',
    'Add a rule with these settings:',
]
for i, s in enumerate(steps_3, 1):
    story.append(step_html(i, s))

# CORS rule sub-table
cors_data = [
    ["Setting", "Value"],
    ["Allowed Origins", "https://keevanstore.in"],
    ["Allowed Methods", "GET, PUT, POST, DELETE"],
    ["Allowed Headers", "*"],
    ["Max Age", "86400"],
]
cors_table = Table(cors_data, colWidths=[45*mm, 95*mm])
cors_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BACKGROUND', (0, 0), (-1, 0), EMERALD),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('BACKGROUND', (0, 1), (-1, -1), EMERALD_BG),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [EMERALD_BG, WHITE]),
    ('GRID', (0, 0), (-1, -1), 0.4, BORDER_GREY),
    ('TOPPADDING', (0, 0), (-1, -1), 2.5*mm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5*mm),
    ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(spc(1*mm))
story.append(cors_table)
story.append(step_html(6, "Save the rule"))

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 4: Supabase RLS ─────────────────────────────────────
story.append(SectionHeader(4, "Confirm Supabase RLS Is Enabled"))
story.append(spc(4*mm))

story.append(body(
    "Row Level Security (RLS) is the feature that prevents one creator from seeing or editing "
    "another creator's data. It is defined in the code, but it must also be <b>enabled in the "
    "Supabase dashboard</b>."
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_4 = [
    'Log in to your Supabase dashboard at <font name="Courier" size="9">https://supabase.com</font>',
    'Select your project',
    'Go to the <b>"Table Editor"</b>',
    'For each table listed below:',
]
for i, s in enumerate(steps_4, 1):
    story.append(step_html(i, s))

# Table list
tables_4 = [
    "creators", "products", "events", "orders",
    "page_views", "donations", "withdrawals", "tickets", "download_sessions"
]
for t in tables_4:
    story.append(substep_html("a" if t == "creators" else "·", f"Table: <font name='Courier' size='9'>{t}</font>"))

story.append(spc(1*mm))
substeps_4 = [
    "Click on the table name",
    "Click the <b>\"RLS\"</b> tab at the top",
    'Make sure <b>"Enable RLS"</b> is turned <b>ON</b>',
    "Check that the policies listed match those in the file <font name='Courier' size='9'>supabase/schema.sql</font>",
]
for letter, s in zip(["a", "b", "c", "d"], substeps_4):
    story.append(substep_html(letter, s))

story.append(spc(3*mm))
story.append(note(
    "If RLS is not enabled on any table, anyone could potentially read or modify other creators' data."
))

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 5: SQL Schema Setup ─────────────────────────────────
story.append(SectionHeader(5, "Run the SQL Schema Setup"))
story.append(spc(4*mm))

story.append(body(
    "The database schema (tables, indexes, RLS policies, and helper functions) needs to be applied "
    "to your Supabase database. This is a <b>one-time setup</b>."
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_5 = [
    "Log in to your Supabase dashboard",
    'Go to <b>"SQL Editor"</b>',
    "Copy the entire contents of the file <font name='Courier' size='9'>supabase/schema.sql</font> from your project",
    "Paste it into the SQL Editor",
    'Click <b>"Run"</b>',
    "Check for any error messages — there should be none",
    'Go to <b>"Table Editor"</b> and confirm all 8 tables exist',
]
for i, s in enumerate(steps_5, 1):
    story.append(step_html(i, s))

story.append(spc(3*mm))
story.append(bold_body("Important — New helper functions added during the audit:"))

# Table style for cell content
sFuncCell = ParagraphStyle("FuncCell", parent=styles["Normal"],
    fontName="Courier", fontSize=8.5, leading=11,
    textColor=EMERALD_DARK)
sPurposeCell = ParagraphStyle("PurposeCell", parent=styles["Normal"],
    fontName="Helvetica", fontSize=8.5, leading=11,
    textColor=TEXT_DARK)

helper_funcs = [
    ("increment_creator_earnings", "prevents race conditions when multiple payments arrive at the same time"),
    ("increment_product_sales", "atomic sales counter"),
    ("increment_event_tickets", "atomic ticket counter"),
    ("process_donation", "atomic donation processing"),
    ("increment_creator_views", "atomic view counter"),
]
func_data = [
    [Paragraph("<b>Function</b>", ParagraphStyle("th", parent=sPurposeCell, textColor=WHITE, fontName="Helvetica-Bold")),
     Paragraph("<b>Purpose</b>", ParagraphStyle("th2", parent=sPurposeCell, textColor=WHITE, fontName="Helvetica-Bold"))]
] + [
    [Paragraph(f, sFuncCell), Paragraph(p, sPurposeCell)]
    for f, p in helper_funcs
]
func_table = Table(func_data, colWidths=[60*mm, 80*mm])
func_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 8.5),
    ('BACKGROUND', (0, 0), (-1, 0), EMERALD),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [EMERALD_BG, WHITE]),
    ('GRID', (0, 0), (-1, -1), 0.4, BORDER_GREY),
    ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
    ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(spc(2*mm))
story.append(func_table)

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 6: Real Pesapal Payment Test ─────────────────────────
story.append(SectionHeader(6, "Test With a Real Pesapal Payment"))
story.append(spc(4*mm))

story.append(body(
    "The checkout flow has been fixed and tested in mock mode, but it is <b>essential to test with "
    "a real mobile money payment</b> before going live."
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_6 = [
    "Make sure your Pesapal account is in <b>LIVE mode</b> (not sandbox)",
    "Open your store as a buyer would",
    'Click <b>"Buy Now"</b> on a product',
    "Enter your name and email",
    'Select <b>"MTN Mobile Money"</b> as the payment method',
    "Complete the payment on the Pesapal page using your phone",
    "After payment, you should be redirected to the success page",
    "Check that the download link works",
    "Check the creator's dashboard to confirm the balance increased by <b>90%</b> of the purchase price",
]
for i, s in enumerate(steps_6, 1):
    story.append(step_html(i, s))

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 7: Verify Admin Access ──────────────────────────────
story.append(SectionHeader(7, "Verify Admin Access"))
story.append(spc(4*mm))

story.append(body(
    "The admin dashboard is now properly protected. Make sure your admin account works correctly."
))
story.append(spc(2*mm))
story.append(bold_body("What to do:"))
story.append(spc(1*mm))

steps_7 = [
    "Log in with your admin email (<font name='Courier' size='9'>nkevinmegan@gmail.com</font>) and password",
    "You should be taken to the regular dashboard first",
    "Navigate to <font name='Courier' size='9'>/admin</font> in your browser",
    "You should see the admin dashboard with platform stats",
    "Try logging in with a non-admin account and navigating to <font name='Courier' size='9'>/admin</font> — you should be redirected to the regular dashboard",
]
for i, s in enumerate(steps_7, 1):
    story.append(step_html(i, s))

story.append(spc(4*mm))
story.append(DividerLine())
story.append(spc(4*mm))

# ─── Section 8: Production Deployment Checklist ──────────────────
story.append(SectionHeader(8, "Production Deployment Checklist"))
story.append(spc(4*mm))

story.append(body(
    "Before going live, confirm all of these are set up on your production server:"
))
story.append(spc(3*mm))

checklist_items = [
    "All environment variables from .env are set on the production server (never commit .env to git)",
    "The domain keevanstore.in is pointing to your server",
    "SSL/HTTPS is enabled (required for Pesapal and secure cookies)",
    "The server is running the production build (not development mode)",
    "File uploads are working (R2 bucket is accessible)",
    "Database schema has been applied",
    "Pesapal IPN URL is registered",
    "WhatsApp notifications are working (CallMeBot API key is set)",
    "A real payment test has been completed successfully",
]
for item in checklist_items:
    story.append(CheckboxItem(item))

story.append(spc(8*mm))

# ─── End Mark ─────────────────────────────────────────────────────
story.append(HRFlowable(
    width="30%", thickness=2, color=EMERALD,
    spaceAfter=4*mm, spaceBefore=2*mm, hAlign='CENTER'
))
story.append(Paragraph(
    "End of Manual Actions",
    ParagraphStyle("EndMark", parent=sBody, alignment=TA_CENTER,
                   fontName="Helvetica-Bold", fontSize=10, textColor=EMERALD)
))
story.append(Paragraph(
    "Complete all items above before launching to production.",
    ParagraphStyle("EndSub", parent=sBody, alignment=TA_CENTER,
                   fontName="Helvetica-Oblique", fontSize=9, textColor=TEXT_LIGHT)
))

# ── Build the PDF ──────────────────────────────────────────────────

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    topMargin=16*mm,
    bottomMargin=20*mm,
    leftMargin=25*mm,
    rightMargin=25*mm,
    title="KEEVAN STORE — Manual Actions Required",
    author="Keevan Store",
    subject="Manual setup actions for production deployment",
)

doc.build(story, onFirstPage=first_page_background, onLaterPages=page_background)

print(f"✅ PDF generated successfully: {OUTPUT_PATH}")
print(f"   File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")
