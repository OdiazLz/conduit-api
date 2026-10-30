import { randomBytes } from "node:crypto";

// "¡Hola Mundo!" -> "hola-mundo"
export function slugify(text: string) {
	return text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Titles can repeat, so every slug gets a short random suffix to stay unique.
export function createSlug(title: string) {
	const base = slugify(title) || "article";
	const suffix = randomBytes(4).toString("hex");
	return `${base}-${suffix}`;
}
