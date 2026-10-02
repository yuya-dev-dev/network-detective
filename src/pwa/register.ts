import { useEffect, useRef, useState } from "react";
export function useOffline() {
  const [ready, setReady] = useState(false),
    [waiting, setWaiting] = useState(false),
    [message, setMessage] = useState<string | null>(null);
  const registration = useRef<ServiceWorkerRegistration | null>(null),
    applying = useRef(false);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let alive = true;
    const changed = () => {
      if (applying.current) window.location.reload();
      else if (alive) setReady(true);
    };
    const workerMessage = (event: MessageEvent) => {
      if (event.data?.type === "UPDATE_BLOCKED") {
        applying.current = false;
        setMessage(
          "更新する前に、このゲームを開いている他のタブやウィンドウを閉じてください。",
        );
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    navigator.serviceWorker.addEventListener("message", workerMessage);
    navigator.serviceWorker
      .register(new URL("sw.js", document.baseURI).href, {
        updateViaCache: "none",
      })
      .then((reg) => {
        if (!alive) return;
        registration.current = reg;
        setWaiting(!!reg.waiting);
        const watch = (worker: ServiceWorker | null) => {
          if (!worker) return;
          const stateChanged = () => {
            if (alive && worker.state === "installed") {
              if (navigator.serviceWorker.controller) setWaiting(true);
            }
          };
          worker.addEventListener("statechange", stateChanged);
          stateChanged();
        };
        watch(reg.installing);
        reg.addEventListener("updatefound", () => watch(reg.installing));
        navigator.serviceWorker.ready.then(() => {
          if (alive) setReady(true);
        });
      })
      .catch(() => {
        if (alive)
          setMessage(
            "オフライン準備を完了できませんでした。オンラインで続行できます。",
          );
      });
    const focus = () => {
      registration.current?.update().catch(() => {});
    };
    window.addEventListener("focus", focus);
    return () => {
      alive = false;
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      navigator.serviceWorker.removeEventListener("message", workerMessage);
      window.removeEventListener("focus", focus);
    };
  }, []);
  const apply = () => {
    if (registration.current?.waiting) {
      applying.current = true;
      registration.current.waiting.postMessage({ type: "APPLY_UPDATE" });
    }
  };
  return { ready, waiting, message, apply };
}
