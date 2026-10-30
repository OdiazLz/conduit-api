import { ForbiddenError, NotFoundError } from "../errors";
import { createSlug } from "../lib/slug";
import * as repo from "../repositories/articles.repository";
import type { ArticleWithRelations } from "../repositories/articles.repository";
import type { CreateArticleInput, ListArticlesQuery, UpdateArticleInput } from "../validation/articles.schemas";

function toArticleResponse(article: ArticleWithRelations, { includeBody = true } = {}) {
    return {
        slug: article.slug,
        title: article.title,
        description: article.description,
        ...(includeBody && { body: article.body }),
        tagList: article.tags.map((t) => t.tag.name),
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        favorited: article.favoritedBy.length > 0,
        favoritesCount: article._count.favoritedBy,
        author: {
            username: article.author.username,
            bio: article.author.bio,
            image: article.author.image,
            following: false,
        },
    };
}

async function findOrFail(slug: string, viewerId?: number) {
    const article = await repo.findArticleBySlug(slug, viewerId);
    if (!article) {
        throw new NotFoundError("Article not found", { article: ["not found"] });
    }
    return article;
}

async function findOwnedOrFail(slug: string, userId: number) {
    const article = await findOrFail(slug, userId);
    if (article.authorId !== userId) {
        throw new ForbiddenError("Only the author can modify this article", { article: ["forbidden"] });
    }
    return article;
}

export async function getArticle(slug: string, viewerId?: number) {
    return toArticleResponse(await findOrFail(slug, viewerId));
}

export async function createArticle(userId: number, input: CreateArticleInput) {
    const { tagList = [], ...fields } = input;
    const article = await repo.createArticle(
        { ...fields, slug: createSlug(fields.title), authorId: userId },
        tagList,
    );
    return toArticleResponse(article);
}

export async function updateArticle(userId: number, slug: string, input: UpdateArticleInput) {
    const article = await findOwnedOrFail(slug, userId);
    const { tagList, ...fields } = input;
    const updated = await repo.updateArticle(article.id, fields, tagList, userId);
    return toArticleResponse(updated);
}

export async function deleteArticle(userId: number, slug: string) {
    const article = await findOwnedOrFail(slug, userId);
    await repo.deleteArticle(article.id);
}

export async function listArticles(query: ListArticlesQuery, viewerId?: number) {
    const { limit, offset, ...filters } = query;
    const { articles, count } = await repo.listArticles(filters, limit, offset, viewerId);
    return {
        articles: articles.map((a) => toArticleResponse(a, { includeBody: false })),
        articlesCount: count,
    };
}

export async function getFeed() {
    return { articles: [], articlesCount: 0 };
}

export async function favoriteArticle(userId: number, slug: string) {
    const article = await findOrFail(slug, userId);
    await repo.addFavorite(userId, article.id);
    return getArticle(slug, userId);
}

export async function unfavoriteArticle(userId: number, slug: string) {
    const article = await findOrFail(slug, userId);
    await repo.removeFavorite(userId, article.id);
    return getArticle(slug, userId);
}
