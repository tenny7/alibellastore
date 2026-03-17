"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { MAX_IMAGES_PER_PRODUCT, MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (images.length >= MAX_IMAGES_PER_PRODUCT) {
        toast.error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images allowed`);
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        onChange([...images, data.url]);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = "";
      }
    },
    [images, onChange]
  );

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Product Images
      </label>
      <div className="flex gap-3">
        {images.map((url, index) => (
          <div
            key={url}
            className="relative w-24 h-24 border border-[#E2E8F0] rounded-lg overflow-hidden"
          >
            <Image src={url} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES_PER_PRODUCT && (
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Upload</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Up to {MAX_IMAGES_PER_PRODUCT} images. JPEG, PNG, WebP. Max{" "}
        {MAX_IMAGE_SIZE_MB}MB each.
      </p>
    </div>
  );
}
