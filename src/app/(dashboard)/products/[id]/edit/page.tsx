// ============================================================
// Edit Product Page
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  Save,
  Calendar,
  Download,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/shared/file-upload";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { MIN_PRODUCT_PRICE } from "@/lib/constants";
import { toast } from "sonner";
import type { Product } from "@/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data as Product;
          setProduct(p);
          setTitle(p.title);
          setDescription(p.description);
          setPrice(p.price.toString());
          setThumbnailUrl(p.thumbnailUrl);
          setFileUrl(p.fileUrl);
          setFileName(p.fileName);
          setVenue(p.venue || "");
          setEventDate(p.eventDate ? p.eventDate.slice(0, 16) : "");
          setCapacity(p.capacity?.toString() || "");
        } else {
          toast.error("Product not found");
          router.push("/products");
        }
      } catch {
        toast.error("Failed to load product");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId, router]);

  const handleThumbnailUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "thumbnails");

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setThumbnailUrl(data.data.url);
        return data.data.url;
      }
      toast.error(data.error || "Thumbnail upload failed. Please try again.");
      return null;
    } catch {
      toast.error("Upload service unavailable. Please try again.");
      return null;
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setFileUrl(data.data.url);
        setFileName(data.data.fileName);
        return data.data.url;
      }
      toast.error(data.error || "File upload failed. Please try again.");
      return null;
    } catch {
      toast.error("Upload service unavailable. Please try again.");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!price || parseInt(price) < MIN_PRODUCT_PRICE) {
      toast.error(`Minimum price is ${formatCurrency(MIN_PRODUCT_PRICE)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseInt(price),
          thumbnailUrl,
          fileUrl,
          fileName,
          venue: product?.type === "event" ? venue : undefined,
          eventDate: product?.type === "event" ? eventDate : undefined,
          capacity: product?.type === "event" ? parseInt(capacity) || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Product updated successfully!");
        router.push("/products");
      } else {
        toast.error(data.error || "Failed to update product");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Edit Product</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={product.type === "event" ? "default" : "secondary"}>
              {product.type === "event" ? (
                <Calendar className="h-3 w-3 mr-1" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              {product.type === "event" ? "Event Ticket" : "Digital Product"}
            </Badge>
            <Badge variant={product.status === "active" ? "default" : "destructive"}>
              {product.status}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (UGX)</Label>
              <Input
                id="price"
                type="number"
                min={MIN_PRODUCT_PRICE}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              {price && parseInt(price) >= MIN_PRODUCT_PRICE && (
                <p className="text-xs text-muted-foreground">
                  You earn: {formatCurrency(Math.round(parseInt(price) * 0.9))} after 10% platform fee
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thumbnail</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={handleThumbnailUpload}
              currentUrl={thumbnailUrl}
              type="image"
              accept="image/*"
            />
          </CardContent>
        </Card>

        {/* File (Digital) or Event Details */}
        {product.type === "digital" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product File</CardTitle>
              {fileName && (
                <CardDescription>Current file: {fileName}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <FileUpload
                onUpload={handleFileUpload}
                currentUrl={fileName}
                type="file"
                accept="*/*"
                label="Replace File"
                description="Upload a new file to replace the current one"
                maxSize={100 * 1024 * 1024}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date & Time</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32"
          >
            {isSubmitting ? (
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
      </form>
    </div>
  );
}
