import { config } from 'dotenv'
config({ path: '.env.local' })
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})

