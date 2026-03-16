import { beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { prisma } from '@/lib/prisma'

// Database URL for tests - use a separate test database
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/nexia_test'

beforeAll(async () => {
  // Set the database URL for Prisma
  process.env.DATABASE_URL = TEST_DATABASE_URL
  
  // Run migrations to ensure schema is up to date
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    })
  } catch (error) {
    console.warn('Could not run migrations, attempting to push schema...')
    try {
      execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        stdio: 'pipe',
      })
    } catch (e) {
      console.error('Failed to setup database schema:', e)
      throw e
    }
  }
  
  // Clean up any existing test data
  const tables = [
    'messages',
    'conversations', 
    'schedules',
    'whatsapp_instances',
    'contacts',
    'users',
    'organizations'
  ]
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE id LIKE 'test-%'`)
    } catch {
      // Table might not exist, ignore
    }
  }
})

afterAll(async () => {
  // Clean up test data
  const tables = [
    'messages',
    'conversations',
    'schedules', 
    'whatsapp_instances',
    'contacts',
    'users',
    'organizations'
  ]
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE id LIKE 'test-%'`)
    } catch {
      // Ignore errors
    }
  }
  
  await prisma.$disconnect()
})
