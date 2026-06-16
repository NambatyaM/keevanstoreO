// ============================================================
// Add Product Page
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Eye,
  Download,
  Calendar,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/shared/file-upload";
import { CurrencyDisplay, formatCurrency } from "@/components/shared/currency-display";
import { useAuth } from "@/hooks/use-auth";
import { MIN_PRODUCT_PRICE, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ProductType } from "@/types";

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState<ProductType>(ProductType.DIGITAL);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
        setFileSize(data.data.fileSize);
        return data.data.url;
      }
      toast.error(data.error || "Upload failed. Please try again.");
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

    if (productType === "digital" && !fileUrl) {
      toast.error("Please upload a file for your digital product");
      return;
    }

    if (productType === "event") {
      if (!venue.trim()) {
        toast.error("Venue is required for events");
        return;
      }
      if (!eventDate) {
        toast.error("Event date is required");
        return;
      }
      if (!capacity || parseInt(capacity) < 1) {
        toast.error("Capacity must be at least 1");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: user?.id,
          title,
          description,
          price: parseInt(price),
          currency: "UGX",
          type: productType,
          thumbnailUrl,
          fileUrl,
          fileName,
          fileSize,
          venue: productType === "event" ? venue : undefined,
          eventDate: productType === "event" ? eventDate : undefined,
          capacity: productType === "event" ? parseInt(capacity) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Product created successfully! 🎉");
        router.push("/products");
      } else {
        toast.error(data.error || "Failed to create product");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Add New Product</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new digital product or event ticket
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Type Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={productType}
              onValueChange={(val) => setProductType(val as ProductType)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="digital" className="gap-2">
                  <Download className="h-4 w-4" />
                  Digital Product
                </TabsTrigger>
                <TabsTrigger value="event" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Ticket
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Basic Info */}
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
                placeholder="e.g. Afrobeat Sample Pack Vol.1"
                required
              />
              {slug && (
                <p className="text-xs text-muted-foreground">
                  Slug: {slug}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
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
                placeholder="e.g. 25000"
                required
              />
              {price && parseInt(price) >= MIN_PRODUCT_PRICE && (
                <p className="text-xs text-muted-foreground">
                  You earn: {formatCurrency(Math.round(parseInt(price) * 0.9))} after {10}% platform fee
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thumbnail</CardTitle>
            <CardDescription>
              An attractive thumbnail helps sell your product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={handleThumbnailUpload}
              currentUrl={thumbnailUrl}
              type="image"
              accept="image/*"
              label="Product Thumbnail"
              description="Recommended: 800x600px, JPG or PNG"
            />
          </CardContent>
        </Card>

        {/* File Upload (Digital) or Event Details */}
        {productType === "digital" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product File</CardTitle>
              <CardDescription>
                Upload the file customers will receive after purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onUpload={handleFileUpload}
                currentUrl={fileName}
                type="file"
                accept="*/*"
                label="Digital File"
                description="Any file type, max 100MB"
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
                  placeholder="e.g. National Theatre, Kampala"
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
                <Label htmlFor="capacity">Capacity (Number of Tickets)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 200"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Toggle */}
        <div className="flex items-center gap-2">
          <Switch checked={showPreview} onCheckedChange={setShowPreview} />
          <Label className="text-sm">Show preview</Label>
        </div>

        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg flex items-center justify-center">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-emerald-300" />
                  )}
                </div>
                <h3 className="font-semibold">{title || "Product Title"}</h3>
                <p className="text-sm text-muted-foreground">{description || "Product description..."}</p>
                <CurrencyDisplay amount={parseInt(price) || 0} size="lg" />
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
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
