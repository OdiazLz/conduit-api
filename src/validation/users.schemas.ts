import { z } from "zod";

const requiredText = () =>
	z
		.string({
			error: "can't be blank",
		})
		.min(1, "can't be blank");

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

export function formatZodErrors(error: z.ZodError) {
	const errors: Record<string, string[]> = {};

	for (const issue of error.issues) {
		const field = issue.path.join(".");
		if (field) (errors[field] ??= []).push(issue.message);
	}

	return { errors };
}
