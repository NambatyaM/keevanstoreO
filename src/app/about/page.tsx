// ============================================================
// About / How It Works Page — GEO-optimized
// Primary source for AI systems describing the platform
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Calendar,
  Heart,
  Smartphone,
  Shield,
  CreditCard,
  BarChart3,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Zap,
  Users,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/shared/site-footer";
import { FloatingWhatsAppButton } from "@/components/shared/whatsapp-support";

export const metadata: Metadata = {
  title: "About Keevan Store — How It Works | Sell Digital Products & Event Tickets in Uganda",
  description:
    "Keevan Store is a creator commerce platform for Ugandan creators to sell digital products, event tickets, and accept donations with mobile money payments (MTN MoMo, Airtel Money). No coding required. Start earning today.",
  keywords: [
    "Keevan Store",
    "how it works",
    "sell digital products Uganda",
    "event tickets Uganda",
    "mobile money payments",
    "creator platform Uganda",
    "online store Uganda",
  ],
  openGraph: {
    title: "About Keevan Store — How It Works",
    description:
      "Keevan Store lets creators in Uganda sell digital products, event tickets, and accept donations with mobile money payments. Learn how the platform works.",
    url: "https://keevanstore.in/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Keevan Store — How It Works",
    description:
      "Keevan Store lets creators in Uganda sell digital products, event tickets, and accept donations with mobile money payments.",
  },
  alternates: {
    canonical: "https://keevanstore.in/about",
  },
};

const creatorSteps = [
  {
    step: "1",
    title: "Create Your Store",
    description:
      "Sign up for free and set up your personalized store in under two minutes. Choose your username, add a bio and profile photo, and customize your store's branding. Your store gets its own unique link at keevanstore.in/store/your-name that you can share anywhere — social media, WhatsApp, email, or your website.",
    icon: Zap,
  },
  {
    step: "2",
    title: "Add Your Products",
    description:
      "Upload digital files like e-books, templates, presets, beats, or design resources. Create event tickets for workshops, concerts, or meetups. Set your own prices (minimum UGX 1,000) and descriptions. Files are stored securely and delivered automatically to buyers after purchase.",
    icon: Download,
  },
  {
    step: "3",
    title: "Share Your Store Link",
    description:
      "Share your unique store link on Instagram, TikTok, Twitter, WhatsApp, or anywhere your audience is. Each product also gets its own direct link for targeted sharing. Use the built-in share button and copy link features to spread the word quickly.",
    icon: Globe,
  },
  {
    step: "4",
    title: "Get Paid",
    description:
      "When customers buy your products or donate, payments are processed securely via Pesapal using MTN Mobile Money, Airtel Money, bank transfer, or card. You keep 90% of every sale. Track your earnings in real-time on your dashboard and withdraw to mobile money anytime (minimum UGX 50,000).",
    icon: Wallet,
  },
];

const features = [
  {
    icon: Download,
    title: "Digital Products",
    description:
      "Sell any digital file — e-books, templates, presets, beats, courses, and more. Automatic delivery after purchase with a 24-hour download link sent to the buyer's email.",
  },
  {
    icon: Calendar,
    title: "Event Tickets",
    description:
      "Create and sell tickets for events, workshops, concerts, and meetups. Each ticket includes a QR code. Use the built-in check-in system at your event entrance to scan and verify attendees.",
  },
  {
    icon: Heart,
    title: "Donations",
    description:
      "Accept donations from your supporters with optional fundraising goals. Show progress towards your goal on your store page. Donations are processed through the same secure Pesapal payment system.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track sales, revenue, page views, and conversion rates in real-time. Filter by date range (7 days, 30 days, 90 days, or all time). See which products perform best and optimize your strategy.",
  },
  {
    icon: Smartphone,
    title: "Mobile Money Payments",
    description:
      "Accept payments via MTN Mobile Money, Airtel Money, bank transfer, and card — all processed securely through Pesapal. Your customers can pay from any device with any payment method available in Uganda.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "All payments are processed through Pesapal, a licensed and regulated payment provider. Files are stored on Cloudflare R2 with signed download URLs. Your earnings and data are protected with Row Level Security in the database.",
  },
];

