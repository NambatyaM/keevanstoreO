// ============================================================
// Terms and Conditions Page — Legally Required Trust Page
// Outlines rules, liabilities, IP guidelines, and dispute resolution
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/shared/site-footer";

export const metadata: Metadata = {
  title: "Terms and Conditions — Keevan Store",
  description:
    "Keevan Store Terms and Conditions outline the rules, liabilities, intellectual property guidelines, and dispute resolution for using our creator commerce platform. Read before signing up or making a purchase.",
  keywords: [
    "Keevan Store terms",
    "terms and conditions",
    "user agreement",
    "intellectual property policy",
    "creator terms Uganda",
    "refund policy",
  ],
  openGraph: {
    title: "Terms and Conditions — Keevan Store",
    description:
      "Read the Terms and Conditions for using Keevan Store, including rules, IP guidelines, and dispute resolution.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms and Conditions — Keevan Store",
    description:
      "Read the Terms and Conditions for using Keevan Store, including rules, IP guidelines, and dispute resolution.",
  },
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2" aria-label="Keevan Store Home">
            <Image src="/logo-new.png" alt="Keevan Store" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-foreground">Keevan Store</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/about">About</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
                Legal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Terms and Conditions
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Rules, liabilities, and intellectual property guidelines for using Keevan Store
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: June 13, 2026 &middot; Effective from: June 13, 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="pb-16 sm:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 prose prose-neutral dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-li:text-muted-foreground prose-li:leading-relaxed
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3">

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Keevan Store (the &quot;Platform&quot;), available at keevanstore.in, you
              agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to all of
              these Terms, do not use the Platform. These Terms apply to all users of the Platform,
              including creators who set up stores, buyers who purchase products or event tickets,
              donors, and visitors who browse the site. We reserve the right to modify these Terms at any
              time, and your continued use of the Platform after any such changes constitutes your
              acceptance of the new Terms.
            </p>
            <p>
              Keevan Store is a creator commerce platform that enables individuals in Uganda to create
              online storefronts, sell digital products and event tickets, accept donations, and receive
              payouts via mobile money. The Platform is operated by Keevan Store and all payments are
              processed through Pesapal, a licensed payment gateway. These Terms constitute a legally
              binding agreement between you and Keevan Store.
            </p>

            <h2>2. Account Registration</h2>
            <p>
              To create a store on Keevan Store, you must register for a creator account by providing
              your full name, email address, and phone number. You must be at least 18 years old to
              create an account. By registering, you represent and warrant that the information you
              provide is accurate, complete, and not misleading. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities that occur under your
              account. You must notify us immediately of any unauthorized use of your account by
              contacting us on WhatsApp at +256 768 345 905.
            </p>
            <p>
              Each person may maintain only one creator account. Usernames must be between 3 and 30
              characters and may only contain lowercase letters, numbers, and hyphens. We reserve the
              right to reject or remove any username that is offensive, misleading, infringes on
              trademarks, or violates these Terms. We also reserve the right to suspend or terminate
              accounts that violate these Terms or are used for fraudulent or abusive purposes.
            </p>

            <h2>3. Creator Obligations</h2>
            <p>As a creator on Keevan Store, you agree to the following obligations:</p>
            <ul>
              <li>
                <strong>Product authenticity:</strong> You must only list products that you have the
                legal right to sell. You must own the intellectual property rights to the digital files
                you upload, or have explicit authorization from the rights holder. Selling pirated,
                stolen, or unauthorized content is strictly prohibited and will result in immediate
                account termination.
              </li>
              <li>
                <strong>Accurate descriptions:</strong> You must provide accurate and truthful
                descriptions, titles, and pricing for all products and events. Misleading descriptions,
                bait-and-switch tactics, or false claims about product features are prohibited.
              </li>
              <li>
                <strong>Product quality:</strong> Digital products must be delivered in the format
                described and must be functional and usable. Event details (date, time, venue) must be
                accurate at the time of ticket sale. If an event is cancelled or significantly changed,
                you are responsible for notifying ticket holders.
              </li>
              <li>
                <strong>Compliance with laws:</strong> You must comply with all applicable laws and
                regulations in Uganda, including tax obligations on your earnings. Keevan Store is not
                responsible for your tax compliance and does not withhold taxes on your behalf.
              </li>
              <li>
                <strong>Prohibited content:</strong> You must not sell or distribute content that is
                illegal, harmful, threatening, abusive, defamatory, pornographic, or otherwise
                objectionable. This includes but is not limited to malware, viruses, personal data of
                others without consent, and content that promotes violence or illegal activities.
              </li>
            </ul>

            <h2>4. Buyer Obligations</h2>
            <p>
              When purchasing products or event tickets on Keevan Store, you agree to provide accurate
              contact information (name and email) so that we can deliver your purchase. You understand
              that digital products are delivered via a download link sent to your email, which is valid
              for 24 hours. Event tickets are delivered as QR codes sent to your email. You must not
              share, resell, or redistribute digital products you have purchased unless explicitly
              authorized by the creator. You must not attempt to circumvent download restrictions, forge
              event tickets, or engage in payment fraud.
            </p>
            <p>
              Payments are processed through Pesapal using MTN Mobile Money, Airtel Money, bank
              transfer, or card. Once a payment is initiated, it cannot be cancelled. Refunds are
              handled on a case-by-case basis as described in Section 10 (Refund Policy). By making a
              purchase, you authorize Pesapal to process the payment and acknowledge that the creator
                will receive your name, email, and order details.
            </p>

            <h2>5. Pricing, Fees, and Payments</h2>
            <h3>5.1 Platform Fee</h3>
            <p>
              Keevan Store charges a 10% platform fee on every successful sale. This means that for
              every product sold, the creator receives 90% of the sale price and Keevan Store retains
              10%. The platform fee covers payment processing, file hosting, platform maintenance,
              security, and support. There are no monthly subscription fees, setup fees, or hidden
              charges. The minimum product price is UGX 1,000.
            </p>

            <h3>5.2 Withdrawals</h3>
            <p>
              Creators can request a withdrawal of their earnings when their balance reaches at least
              UGX 50,000. Withdrawals are processed to the creator&apos;s mobile money account (MTN Mobile
              Money or Airtel Money). Withdrawal requests are reviewed and processed by the platform
              admin. Processing times may vary, but we aim to complete withdrawals within 3-5 business
              days. Keevan Store is not responsible for delays caused by mobile network providers or
              incorrect phone numbers provided by the creator.
            </p>

            <h3>5.3 Currency</h3>
            <p>
              All prices and transactions on Keevan Store are in Ugandan Shillings (UGX). Prices are
              displayed with UGX thousand separators. Creators set their own product prices (subject to
              the UGX 1,000 minimum). Buyers are charged the exact price listed at the time of
              purchase. Prices displayed on the platform include all applicable fees — there are no
              additional charges at checkout beyond the listed price.
            </p>

            <h2>6. Intellectual Property</h2>
            <h3>6.1 Creator Content</h3>
            <p>
              Creators retain all intellectual property rights in the content they upload to the
              Platform, including digital product files, images, descriptions, and branding materials.
              By uploading content to Keevan Store, creators grant Keevan Store a limited,
              non-exclusive, worldwide license to host, store, and deliver that content to buyers who
              have purchased it. This license is solely for the purpose of operating the Platform and
              fulfilling orders. Keevan Store does not claim ownership of creator content and will not
              use it for any purpose other than providing the Platform services.
            </p>

            <h3>6.2 Platform Intellectual Property</h3>
            <p>
              The Keevan Store name, logo, website design, codebase, and all associated branding are
              the intellectual property of Keevan Store. Creators and buyers may not use the Keevan
              Store name, logo, or branding in any way that implies endorsement, partnership, or
              affiliation without prior written consent. The &quot;Powered by Keevan Store&quot; footer displayed
              on creator store pages must not be removed or altered.
            </p>

            <h3>6.3 Infringement Claims</h3>
            <p>
              If you believe that content on Keevan Store infringes your intellectual property rights,
              please contact us on WhatsApp at +256 768 345 905 with a description of the infringing content,
              the URL where it appears, proof of your ownership of the rights, and your contact
              information. We will investigate all legitimate claims and may remove infringing content
              and suspend the accounts of repeat infringers.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              Keevan Store provides the Platform &quot;as is&quot; and &quot;as available&quot; without warranties of any
              kind, either express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement. We do not
              guarantee that the Platform will be error-free, uninterrupted, or free from viruses or
              other harmful components.
            </p>
            <p>
              To the maximum extent permitted by applicable law, Keevan Store shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, including but not
              limited to loss of profits, data, use, or goodwill, arising out of or in connection with
              your use of the Platform. Our total liability to you for any claims arising out of or
              related to these Terms or the Platform shall not exceed the total fees you have paid to
              Keevan Store in the 12 months preceding the claim (or UGX 500,000, whichever is greater).
            </p>
            <p>
              Keevan Store acts as an intermediary between creators and buyers. We are not a party to
              any transaction between a creator and a buyer, and we are not responsible for the quality,
              safety, legality, or delivery of products sold by creators. Any disputes between creators
              and buyers should be resolved directly between the parties, though we may assist in
              mediation at our discretion.
            </p>

            <h2>8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Keevan Store, its officers, directors,
              employees, agents, and affiliates from and against any and all claims, damages, losses,
              liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or
              related to: (a) your use of the Platform; (b) your violation of these Terms; (c) your
              violation of any applicable law or regulation; (d) any content you upload, sell, or
              distribute through the Platform; or (e) any intellectual property infringement claim
              related to your content. This indemnification obligation will survive the termination of
              your account and these Terms.
            </p>

            <h2>9. Account Suspension and Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without
              notice, for any reason, including but not limited to: violation of these Terms, fraudulent
              activity, sale of prohibited content, abuse of the payment system, or conduct that is
              harmful to other users or the Platform. If your account is terminated for a violation of
              these Terms, any outstanding earnings may be forfeited at our discretion. If your account
              is terminated without cause, we will pay out any pending earnings that exceed the minimum
              withdrawal threshold.
            </p>
            <p>
              You may delete your account at any time by contacting us on WhatsApp at +256 768 345 905. Upon
              account deletion, your store page and all products will be removed from the Platform.
              Existing orders and transaction records will be retained as required by law. Any pending
              earnings above the minimum withdrawal threshold will be processed within 30 days of
              account deletion.
            </p>

            <h2>10. Refund Policy</h2>
            <p>
              Due to the nature of digital products, all sales are generally considered final once the
              buyer has received the download link or event ticket. However, we recognize that
              exceptional circumstances may arise. Refunds may be considered in the following
              situations:
            </p>
            <ul>
              <li>
                <strong>Duplicate payment:</strong> If a buyer is charged twice for the same product
                due to a technical error, the duplicate charge will be refunded in full.
              </li>
              <li>
                <strong>Product not delivered:</strong> If a buyer does not receive the download link
                or event ticket within 24 hours of a successful payment, they may request a refund.
              </li>
              <li>
                <strong>Event cancellation:</strong> If a creator cancels an event, all ticket buyers
                are entitled to a full refund. The creator is responsible for notifying attendees and
                requesting that refunds be issued.
              </li>
              <li>
                <strong>Significantly misrepresented product:</strong> If a product&apos;s description is
                materially different from what is delivered, the buyer may request a refund. This will
                be evaluated on a case-by-case basis.
              </li>
            </ul>
            <p>
              Refund requests must be submitted within 7 days of purchase by contacting us on
              WhatsApp at +256 768 345 905. Refunds are processed at the discretion of Keevan Store and, if
              approved, will be returned using the original payment method. The 10% platform fee is
              non-refundable once a transaction has been completed.
            </p>

            <h2>11. Dispute Resolution</h2>
            <p>
              Any disputes arising out of or in connection with these Terms or the use of the Platform
              shall be resolved in the following manner: First, the parties shall attempt to resolve the
              dispute through good-faith negotiation. If the dispute cannot be resolved within 30 days,
              either party may escalate the matter to mediation in Uganda. If mediation is unsuccessful,
              the dispute shall be resolved by the courts of Uganda, and you consent to the exclusive
              jurisdiction of the courts in Uganda. These Terms shall be governed by and construed in
              accordance with the laws of Uganda, without regard to its conflict of law provisions.
            </p>

            <h2>12. Force Majeure</h2>
            <p>
              Keevan Store shall not be liable for any failure or delay in performing its obligations
              under these Terms where such failure or delay results from circumstances beyond its
              reasonable control, including but not limited to: natural disasters, wars, terrorism,
              riots, embargoes, acts of civil or military authorities, fire, floods, accidents,
              strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials,
              pandemics, or failures of third-party systems (including payment processors, hosting
              providers, or internet service providers).
            </p>

            <h2>13. Miscellaneous</h2>
            <p>
              These Terms constitute the entire agreement between you and Keevan Store regarding the
              use of the Platform and supersede any prior agreements or understandings. If any
              provision of these Terms is found to be invalid or unenforceable, the remaining
              provisions shall continue in full force and effect. The failure of Keevan Store to
              enforce any right or provision of these Terms shall not constitute a waiver of such right
              or provision. You may not assign or transfer these Terms or your account without our
              prior written consent. Our rights under these Terms may be assigned without restriction.
            </p>

            <h2>14. Contact Information</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <ul>
              <li>WhatsApp: +256 768 345 905</li>
              <li>General inquiries: <Link href="/contact" className="text-emerald-600 hover:underline">Contact Us page</Link></li>
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
