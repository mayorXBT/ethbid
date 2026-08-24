import { z } from "zod";

export const createBidBody = z.object({
  target: z.string().trim().min(1).max(2048),
  category: z.string().trim().min(1).max(40),
  amount: z.union([z.number().finite(), z.string().trim().min(1).max(32)]),
});
