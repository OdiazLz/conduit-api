import { z } from "zod";
import { optionalText, requiredText } from "./common";

const tagList = z.array(z.string().min(1, "can't be blank"));

export const createArticleSchema = z.object({
	title: requiredText(),
	description: requiredText(),
	body: requiredText(),
	tagList: tagList.optional(),
});

export const updateArticleSchema = z.object({
	title: optionalText(),
	description: optionalText(),
	body: optionalText(),
	tagList: tagList.optional(),
});

const pagination = {
	limit: z.coerce.number().int().min(0).default(20),
	offset: z.coerce.number().int().min(0).default(0),
};

export const listArticlesQuerySchema = z.object({
	tag: z.string().optional(),
	author: z.string().optional(),
	favorited: z.string().optional(),
	...pagination,
});

export const feedQuerySchema = z.object(pagination);

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
