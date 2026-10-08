// Doit rester le premier import : charge api/.env avant que les autres modules lisent process.env
import 'dotenv/config'
import { app } from './app.js'

const port = Number(process.env.PORT ?? 3000)

app.listen(port, () => {
  console.log(`API Project X démarrée sur http://localhost:${port}`)
})
