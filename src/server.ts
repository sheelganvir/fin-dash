import { createApp } from './app';
import { connectDB } from './database/connection';
import { env } from './config/env';

async function bootstrap() {
  await connectDB();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`API Docs: http://localhost:${env.PORT}/api-docs`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
