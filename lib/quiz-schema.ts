import { z } from "zod";

export const quizSchema = z.object({
  goal: z.enum(["lose", "keep", "gain"]),
  sex: z.enum(["female", "male"]),
  age: z.number().int().min(18, "You must be 18 or over for a calorie-reduced plan").max(90),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  goalWeightKg: z.number().min(35).max(250).optional(),
  activity: z.enum(["light", "moderate", "active"]),
  exclusions: z.array(z.string().max(40)).max(12),
  pepper: z.number().int().min(1).max(5),
  dailyKcal: z.number().int().min(1200).max(3500),
  phone: z.string().max(20).optional(),
});
export type QuizData = z.infer<typeof quizSchema>;
