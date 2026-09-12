// Clear the development worker before loading React's module graph. An old
// worker can reject Vite's CSS-as-JavaScript modules before main.tsx can run.
async function bootstrap() {
  if (import.meta.env.DEV) {
    const { clearDevelopmentServiceWorker } = await import('./devServiceWorker');
    if (await clearDevelopmentServiceWorker()) {
      window.location.reload();
      return;
    }
  }

  await import('./main');
}

void bootstrap();
