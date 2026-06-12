// ============================================================
// Donation Widget — For public store pages
// ============================================================
"use client";

import { useState } from "react";
import { Heart, Send, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { toast } from "sonner";
import type { Creator } from "@/types";

interface DonationWidgetProps {
  creator: Creator;
}

export function DonationWidget({ creator }: DonationWidgetProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const presetAmounts = [5000, 10000, 25000, 50000, 100000];
  const goalProgress = creator.donationGoal
    ? Math.min(100, (creator.donationCurrent / creator.donationGoal) * 100)
    : 0;

  const handleDonate = async () => {
    const donationAmount = parseInt(amount);
    if (!donationAmount || donationAmount < 1000) {
      toast.error("Minimum donation is UGX 1,000");
      return;
    }

    if (!donorEmail && !anonymous) {
      toast.error("Please provide your email or donate anonymously");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          amount: donationAmount,
          message,
          anonymous,
          donorName: anonymous ? "Anonymous" : donorName,
          donorEmail: anonymous ? "" : donorEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Thank you for your donation! 🎉");
        setAmount("");
        setMessage("");
        setDonorName("");
        setDonorEmail("");
        setAnonymous(false);
        setShowForm(false);
      } else {
        toast.error(data.error || "Donation failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-rose-500" />
          Support {creator.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Progress */}
        {creator.donationGoal && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(creator.donationCurrent)} raised
              </span>
              <span className="text-muted-foreground">
                Goal: {formatCurrency(creator.donationGoal)}
              </span>
            </div>
            <Progress value={goalProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {goalProgress.toFixed(0)}% of goal reached
            </p>
          </div>
        )}

        {!showForm ? (
          <Button
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            onClick={() => setShowForm(true)}
          >
            <Heart className="h-4 w-4 mr-2" />
            Make a Donation
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Preset Amounts */}
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === String(preset) ? "default" : "outline"}
                  size="sm"
                  className={
                    amount === String(preset)
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }
                  onClick={() => setAmount(String(preset))}
                >
                  {formatCurrency(preset)}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="amount" className="text-xs">
                Custom Amount (UGX)
              </Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Donor Info */}
            {!anonymous && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="donorName" className="text-xs">
                    Your Name
                  </Label>
                  <Input
                    id="donorName"
                    placeholder="Your name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="donorEmail" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="donorEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-xs">
                Message (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Leave a message of support..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous" className="text-xs text-muted-foreground">
                Donate anonymously
              </Label>
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleDonate}
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Donate {amount ? formatCurrency(parseInt(amount)) : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
