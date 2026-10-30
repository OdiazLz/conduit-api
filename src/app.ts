import express from "express";import { errorHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(express.json());


app.get("/api/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/api", userRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
}
);

app.use(errorHandler);
;
export default app;
