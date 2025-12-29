serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    window.dispatchEvent(new CustomEvent("timebox_sw_update", { detail: registration }));
  },
});
