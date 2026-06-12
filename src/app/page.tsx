// ============================================================
// Landing Page — Keevan Store Home
// ============================================================
"use client";

import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Download,
    title: "Digital Products",
    description:
      "Sell e-books, templates, presets, beats, and any digital file. Automatic delivery after purchase.",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Calendar,
    title: "Event Tickets",
    description:
      "Create and sell tickets for events, workshops, and experiences. Built-in check-in system.",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: Heart,
    title: "Donations",
    description:
      "Accept donations from your supporters with optional fundraising goals. Build your community.",
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track sales, views, and revenue in real-time. Understand your audience and grow your business.",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
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
    title: "Create Your Store",
    description: "Sign up in under 2 minutes. No coding required.",
  },
  {
    step: "2",
    title: "Add Your Products",
    description: "Upload digital files or create event tickets. Set your prices.",
  },
  {
    step: "3",
    title: "Share & Earn",
    description: "Share your store link and start earning. We handle payments & delivery.",
  },
];

export default function LandingPage() {
  return (
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
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
              Create Your Online Store{" "}
              <span className="text-emerald-600">in Minutes</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sell digital products, event tickets, and accept donations. No coding
              needed. Mobile money payments built in. Start earning today.
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
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need to Sell Online
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              From digital downloads to event tickets — all in one platform
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
                <Card className="h-full hover:shadow-lg transition-shadow">
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Start Earning in 3 Steps
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              No technical skills needed — just create and sell
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
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why Creators Love Keevan Store
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Smartphone className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Mobile First</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Designed for mobile users. Your customers can buy from any device.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Secure Payments</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mobile money, bank transfer, and card payments via Pesapal.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Store className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">Your Brand</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Custom store URL, banner, and branding. Make it yours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 md:p-16 text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Start Selling?
            </h2>
            <p className="mt-4 text-emerald-100 text-lg max-w-2xl mx-auto">
              Join hundreds of Ugandan creators already earning with Keevan Store.
              Set up your store in minutes — it&apos;s free to get started.
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
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                Keevan Store
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Keevan Store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
