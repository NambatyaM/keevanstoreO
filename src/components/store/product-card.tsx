// ============================================================
// Product Card — For public store & dashboard listings
// ============================================================
"use client";

import Link from "next/link";
import { Calendar, Download, ImageIcon, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import type { Product, ProductType } from "@/types";
import { format } from "date-fns";

interface ProductCardProps {
  product: Product;
  creatorUsername?: string;
  variant?: "public" | "dashboard";
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string, status: string) => void;
}

export function ProductCard({
  product,
  creatorUsername,
  variant = "public",
  onEdit,
  onToggleStatus,
}: ProductCardProps) {
  const isActive = product.status === "active";
  const isEvent = product.type === "event";
  const href = creatorUsername
    ? `/store/${creatorUsername}/${product.slug}`
    : "#";

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md",
        !isActive && variant === "dashboard" && "opacity-60"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            {isEvent ? (
              <Calendar className="h-12 w-12 text-emerald-300" />
            ) : (
              <ImageIcon className="h-12 w-12 text-emerald-300" />
            )}
          </div>
        )}

        {/* Type Badge */}
        <Badge
          variant={isEvent ? "default" : "secondary"}
          className={cn(
            "absolute top-2 left-2 text-xs",
            isEvent
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : ""
          )}
        >
          {isEvent ? (
            <Calendar className="h-3 w-3 mr-1" />
          ) : (
            <Download className="h-3 w-3 mr-1" />
          )}
          {PRODUCT_TYPE_LABELS[product.type] || product.type}
        </Badge>

        {/* Status Badge (dashboard only) */}
        {variant === "dashboard" && !isActive && (
          <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
            Inactive
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
          {product.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {product.description}
        </p>

        {isEvent && product.venue && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{product.venue}</span>
          </div>
        )}

        {isEvent && product.eventDate && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(product.eventDate), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        )}

        {isEvent && product.capacity && (
          <div className="mt-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{product.ticketsSold} / {product.capacity} tickets</span>
              <span>{product.capacity - product.ticketsSold} left</span>
            </div>
            <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (product.ticketsSold / product.capacity) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-3">
          <CurrencyDisplay amount={product.price} size="lg" />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {variant === "public" ? (
          <Link href={href} className="w-full">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {isEvent ? "Get Ticket" : "Buy Now"}
            </Button>
          </Link>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit?.(product.id)}
            >
              Edit
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              className="flex-1"
              onClick={() =>
                onToggleStatus?.(product.id, isActive ? "inactive" : "active")
              }
            >
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// Need cn import
import { cn } from "@/lib/utils";
