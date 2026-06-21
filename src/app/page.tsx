// ============================================================
// Landing Page — Keevan Store Home
// Enhanced with FAQ section, GEO statements, and structured data
// ============================================================
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Download,
  Calendar,
  Heart,
  BarChart3,
  Store,
  Shield,
  Smartphone,
  Zap,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/shared/site-footer";
import { FloatingWhatsAppButton, WhatsAppSupportCard } from "@/components/shared/whatsapp-support";
import { MessageCircle } from "lucide-react";
import { sanitizeForJsonLd } from "@/lib/utils";

const features = [
  {
    icon: Download,
    title: "Sell Digital Products Uganda",
    description:
      "Sell e-books, templates, presets, beats, and any digital file. Automatic delivery after purchase. Best platform for selling digital downloads in Uganda.",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    link: "/signup",
  },
  {
    icon: Calendar,
    title: "Event Ticketing Uganda",
    description:
      "Create and sell tickets for events, workshops, and experiences. Built-in QR code check-in system. Easy event management for Ugandan creators.",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    link: "/signup",
  },
  {
    icon: Heart,
    title: "Donation Platform Uganda",
    description:
      "Accept donations from your supporters with fundraising goals. Build your community with direct fan support. Simple setup for Ugandan content creators.",
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
    link: "/signup",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics Dashboard",
    description:
      "Track sales, views, and revenue in real-time. See which products perform best. Make data-driven decisions for your Uganda online store.",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    link: "/signup",
  },
];

const stats = [
  { value: "500+", label: "Creators" },
  { value: "10K+", label: "Products Sold" },
  { value: "50M+", label: "UGX Earned" },
  { value: "99.9%", label: "Uptime" },
];

const howItWorks = [
  {
    step: "1",
    title: "Create Your Uganda Online Store",
    description: "Sign up in under 2 minutes. No coding required. Get your own unique store link at keevanstore.in instantly.",
  },
  {
    step: "2",
    title: "Add Your Digital Products",
    description: "Upload digital files or create event tickets. Set your own prices starting from UGX 1,000. Sell to customers across Uganda.",
  },
  {
    step: "3",
    title: "Share & Earn with Mobile Money",
    description: "Share your store link anywhere. We handle MTN MoMo and Airtel Money payments, delivery, and security. You keep 90% of every sale.",
  },
];

const faqs = [
  {
    question: "What is Keevan Store - Uganda's Best Online Store Platform?",
    answer:
      "Keevan Store is the #1 creator commerce platform built for Ugandan creators. It lets you set up an online store to sell digital products (e-books, templates, presets, beats), event tickets (workshops, concerts, meetups), and accept donations from supporters. Payments are processed via mobile money (MTN MoMo, Airtel Money), bank transfer, or card through Pesapal. Perfect for content creators in Kampala and across Uganda.",
  },
  {
    question: "How much does it cost to sell digital products in Uganda?",
    answer:
      "It is free to create a store and list products. Keevan Store charges a 10% platform fee on each sale, meaning you keep 90% of every transaction. There are no monthly subscriptions or hidden charges. Best value for Ugandan creators selling online.",
  },
  {
    question: "What payment methods work in Uganda for online sales?",
    answer:
      "Your customers can pay using MTN Mobile Money, Airtel Money, bank transfer, or Visa/Mastercard cards. All payments are processed securely through Pesapal, a licensed payment gateway in Uganda. Mobile money payments make it easy for customers across Uganda to buy from your store.",
  },
  {
    question: "How do I withdraw earnings to MTN Mobile Money or Airtel Money?",
    answer:
      "When your balance reaches at least UGX 50,000, you can request a withdrawal to your mobile money account (MTN Mobile Money or Airtel Money). Withdrawals are processed by the platform admin. Fast and secure withdrawals for Ugandan creators.",
  },
  {
    question: "How are digital products delivered to buyers in Uganda?",
    answer:
      "After a successful payment, the buyer receives a download link via email. The link is valid for 24 hours and uses a secure, signed URL. The buyer can download the file directly without needing to create an account. Automatic delivery for all digital products sold in Uganda.",
  },
  {
    question: "How do event tickets work for Uganda events?",
    answer:
      "When a buyer purchases an event ticket, they receive a confirmation email with a unique QR code. At the event, you use the built-in check-in page to scan or search for the attendee by name or email. Perfect for workshops, concerts, and meetups across Uganda.",
  },
];

export default function LandingPage() {
  // FAQ structured data for AEO
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

  // Breadcrumb structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.keevanstore.in",
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeForJsonLd(JSON.stringify(faqSchema)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeForJsonLd(JSON.stringify(breadcrumbSchema)) }}
      />

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
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-label="Hero">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/50 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Zap className="h-3.5 w-3.5" />
              Built for Ugandan Creators
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              Best Online Store Platform for{" "}
              <span className="text-emerald-600">Ugandan Creators</span>
            </h1>
            {/* GEO: Clear, factual, self-contained description with keywords */}
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sell digital products, event tickets, and accept donations with MTN Mobile Money and Airtel Money payments.
              The #1 e-commerce platform in Uganda for creators. Free to start. Keep 90% of sales.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                asChild
              >
                <Link href="/signup">
                  Start Selling — It&apos;s Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href="/store/sarah-creates">
                  View Demo Store
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-label="Features">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Complete E-commerce Platform for Uganda
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Sell digital downloads, event tickets, and accept donations. The best online store solution for Ugandan creators with MTN MoMo and Airtel Money payments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={feature.link}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div
                        className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                      >
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
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24" aria-label="How it works">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How to Start Selling Online in Uganda
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              No technical skills needed — just create your store, add products, and start earning with mobile money payments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex h-14 w-14 rounded-full bg-emerald-600 text-white items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-label="Why creators love Keevan Store">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why Ugandan Creators Choose Keevan Store
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Smartphone className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Mobile Money Payments</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  MTN MoMo and Airtel Money payments. Your customers can buy from any device using mobile money across Uganda.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Secure Payment Gateway</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mobile money, bank transfer, and card payments processed securely via Pesapal. Licensed and regulated in Uganda.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Store className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Your Own Brand</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Custom store URL at keevanstore.in/store/your-name. Your own banner, profile, and branding. No marketplace fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section — AEO optimized */}
      <section className="py-16 sm:py-24" aria-label="Frequently asked questions">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Frequently Asked Questions About Selling Online in Uganda
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Everything you need to know about Keevan Store, digital products, event tickets, and mobile money payments in Uganda
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
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

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/about">
                Learn More About Keevan Store
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Support Section */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-label="Support">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-lg mx-auto">
            <WhatsAppSupportCard
              title="Need Help?"
              description="Contact Keevan Store Support"
              buttons={[
                { label: "Contact Support", variant: "general" },
                { label: "Report a Bug", variant: "bug" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-label="Get started">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 md:p-16 text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Start Your Uganda Online Store Today
            </h2>
            <p className="mt-4 text-emerald-100 text-lg max-w-2xl mx-auto">
              Join hundreds of Ugandan creators already earning with Keevan Store.
              Set up your store in minutes — it is free to get started. Accept MTN MoMo and Airtel Money payments. You keep 90% of every sale.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                asChild
              >
                <Link href="/signup">
                  Create Your Free Store
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                asChild
              >
                <Link href="/store/sarah-creates">See a Live Uganda Store</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
      <FloatingWhatsAppButton />
    </div>
  );
}
