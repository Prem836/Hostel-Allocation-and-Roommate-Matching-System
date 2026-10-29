import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function bootstrap() {
  await connectDB();
  const app = createApp();

  app.listen(ENV.PORT, () => {
    console.log(`[Server] Running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
    console.log(`[Server] API root: http://localhost:${ENV.PORT}/api/v1`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal startup error:', err);
  process.exit(1);
});

