import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    role: z.enum(["admin", "employee", "user"]).optional(),
  }),
});