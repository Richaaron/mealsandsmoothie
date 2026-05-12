import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const recipes = JSON.parse(fs.readFileSync('../backend/data/recipes.json', 'utf8'))

async function migrate() {
  console.log(`🚀 Starting migration of ${recipes.length} recipes to Supabase...`)

  // Split into chunks of 100 to avoid request size limits
  const chunkSize = 100
  for (let i = 0; i < recipes.length; i += chunkSize) {
    const chunk = recipes.slice(i, i + chunkSize)
    const { error } = await supabase.from('recipes').upsert(chunk)
    
    if (error) {
      console.error(`❌ Error migrating chunk ${i / chunkSize + 1}:`, error.message)
    } else {
      console.log(`✅ Migrated chunk ${i / chunkSize + 1}/${Math.ceil(recipes.length / chunkSize)}`)
    }
  }

  console.log('🎉 Migration complete!')
}

migrate()
