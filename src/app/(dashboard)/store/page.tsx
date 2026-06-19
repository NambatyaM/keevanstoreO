// ============================================================
// Store Settings Page — Edit store profile
// ============================================================
"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Save, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { CopyButton } from "@/components/shared/copy-button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import Link from "next/link";
import type { SocialLink } from "@/types";

export default function StoreSettingsPage() {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(user?.bannerUrl || null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(user?.socialLinks || []);
  const [donationsEnabled, setDonationsEnabled] = useState(user?.donationsEnabled || false);
  const [donationGoal, setDonationGoal] = useState(
    user?.donationGoal?.toString() || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const storeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/store/${user?.username || ""}`
    : `/store/${user?.username || ""}`;

  const handlePhotoUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "profiles");

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setPhotoUrl(data.data.url);
        return data.data.url;
      }
      toast.error(data.error || "Photo upload failed. Please try again.");
      return null;
    } catch {
      toast.error("Upload service unavailable. Please try again.");
      return null;
    }
  };

  const handleBannerUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "banners");

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setBannerUrl(data.data.url);
        return data.data.url;
      }
      toast.error(data.error || "Banner upload failed. Please try again.");
      return null;
    } catch {
      toast.error("Upload service unavailable. Please try again.");
      return null;
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "instagram", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: user?.id,
          displayName,
          bio,
          photoUrl,
          bannerUrl,
          socialLinks,
          donationsEnabled,
          donationGoal: donationGoal ? parseInt(donationGoal) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        updateUser(data.data);
        toast.success("Store settings saved!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Store Link */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Your Store URL</p>
            <p className="text-xs text-muted-foreground truncate">{storeUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={storeUrl} label="Copy" size="sm" />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/store/${user?.username}`} target="_blank">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Your public store profile that customers see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your customers about yourself..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          <FileUpload
            onUpload={handlePhotoUpload}
            currentUrl={photoUrl}
            label="Profile Photo"
            description="Square image, at least 200x200px"
            type="image"
            accept="image/*"
          />

          <FileUpload
            onUpload={handleBannerUpload}
            currentUrl={bannerUrl}
            label="Banner Image"
            description="Wide image, at least 1200x400px"
            type="image"
            accept="image/*"
          />
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Links</CardTitle>
          <CardDescription>
            Add your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={link.platform}
                onValueChange={(val) =>
                  updateSocialLink(index, "platform", val)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={link.url}
                onChange={(e) =>
                  updateSocialLink(index, "url", e.target.value)
                }
                placeholder="https://..."
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSocialLink(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addSocialLink}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Social Link
          </Button>
        </CardContent>
      </Card>

      {/* Donations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Donations</CardTitle>
          <CardDescription>
            Allow supporters to send you donations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Donations</Label>
              <p className="text-xs text-muted-foreground">
                Show donation widget on your store
              </p>
            </div>
            <Switch
              checked={donationsEnabled}
              onCheckedChange={setDonationsEnabled}
            />
          </div>

          {donationsEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="donationGoal">Fundraising Goal (UGX)</Label>
                <Input
                  id="donationGoal"
                  type="number"
                  min="0"
                  value={donationGoal}
                  onChange={(e) => setDonationGoal(e.target.value)}
                  placeholder="e.g. 5000000"
                />
                {donationGoal && (
                  <p className="text-xs text-muted-foreground">
                    Goal: <CurrencyDisplay amount={parseInt(donationGoal) || 0} size="sm" />
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
