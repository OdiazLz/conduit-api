import { prisma } from "../lib/prisma";
import type { Prisma } from "../generated/prisma/client";

function articleInclude(viewerId?: number) {
	return {
		author: true,
		tags: { include: { tag: true }, orderBy: { position: "asc" } },
		_count: { select: { favoritedBy: true } },
		favoritedBy: { where: { userId: viewerId ?? -1 }, select: { userId: true } },
	} satisfies Prisma.ArticleInclude;
}

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
	include: ReturnType<typeof articleInclude>;
}>;

function tagsCreate(tagList: string[]) {
	const unique = [...new Set(tagList)];
	return unique.map((name, position) => ({
		position,
		tag: { connectOrCreate: { where: { name }, create: { name } } },
	}));
}

export type ArticleFilters = {
	tag?: string;
	author?: string;
	favorited?: string;
};

export async function findArticleBySlug(slug: string, viewerId?: number) {
	return prisma.article.findUnique({ where: { slug }, include: articleInclude(viewerId) });
}

export async function createArticle(
	data: { slug: string; title: string; description: string; body: string; authorId: number },
	tagList: string[],
) {
	return prisma.article.create({
		data: { ...data, tags: { create: tagsCreate(tagList) } },
		include: articleInclude(data.authorId),
	});
}

export async function updateArticle(
	id: number,
	data: { title?: string; description?: string; body?: string },
	tagList: string[] | undefined,
	viewerId: number,
) {
	return prisma.article.update({
		where: { id },
		data: {
			...data,
			...(tagList !== undefined && {
				tags: { deleteMany: {}, create: tagsCreate(tagList) },
			}),
		},
		include: articleInclude(viewerId),
	});
}

export async function deleteArticle(id: number) {
	await prisma.article.delete({ where: { id } });
}

export async function listArticles(
	filters: ArticleFilters,
	limit: number,
	offset: number,
	viewerId?: number,
) {
	const where: Prisma.ArticleWhereInput = {
		...(filters.tag && { tags: { some: { tag: { name: filters.tag } } } }),
		...(filters.author && { author: { username: filters.author } }),
		...(filters.favorited && { favoritedBy: { some: { user: { username: filters.favorited } } } }),
	};

	const [articles, count] = await prisma.$transaction([
		prisma.article.findMany({
			where,
			include: articleInclude(viewerId),
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			take: limit,
			skip: offset,
		}),
		prisma.article.count({ where }),
	]);

	return { articles, count };
}

export async function addFavorite(userId: number, articleId: number) {
	await prisma.favorite.upsert({
		where: { userId_articleId: { userId, articleId } },
		create: { userId, articleId },
		update: {},
	});
}

export async function removeFavorite(userId: number, articleId: number) {
	await prisma.favorite.deleteMany({ where: { userId, articleId } });
}
