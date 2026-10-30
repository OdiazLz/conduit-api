import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import articleRoutes from "./routes/articles.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/api", userRoutes);
app.use("/api", articleRoutes);

app.use("/api", (_req, res) => {
	res.status(404).json({ errors: { route: ["not found"] } });
});

app.use(errorHandler);

export default app;
