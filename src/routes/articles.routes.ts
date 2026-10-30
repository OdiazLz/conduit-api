import { Router, type Request } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth";
import * as articles from "../services/articles.service";
import {
    createArticleSchema,
    feedQuerySchema,
    listArticlesQuerySchema,
    updateArticleSchema,
} from "../validation/articles.schemas";
import { parseBody, parseOrThrow } from "../validation/common";

const router = Router();

const slugOf = (req: Request) => String(req.params.slug);

router.get("/articles", optionalAuth, async (req, res) => {
    const query = parseOrThrow(listArticlesQuerySchema, req.query);
    res.status(200).json(await articles.listArticles(query, req.userId));
});

router.get("/articles/feed", requireAuth, async (req, res) => {
    parseOrThrow(feedQuerySchema, req.query);
    res.status(200).json(await articles.getFeed());
});

router.post("/articles", requireAuth, async (req, res) => {
    const input = parseBody(createArticleSchema, req.body, "article");
    const article = await articles.createArticle(req.userId!, input);
    res.status(201).json({ article });
});

router.get("/articles/:slug", optionalAuth, async (req, res) => {
    const article = await articles.getArticle(slugOf(req), req.userId);
    res.status(200).json({ article });
});

router.put("/articles/:slug", requireAuth, async (req, res) => {
    const input = parseBody(updateArticleSchema, req.body, "article");
    const article = await articles.updateArticle(req.userId!, slugOf(req), input);
    res.status(200).json({ article });
});

router.delete("/articles/:slug", requireAuth, async (req, res) => {
    await articles.deleteArticle(req.userId!, slugOf(req));
    res.status(204).end();
});

router.post("/articles/:slug/favorite", requireAuth, async (req, res) => {
    const article = await articles.favoriteArticle(req.userId!, slugOf(req));
    res.status(200).json({ article });
});

router.delete("/articles/:slug/favorite", requireAuth, async (req, res) => {
    const article = await articles.unfavoriteArticle(req.userId!, slugOf(req));
    res.status(200).json({ article });
});

export default router;
