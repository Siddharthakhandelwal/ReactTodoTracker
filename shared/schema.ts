import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string()
});

export type User = z.infer<typeof userSchema>;

// Survey schema
export const surveySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  avatar: z.string().optional(),
  subjects: z.array(z.string()).min(1),
  interests: z.string().min(2),
  skills: z.string().min(2),
  goal: z.string().min(2),
  thinking_style: z.enum(["Plan", "Flow"]),
  extra_info: z.string().optional(),
});

export type Survey = z.infer<typeof surveySchema>;

// Learning Goal schema
export const goalSchema = z.object({
  id: z.string(),
  task: z.string().min(2),
  completed: z.boolean().default(false),
  userId: z.number()
});

export type Goal = z.infer<typeof goalSchema>;

// Goal creation schema
export const createGoalSchema = goalSchema.omit({ id: true });
export type CreateGoal = z.infer<typeof createGoalSchema>;

// Goal update schema
export const updateGoalSchema = goalSchema.pick({ completed: true });
export type UpdateGoal = z.infer<typeof updateGoalSchema>;

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  userId: z.number(),
  subjects: z.string(), // Stored as JSON string
  interests: z.string(),
  skills: z.string(),
  goal: z.string(),
  thinking_style: z.string(),
  extra_info: z.string().optional(),
  created_at: z.string()
});

export type UserProfile = z.infer<typeof userProfileSchema>;