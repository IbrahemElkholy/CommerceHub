import { z } from 'zod';

export const placeOrderSchema = z.object({
  shippingAddressId: z.string().min(1, 'Please select a shipping address'),
  couponCode: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Please provide a reason for cancellation'),
});

export type PlaceOrderFormValues = z.infer<typeof placeOrderSchema>;
export type CancelOrderFormValues = z.infer<typeof cancelOrderSchema>;
