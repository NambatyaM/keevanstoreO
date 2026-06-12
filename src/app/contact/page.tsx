// ============================================================
// Contact Us Page — Trust & Legitimacy Page
// Contact form, email addresses, and business location
// ============================================================
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  Shield,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/shared/site-footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    // Clear error when user starts typing again
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description:
        "For general questions, account issues, or partnership inquiries, send us an email and we will respond within 24-48 hours.",
      value: "support@keevanstore.in",
      href: "mailto:support@keevanstore.in",
    },
    {
      icon: Shield,
      title: "Privacy & Legal",
      description:
        "For privacy concerns, data deletion requests, or legal matters, contact our privacy team directly.",
      value: "privacy@keevanstore.in",
      href: "mailto:privacy@keevanstore.in",
    },
    {
      icon: MapPin,
      title: "Business Location",
      description:
        "Keevan Store is based in Kampala, Uganda. We serve creators and buyers across the entire country through our online platform.",
      value: "Kampala, Uganda",
      href: null,
    },
  ];

  const responseTimes = [
    {
      icon: MessageSquare,
      title: "General Inquiries",
      time: "24-48 hours",
    },
    {
      icon: Shield,
      title: "Privacy & Legal",
      time: "5 business days",
    },
    {
      icon: Smartphone,
      title: "Payment Issues",
      time: "24 hours",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <nav
          className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between"
          aria-label="Main navigation"
        >
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              Get in Touch
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Contact Us
            </h1>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              Have a question, need help, or want to report an issue? We are here for you.
              Reach out and our team will get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method) => (
                <Card key={method.title} className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mb-4">
                      <method.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {method.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {method.description}
                    </p>
                    {method.href ? (
                      <a
                        href={method.href}
                        className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        {method.value}
                      </a>
                    ) : (
                      <p className="mt-3 text-sm font-medium text-foreground">
                        {method.value}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form + Response Times */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Send Us a Message
                </h2>
                <p className="text-muted-foreground mb-6">
                  Fill out the form below and our team will get back to you. All fields marked
                  with an asterisk (*) are required.
                </p>

                {submitted ? (
                  <Card className="border-emerald-200 dark:border-emerald-900">
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground">
                        Message Sent Successfully
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        Thank you for reaching out. We have received your message and will
                        respond within 24-48 hours. Check your email for a confirmation.
                      </p>
                      <Button
                        className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          setSubmitted(false);
                          setSubmitError("");
                          setFormData({ name: "", email: "", subject: "", message: "" });
                        }}
                      >
                        Send Another Message
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this about?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you..."
                        rows={6}
                        required
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-400">
                        {submitError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <Send className="h-4 w-4 mr-2 animate-pulse" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              {/* Response Times Sidebar */}
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-4">
                  Expected Response Times
                </h3>
                <div className="space-y-4">
                  {responseTimes.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 p-4 rounded-lg bg-background border"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <h4 className="font-medium text-emerald-700 dark:text-emerald-400 text-sm">
                    Payment Issues?
                  </h4>
                  <p className="mt-1 text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    If you have a problem with a payment, include your transaction reference
                    and email address in the message for faster resolution.
                  </p>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-background border">
                  <h4 className="font-medium text-foreground text-sm">
                    Creator Support
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If you are a creator with a store on Keevan Store, include your username
                    in the message so we can look up your account quickly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
              Common Questions
            </h2>
            <p className="text-muted-foreground mb-8 text-center">
              Quick answers to questions you might have before contacting us
            </p>

            <div className="space-y-3">
              <details className="group border rounded-lg p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                  <span>How do I reset my account password?</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  If you have forgotten your password, use the &quot;Forgot Password&quot; link on the login
                  page. We will send a password reset link to the email address associated with
                  your account. If you no longer have access to that email, contact us at
                  support@keevanstore.in and we will help you recover your account.
                </p>
              </details>

              <details className="group border rounded-lg p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                  <span>I did not receive my download link after purchase. What do I do?</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  First, check your spam or junk folder. Download links are sent to the email
                  address you provided during checkout and are valid for 24 hours. If you still
                  cannot find it, contact us at support@keevanstore.in with your name, email
                  address, and the product you purchased. We will resend the download link.
                </p>
              </details>

              <details className="group border rounded-lg p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                  <span>When will I receive my withdrawal?</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Withdrawals are processed within 3-5 business days. Once processed, the
                  funds will be sent to the mobile money number you specified. If you have
                  not received your withdrawal after 5 business days, contact us and include
                  your username and the withdrawal amount.
                </p>
              </details>

              <details className="group border rounded-lg p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                  <span>How do I request a refund?</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Refund requests must be submitted within 7 days of purchase by emailing
                  support@keevanstore.in. Include your name, email, the product name, and the
                  reason for the refund. Refunds are evaluated on a case-by-case basis.
                  See our <Link href="/terms" className="text-emerald-600 hover:underline">Terms and Conditions</Link> for
                  the full refund policy.
                </p>
              </details>

              <details className="group border rounded-lg p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                  <span>I want to delete my account. How do I do that?</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  To delete your account, contact us at support@keevanstore.in or
                  privacy@keevanstore.in with your username and email address. We will
                  process your request within 30 days. Any pending earnings above the minimum
                  withdrawal threshold (UGX 50,000) will be paid out before deletion.
                  See our <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link> for
                  more details.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
