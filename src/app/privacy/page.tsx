// ============================================================
// Privacy Policy Page — Legally Required Trust Page
// Includes cookie/ad disclosure for Google and third-party vendors
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/shared/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Keevan Store",
  description:
    "Keevan Store Privacy Policy explains how we collect, use, store, and protect your personal data when you use our creator commerce platform. Includes details on cookies, Google advertising, and third-party data practices.",
  keywords: [
    "Keevan Store privacy policy",
    "data protection Uganda",
    "cookie policy",
    "Google advertising cookies",
    "personal data protection",
    "mobile money privacy",
  ],
  openGraph: {
    title: "Privacy Policy — Keevan Store",
    description:
      "Learn how Keevan Store collects, uses, and protects your personal data. Includes cookie and advertising disclosure.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — Keevan Store",
    description:
      "Learn how Keevan Store collects, uses, and protects your personal data. Includes cookie and advertising disclosure.",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-2" aria-label="Keevan Store Home">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
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
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
                Legal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              How Keevan Store collects, uses, and protects your personal data
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

            <h2>1. Introduction</h2>
            <p>
              Keevan Store (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website keevanstore.in and the
              associated creator commerce platform. This Privacy Policy explains how we collect, use,
              disclose, and protect your personal information when you visit our website, create a store,
              purchase products, or interact with any of our services. By using Keevan Store, you consent
              to the data practices described in this policy. If you do not agree with the terms of this
              Privacy Policy, please do not access the site or use our services.
            </p>
            <p>
              We are committed to ensuring that your personal information is handled in a safe and
              responsible manner. This policy applies to all users of the platform, including creators who
              set up stores, buyers who purchase products or event tickets, donors who make contributions,
              and visitors who browse the site. We comply with applicable data protection laws in Uganda
              and follow internationally recognized best practices for data privacy and security.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide Directly</h3>
            <p>
              When you sign up as a creator on Keevan Store, we collect your full name, email address,
              phone number (for mobile money withdrawals), username, display name, bio, profile photo,
              banner image, and social media links (Instagram, TikTok, Twitter, WhatsApp). This
              information is necessary to set up and personalize your store, process your payments, and
              communicate with you about your account, sales, and withdrawals. Your display name, bio,
              profile photo, banner, and social links are visible on your public store page.
            </p>
            <p>
              When a buyer purchases a product or event ticket, we collect their full name, email address,
              and chosen payment method. The buyer&apos;s email is used to deliver the download link or
              event ticket with QR code. The buyer&apos;s name and email are shared with the creator whose
              product was purchased so they can fulfill the order and manage event check-in. We do not
              share the buyer&apos;s phone number or payment credentials with creators.
            </p>
            <p>
              When someone makes a donation, we collect their name, email address, and donation amount.
              The creator receives the donor&apos;s name and donation amount for their records. Donors can
              choose to donate anonymously, in which case their name will not be shown to the creator.
            </p>
            <p>
              When a creator requests a withdrawal, we collect the mobile money phone number and provider
              (MTN or Airtel) to which the funds should be sent. This information is stored securely and
              used only for processing the withdrawal request.
            </p>

            <h3>2.2 Information Collected Automatically</h3>
            <p>
              When you visit our website or interact with our services, we automatically collect certain
              technical information, including your IP address, browser type, operating system, referring
              URL, pages visited, time spent on pages, and the date and time of your visit. We collect
              this data through cookies, web beacons, and similar tracking technologies as described in
              Section 5 (Cookies and Tracking Technologies). This information helps us understand how
              visitors use our platform, diagnose technical problems, and improve the user experience.
            </p>
            <p>
              We also track page views on creator store pages and product pages for analytics purposes.
              Creators can see aggregate page view data in their analytics dashboard, including the number
              of views, referral sources, and date ranges. We do not share individual visitor IP addresses
              or personally identifiable browsing data with creators — only aggregated, anonymized
              statistics.
            </p>

            <h3>2.3 Information from Third Parties</h3>
            <p>
              We receive information from third-party service providers that help us operate the platform.
              Pesapal, our payment processing partner, provides us with transaction confirmation data
              including payment status, transaction reference, and payment method used. Pesapal does not
              share your full card number or mobile money PIN with us. Supabase, our database provider,
              stores and processes your account data under our instructions. Cloudflare R2, our file
              storage provider, stores uploaded digital product files. Google may provide us with
              aggregated analytics data through Google Analytics (if enabled), as described in Section 6
              (Third-Party Advertising and Google Services).
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the personal information we collect for the following purposes:</p>
            <ul>
              <li>
                <strong>Account creation and management:</strong> To create and maintain your creator
                account, personalize your store page, and enable you to manage your products, events,
                and settings.
              </li>
              <li>
                <strong>Order processing and fulfillment:</strong> To process purchases, deliver digital
                products and event tickets, send download links and QR codes, and handle refund
                requests when applicable.
              </li>
              <li>
                <strong>Payment processing:</strong> To facilitate payments through Pesapal, track your
                earnings balance, and process withdrawal requests to your mobile money account.
              </li>
              <li>
                <strong>Communication:</strong> To send order confirmations, download links, ticket
                details, withdrawal status updates, and important platform notifications. We may also
                send occasional product updates or promotional messages, which you can opt out of at
                any time.
              </li>
              <li>
                <strong>Analytics and improvement:</strong> To track page views, analyze sales trends,
                measure platform performance, and improve our services. Creators have access to their
                own analytics data through the dashboard.
              </li>
              <li>
                <strong>Security and fraud prevention:</strong> To detect and prevent unauthorized
                access, fraudulent transactions, abuse of the platform, and to enforce our Terms and
                Conditions.
              </li>
              <li>
                <strong>Legal compliance:</strong> To comply with applicable laws, regulations, legal
                processes, or governmental requests in Uganda or any jurisdiction where we operate.
              </li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties for their
              marketing purposes. We share your information only in the following circumstances:
            </p>
            <ul>
              <li>
                <strong>With creators:</strong> When a buyer purchases a product or event ticket from a
                creator, we share the buyer&apos;s name, email address, and order details with that creator
                so they can fulfill the order and manage event check-in. This is essential for the
                platform to function as intended.
              </li>
              <li>
                <strong>With payment processors:</strong> We share transaction data with Pesapal to
                process payments securely. Pesapal processes payments in accordance with its own privacy
                policy and applicable financial regulations. We do not share your full payment credentials
                with anyone.
              </li>
              <li>
                <strong>With service providers:</strong> We use Supabase for database hosting and
                authentication, Cloudflare R2 for file storage, and Vercel for application hosting.
                These providers process your data only on our instructions and are contractually
                obligated to protect it.
              </li>
              <li>
                <strong>For legal reasons:</strong> We may disclose your information if required by law,
                regulation, legal process, or governmental request, or if we believe in good faith that
                disclosure is necessary to protect our rights, your safety, or the safety of others,
                investigate fraud, or respond to a government request.
              </li>
            </ul>

            <h2>5. Cookies and Tracking Technologies</h2>
            <h3>5.1 What Are Cookies?</h3>
            <p>
              Cookies are small text files that are stored on your device when you visit a website. They
              are widely used to make websites work more efficiently, provide a better browsing
              experience, and supply information to the owners of the site. Cookies can be &quot;persistent&quot;
              (stored on your device until they expire or you delete them) or &quot;session&quot; cookies (deleted
              when you close your browser).
            </p>

            <h3>5.2 Cookies We Use</h3>
            <p>Keevan Store uses the following types of cookies:</p>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> These cookies are strictly necessary for the
                operation of our website. They include session cookies that keep you logged in to your
                creator dashboard and authentication cookies that verify your identity. Without these
                cookies, you would not be able to use features like your dashboard, product management,
                or checkout. These cookies cannot be disabled.
              </li>
              <li>
                <strong>Functional Cookies:</strong> These cookies allow the website to remember choices
                you make (such as your preferred theme or recently viewed products) and provide enhanced,
                personalized features. They do not collect information that identifies you personally.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> These cookies collect information about how visitors
                use our website, such as which pages are visited most often, how long visitors spend on
                each page, and whether they encounter error messages. We use this information to improve
                our website and services. Analytics cookies are typically set by third-party tools such as
                Google Analytics. The information collected is aggregated and anonymous.
              </li>
              <li>
                <strong>Advertising Cookies:</strong> These cookies are used to deliver advertisements
                that are relevant to you and your interests. They are also used to limit the number of
                times you see an advertisement and to measure the effectiveness of advertising campaigns.
                Advertising cookies are usually placed by advertising networks with our permission. They
                remember that you have visited a website and this information may be shared with other
                organizations such as advertisers. See Section 6 for details about Google&apos;s use of
                advertising cookies.
              </li>
            </ul>

            <h3>5.3 Managing Cookies</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can set your
              browser to refuse all cookies, accept only certain cookies, or alert you when a cookie is
              being set. You can also delete cookies that have already been placed on your device. Please
              note that if you disable essential cookies, some features of Keevan Store may not function
              properly — for example, you may not be able to stay logged in to your account or complete a
              purchase. To manage cookies in your browser, consult the help documentation for your
              specific browser (Chrome, Firefox, Safari, Edge, etc.).
            </p>

            <h2>6. Third-Party Advertising and Google Services</h2>
            <h3>6.1 Google Advertising Cookies</h3>
            <p>
              We may use Google services, including Google Analytics and Google Ads, on our platform.
              Google uses cookies to serve ads based on your prior visits to our website or other websites
              on the internet. Google&apos;s advertising cookies enable it and its partners to serve ads
              based on your visit to our site and/or other sites on the internet. When you visit our
              website, Google may set one or more cookies on your device. These cookies are used to:
            </p>
            <ul>
              <li>
                <strong>Personalize ads:</strong> Google uses cookies to serve personalized ads based on
                your browsing history and interests. For example, if you have visited pages about digital
                products or event tickets, Google may show you relevant advertisements for Keevan Store
                or similar services on other websites you visit.
              </li>
              <li>
                <strong>Measure ad effectiveness:</strong> Google uses cookies to track conversions from
                ads — that is, to determine whether you clicked on an ad and subsequently signed up or
                made a purchase. This helps us and Google understand the return on investment for our
                advertising spend.
              </li>
              <li>
                <strong>Remarketing:</strong> Google cookies may be used for remarketing, which means
                showing ads to people who have previously visited our website. For example, if you
                visited our signup page but did not complete registration, you may see Keevan Store ads
                on other websites encouraging you to return and finish setting up your store.
              </li>
              <li>
                <strong>Analytics:</strong> Google Analytics uses cookies to collect data about how
                visitors interact with our website, including pages visited, time on site, bounce rate,
                and traffic sources. This data is aggregated and anonymized. We use this information to
                improve our website and marketing efforts.
              </li>
            </ul>

            <h3>6.2 Google&apos;s Privacy Practices</h3>
            <p>
              Google&apos;s use of advertising cookies is governed by Google&apos;s own Privacy Policy, available
              at https://policies.google.com/privacy. Google may share anonymized, aggregated data with
              its partners. Users can opt out of personalized advertising by visiting Google Ads Settings
              at https://www.google.com/settings/ads. You can also opt out of Google Analytics tracking
              by installing the Google Analytics Opt-out Browser Add-on, available at
              https://tools.google.com/dlpage/gaoptout.
            </p>

            <h3>6.3 Third-Party Ad Networks</h3>
            <p>
              In addition to Google, we may work with other third-party ad networks and advertising
              partners who may use cookies, web beacons, and similar technologies to collect information
              about your interactions with our website and other websites. This information is used to
              display advertisements that are likely to be of interest to you and to measure the
              effectiveness of advertising campaigns. These third-party ad networks have their own
              privacy policies, and we encourage you to review them. We do not have access to or control
              over the cookies that these third parties set on your device.
            </p>

            <h2>7. Data Security</h2>
            <p>
              We take the security of your personal information seriously and implement appropriate
              technical and organizational measures to protect it against unauthorized access, alteration,
              disclosure, or destruction. Specific measures include: Row Level Security (RLS) on all
              database tables, ensuring that creators can only access their own data and buyers can only
              see their own orders; encrypted HTTPS connections for all data in transit; secure, signed
              URLs for digital product downloads that expire after 24 hours; authentication tokens stored
              securely in HTTP-only cookies; and regular security reviews of our infrastructure and
              codebase. Our payment processing partner Pesapal is a licensed and regulated payment
              gateway that complies with financial security standards. While we strive to protect your
              personal information, no method of transmission over the Internet or electronic storage is
              100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to
              provide you services. If you delete your account, we will delete or anonymize your personal
              information within 30 days, except where we are required to retain certain information by
              law (such as financial transaction records, which we may retain for up to 7 years for tax
              and regulatory compliance). Anonymous, aggregated data (such as analytics statistics) may
              be retained indefinitely for research and improvement purposes, as it cannot be used to
              identify you personally.
            </p>

            <h2>9. Your Rights</h2>
            <p>
              Depending on your location and applicable laws, you may have the following rights regarding
              your personal information:
            </p>
            <ul>
              <li>
                <strong>Access:</strong> You have the right to request a copy of the personal data we
                hold about you. You can view most of your account data directly from your dashboard
                settings.
              </li>
              <li>
                <strong>Correction:</strong> You have the right to request correction of inaccurate or
                incomplete personal data. You can update most of your profile information from your
                store settings page.
              </li>
              <li>
                <strong>Deletion:</strong> You have the right to request deletion of your personal data,
                subject to our legal obligations to retain certain records (such as financial
                transactions). To request account deletion, please contact us on WhatsApp at +256 768 345 905.
              </li>
              <li>
                <strong>Objection:</strong> You have the right to object to the processing of your
                personal data for direct marketing purposes. You can opt out of promotional emails at
                any time using the unsubscribe link in the email.
              </li>
              <li>
                <strong>Data portability:</strong> You have the right to request a copy of your data in
                a structured, commonly used, and machine-readable format.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us on WhatsApp at +256 768 345 905. We will
              respond to your request within 30 days.
            </p>

            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Keevan Store is not intended for use by individuals under the age of 18. We do not
              knowingly collect personal information from children under 18. If we learn that we have
              collected personal information from a child under 18, we will delete that information
              promptly. If you are a parent or guardian and believe that your child has provided us with
              personal information, please contact us on WhatsApp at +256 768 345 905.
            </p>

            <h2>11. International Data Transfers</h2>
            <p>
              Keevan Store is operated from Uganda, and your data is primarily processed and stored on
              servers operated by our service providers (Supabase, Cloudflare, and Vercel), which may
              have servers located in various countries. When your data is transferred to a country
              outside Uganda, we ensure that appropriate safeguards are in place, such as contractual
              commitments with our service providers to protect your data in accordance with applicable
              data protection laws. By using our platform, you consent to the transfer of your
              information to these countries.
            </p>

            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technologies, legal requirements, or other factors. When we make changes, we will update
              the &quot;Last updated&quot; date at the top of this page. If the changes are material, we will
              notify you by email or by posting a prominent notice on our website before the changes
              take effect. We encourage you to review this Privacy Policy periodically to stay informed
              about how we protect your information.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact us:
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
