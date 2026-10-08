import cors from 'cors'
import express from 'express'
import { healthRouter } from './routes/health.js'
import authRouter from "./routes/auth.js"
import projectsRouter from "./routes/projects.js"
import categoriesRouter from "./routes/categories.js"
import dashboardRouter from "./routes/dashboard.js"
import { requireAuth } from "./middlewares/auth.js"

export const app = express()

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }))
app.use(express.json())

app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/categories", categoriesRouter);
app.use("/dashboard", dashboardRouter);

app.use('/api/health', healthRouter)

app.get("/me", requireAuth, (req, res) => {
  res.json({
    user: req.user,
  });
});

// 404 JSON pour toute route inconnue
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' })
})
