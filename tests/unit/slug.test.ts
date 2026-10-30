import { describe, expect, it } from "vitest";
import { createSlug, slugify } from "../../src/lib/slug";

describe("slugify", () => {
	it("lowercases and joins words with dashes", () => {
		expect(slugify("How to Train Your Dragon")).toBe("how-to-train-your-dragon");
	});

	it("removes accents and symbols", () => {
		expect(slugify("¡Canción número 1!")).toBe("cancion-numero-1");
	});
});

describe("createSlug", () => {
	it("gives different slugs to the same title", () => {
		expect(createSlug("Same title")).not.toBe(createSlug("Same title"));
	});

	it("falls back to 'article' when the title has no letters or numbers", () => {
		expect(createSlug("!!!")).toMatch(/^article-[a-f0-9]{8}$/);
	});
});
