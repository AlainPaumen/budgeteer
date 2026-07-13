import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const app = new Elysia()
  .use(cors())
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
  .listen(3000);

console.log(`Elysia server running at http://localhost:${app.server?.port}`);

export type App = typeof app;
