// ============================================================
// Store Hero — Creator banner + profile for public store
// ============================================================
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Share2, Instagram, Music, Twitter, MessageCircle } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import type { Creator } from "@/types";

interface StoreHeroProps {
  creator: Creator;
}

export function StoreHero({ creator }: StoreHeroProps) {
  const initials = creator.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const storeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/store/${creator.username}`
    : `/store/${creator.username}`;

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 sm:h-48 md:h-56 w-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600">
        {creator.bannerUrl && (
          <img
            src={creator.bannerUrl}
            alt={`${creator.displayName} banner`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        {/* Overlay pattern */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-14">
          {/* Avatar */}
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 pb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {creator.displayName}
            </h1>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pb-2">
            <CopyButton text={storeUrl} label="Share" size="sm" />
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            {creator.bio}
          </p>
        )}

        {/* Social Links */}
        {creator.socialLinks && creator.socialLinks.length > 0 && (
          <div className="flex items-center gap-3 mt-3">
            {creator.socialLinks.map((link, i) => {
              // Only allow http/https URLs to prevent javascript: scheme XSS
              const safeUrl = /^https?:\/\//i.test(link.url) ? link.url : "#";
              return (
                <a
                  key={i}
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-emerald-600 transition-colors"
                  aria-label={link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    case "tiktok":
      return <Music className="h-4 w-4" />;
    case "twitter":
      return <Twitter className="h-4 w-4" />;
    case "whatsapp":
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Share2 className="h-4 w-4" />;
  }
}
