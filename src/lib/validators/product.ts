import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .positive("Price must be positive"),
  category_id: z.string().uuid("Invalid category"),
  status: z.enum(["active", "draft", "out_of_stock"]).default("draft"),
  images: z.array(z.string().url()).max(2, "Maximum 2 images").default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
