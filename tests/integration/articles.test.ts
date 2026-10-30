import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { auth, createArticle, registerUser, uniqueName } from "../helpers";

describe("articles", () => {
	it("keeps tags in the order they were sent", async () => {
		const user = await registerUser("tags");
		const article = await createArticle(user.token, { tagList: ["zeta", "alpha", "mid"] });

		expect(article.tagList).toEqual(["zeta", "alpha", "mid"]);
	});

	it("only lets the author update or delete", async () => {
		const author = await registerUser("author");
		const other = await registerUser("other");
		const article = await createArticle(author.token);

		const update = await request(app)
			.put(`/api/articles/${article.slug}`)
			.set(auth(other.token))
			.send({ article: { body: "hacked" } });
		const remove = await request(app).delete(`/api/articles/${article.slug}`).set(auth(other.token));

		expect(update.status).toBe(403);
		expect(remove.status).toBe(403);
		expect(update.body).toEqual({ errors: { article: ["forbidden"] } });
	});

	it("keeps tags when tagList is omitted and clears them with []", async () => {
		const user = await registerUser("upd");
		const article = await createArticle(user.token, { tagList: ["a", "b"] });
		const url = `/api/articles/${article.slug}`;

		const omitted = await request(app).put(url).set(auth(user.token)).send({ article: { body: "new" } });
		expect(omitted.body.article.tagList).toEqual(["a", "b"]);

		const cleared = await request(app).put(url).set(auth(user.token)).send({ article: { tagList: [] } });
		expect(cleared.body.article.tagList).toEqual([]);

		const nullTags = await request(app).put(url).set(auth(user.token)).send({ article: { tagList: null } });
		expect(nullTags.status).toBe(422);
	});

	it("lists without body, newest first, and counts all matches", async () => {
		const user = await registerUser("list");
		const first = await createArticle(user.token, { title: "First" });
		const second = await createArticle(user.token, { title: "Second" });

		const res = await request(app).get(`/api/articles?author=${user.username}&limit=1`);

		expect(res.status).toBe(200);
		expect(res.body.articlesCount).toBe(2);
		expect(res.body.articles).toHaveLength(1);
		expect(res.body.articles[0].slug).toBe(second.slug);
		expect(res.body.articles[0]).not.toHaveProperty("body");
		expect(first.slug).not.toBe(second.slug);
	});

	it("favorites are per user", async () => {
		const author = await registerUser("favauthor");
		const fan = await registerUser("fan");
		const article = await createArticle(author.token);
		const url = `/api/articles/${article.slug}`;

		const fav = await request(app).post(`${url}/favorite`).set(auth(fan.token));
		expect(fav.body.article).toMatchObject({ favorited: true, favoritesCount: 1 });

		const asAuthor = await request(app).get(url).set(auth(author.token));
		expect(asAuthor.body.article).toMatchObject({ favorited: false, favoritesCount: 1 });

		const unfav = await request(app).delete(`${url}/favorite`).set(auth(fan.token));
		expect(unfav.body.article).toMatchObject({ favorited: false, favoritesCount: 0 });
	});

	it("feed requires a token and is empty because follow is out of scope", async () => {
		const user = await registerUser("feed");

		const noToken = await request(app).get("/api/articles/feed");
		const withToken = await request(app).get("/api/articles/feed").set(auth(user.token));

		expect(noToken.status).toBe(401);
		expect(withToken.body).toEqual({ articles: [], articlesCount: 0 });
	});

	it("returns 204 on delete and 404 afterwards", async () => {
		const user = await registerUser("del");
		const article = await createArticle(user.token);
		const url = `/api/articles/${article.slug}`;

		expect((await request(app).delete(url).set(auth(user.token))).status).toBe(204);

		const after = await request(app).get(url);
		expect(after.status).toBe(404);
		expect(after.body).toEqual({ errors: { article: ["not found"] } });
	});
});