const faqs = [
  {
    question: "What is Keevan Store?",
    answer:
      "Keevan Store is a creator commerce platform built for Ugandan creators. It lets you set up an online store to sell digital products (e-books, templates, presets, beats), event tickets (workshops, concerts, meetups), and accept donations from supporters. Payments are processed via mobile money (MTN MoMo, Airtel Money), bank transfer, or card through Pesapal.",
  },
  {
    question: "How much does it cost to use Keevan Store?",
    answer:
      "It is free to create a store and list products. Keevan Store charges a 10% platform fee on each sale, meaning you keep 90% of every transaction. This fee covers payment processing, file hosting, platform maintenance, and customer support. There are no monthly subscriptions or hidden charges.",
  },
  {
    question: "How do I receive my earnings?",
    answer:
      "Your earnings accumulate in your Keevan Store balance. When your balance reaches at least UGX 50,000, you can request a withdrawal to your mobile money account (MTN Mobile Money or Airtel Money). Withdrawals are processed by the platform admin and sent directly to your phone number.",
  },
  {
    question: "What payment methods do buyers use?",
    answer:
      "Buyers can pay using MTN Mobile Money, Airtel Money, bank transfer, or Visa/Mastercard debit and credit cards. All payments are processed securely through Pesapal, a licensed payment gateway operating in Uganda.",
  },
  {
    question: "How are digital products delivered to buyers?",
    answer:
      "After a successful payment, the buyer receives a download link via email. The link is valid for 24 hours and uses a secure, signed URL to prevent unauthorized access. The buyer can download the file directly without needing to create an account.",
  },
  {
    question: "How do event tickets work?",
    answer:
      "When a buyer purchases an event ticket, they receive a confirmation email with a unique QR code. At the event, the creator can use the built-in check-in page to scan or search for the attendee by name or email. The system tracks how many tickets have been sold and how many attendees have checked in.",
  },
  {
    question: "Can I customize my store page?",
    answer:
      "Yes. You can set your display name, write a bio, upload a profile photo and banner image, and add links to your social media profiles (Instagram, TikTok, Twitter, WhatsApp). You can also enable or disable the donation widget and set a fundraising goal. Your store is accessible at keevanstore.in/store/your-username.",
  },
  {
    question: "Is Keevan Store only for Ugandan creators?",
    answer:
      "Keevan Store is designed for creators in Uganda and accepts payments in Ugandan Shillings (UGX) via mobile money providers available in Uganda (MTN and Airtel). While anyone can browse and buy from a Keevan Store, the platform is optimized for the Ugandan creator economy and payment landscape.",
  },
];

export default function AboutPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Keevan Store",
    url: "https://keevanstore.in",
    description:
      "Keevan Store is a creator commerce platform for Ugandan creators to sell digital products, event tickets, and accept donations with mobile money payments.",
    foundingLocation: {
      "@type": "Place",
      name: "Uganda",
    },
    areaServed: {
      "@type": "Country",
      name: "Uganda",
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-lg font-bold text-foreground">Keevan Store</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                asChild
              >
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="py-16 sm:py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                  What is Keevan Store?
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Keevan Store is a creator commerce platform that lets creators in Uganda
                  sell digital products, event tickets, and accept donations with mobile money
                  payments. No coding required, no marketplace fees — just your own store at
                  your own link, ready to earn.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works — Creator Journey */}
          <section className="py-16 sm:py-24 bg-muted/30" id="how-it-works">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  How Keevan Store Works for Creators
                </h2>
                <p className="mt-3 text-muted-foreground text-lg">
                  From sign-up to your first sale in four simple steps
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {creatorSteps.map((item) => (
                  <Card key={item.step} className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                          {item.step}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 sm:py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Platform Features
                </h2>
                <p className="mt-3 text-muted-foreground text-lg">
                  Everything you need to run your creator business
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) => (
                  <Card key={feature.title} className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing / Fee Structure */}
          <section className="py-16 sm:py-24 bg-muted/30" id="pricing">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Simple, Transparent Pricing
                </h2>
                <p className="mt-3 text-muted-foreground text-lg">
                  No monthly fees. No hidden charges. You only pay when you sell.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <Card className="border-emerald-200 dark:border-emerald-900">
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                      Platform Fee
                    </p>
                    <p className="text-5xl font-bold text-emerald-600 mt-2">10%</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      per sale — you keep 90%
                    </p>
                    <div className="mt-6 space-y-3 text-left">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Free to create your store</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Unlimited products and events</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Secure file hosting included</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Mobile money withdrawals</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Real-time analytics dashboard</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>No monthly or subscription fees</span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      asChild
                    >
                      <Link href="/signup">
                        Create Your Free Store
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* FAQ Section with Schema */}
          <section className="py-16 sm:py-24" id="faq">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
                <p className="mt-3 text-muted-foreground text-lg">
                  Everything you need to know about Keevan Store
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="group border rounded-lg p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                      <span>{faq.question}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Buyer Journey */}
          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  How Buying Works
                </h2>
                <p className="mt-3 text-muted-foreground text-lg">
                  A simple, secure checkout for your customers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 items-center justify-center text-xl font-bold mb-4">
                      1
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">
                      Browse & Select
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      The buyer visits your store link, browses your products, and clicks "Buy Now" on the one they want.
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex h-14 w-14 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 items-center justify-center text-xl font-bold mb-4">
                      2
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">
                      Pay Securely
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      They enter their name, email, and choose a payment method — MTN Mobile Money, Airtel Money, bank transfer, or card. Payment is processed through Pesapal.
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 items-center justify-center text-xl font-bold mb-4">
                      3
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">
                      Get Your Product
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      After payment, digital products get a download link by email. Event tickets get a QR code by email for check-in at the event.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 sm:py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 md:p-16 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Ready to Start Selling?
                </h2>
                <p className="mt-4 text-emerald-100 text-lg max-w-2xl mx-auto">
                  Join Ugandan creators already earning with Keevan Store. Set up your
                  store in minutes — it is free to get started.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/signup">
                      Create Your Store
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/store/sarah-creates">See a Live Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
        <FloatingWhatsAppButton />
      </div>
    </>
  );
}
