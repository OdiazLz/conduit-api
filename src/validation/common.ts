import { z } from "zod";
import { ValidationError } from "../errors";

export const requiredText = () =>
	z
		.string({
			error: "can't be blank",
		})
		.min(1, "can't be blank");

export const optionalText = () => z.string().min(1, "can't be blank").optional();

export function formatZodErrors(error: z.ZodError) {
	const errors: Record<string, string[]> = {};

	for (const issue of error.issues) {
		const field = issue.path.join(".");
		if (field) (errors[field] ??= []).push(issue.message);
	}

	return { errors };
}

export function parseBody<T extends z.ZodType>(schema: T, body: unknown, key: string): z.infer<T> {
	const value = (body as Record<string, unknown> | undefined)?.[key] ?? {};
	return parseOrThrow(schema, value);
}

export function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw new ValidationError(formatZodErrors(result.error).errors);
	}
	return result.data;
}
