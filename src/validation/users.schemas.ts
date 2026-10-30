import { z } from "zod";
import { requiredText } from "./common";

export const registerSchema = z.object({
	username: requiredText(),
	email: requiredText().email("Invalid email"),
	password: requiredText(),
});

export const loginSchema = z.object({
	email: requiredText().email("Invalid email"),
	password: requiredText(),
});

const nullableText = z.preprocess(
	(value) => (value === "" ? null : value),
	z.string().nullable().optional(),
);

export const updateUserSchema = z.object({
	username: z.string().min(1, "can't be blank").optional(),
	email: z.string().min(1, "can't be blank").email("Invalid email").optional(),
	password: z.string().min(8, "String must contain at least 8 character(s)").optional(),
	bio: nullableText,
	image: nullableText,
});
