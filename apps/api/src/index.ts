import { createServer } from "./server";
import { buildApp } from "./app";
import { initDatabase } from "./db";
import { runMigrations } from "./db/migrate";

const app = createServer();

const start = async () => {
  await buildApp(app);
  const db = initDatabase(app.config);
  const migrationsRun = runMigrations(db, app.config.migrationsPath);

  try {
    await app.listen({ port: app.config.port, host: "0.0.0.0" });
    app.log.info(
      {
        port: app.config.port,
        env: app.config.env,
        migrationsRun
      },
      "API server started"
    );
  } catch (error) {
    app.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

start();
