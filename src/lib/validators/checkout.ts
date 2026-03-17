import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/, "Invalid phone number"),
  shippingAddress: z.string().min(5, "Address is required"),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
