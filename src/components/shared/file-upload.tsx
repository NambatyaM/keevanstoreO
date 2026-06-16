// ============================================================
// File Upload Component — Drag & drop + click upload
// ============================================================
"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<string | null>;
  accept?: string;
  maxSize?: number; // in bytes
  currentUrl?: string | null;
  label?: string;
  description?: string;
  type?: "image" | "file";
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  currentUrl,
  label = "Upload File",
  description,
  type = "image",
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > maxSize) {
        setError(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        return;
      }

      // Show preview for images
      if (type === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      try {
        const url = await onUpload(file);
        clearInterval(interval);
        if (!url) {
          // onUpload returned null — treat as failure
          setUploadProgress(0);
          setError("Upload failed. Please try again.");
          if (type === "image") setPreview(null);
        } else {
          setUploadProgress(100);
          setPreview(url);
        }
      } catch {
        clearInterval(interval);
        setError("Upload failed. Please try again.");
        if (type === "image") setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [maxSize, onUpload, type]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {preview ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          {type === "image" ? (
            <div className="aspect-video bg-muted flex items-center justify-center">
              {preview.startsWith("data:") || preview.startsWith("/") || preview.startsWith("http") ? (
                <img
                  src={preview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          ) : (
            <div className="p-4 flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-foreground truncate">{preview}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
            isDragging
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-border hover:border-emerald-400 hover:bg-muted/50"
          )}
        >
          <Upload
            className={cn(
              "h-8 w-8",
              isDragging ? "text-emerald-500" : "text-muted-foreground"
            )}
          />
          <p className="text-sm text-muted-foreground text-center">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground">
            Max {Math.round(maxSize / 1024 / 1024)}MB
          </p>

          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg gap-2">
              <Progress value={uploadProgress} className="w-3/4" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
