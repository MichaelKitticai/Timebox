function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state !== "installed") return;

          // New content is available
          if (navigator.serviceWorker.controller) {
            if (config && config.onUpdate) config.onUpdate(registration);
          } else {
            // First install
            if (config && config.onSuccess) config.onSuccess(registration);
          }
        };
      };
    })
    .catch(() => {});
}
