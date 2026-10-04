import { useCallback, useEffect, useRef, useState } from "react";
type Playback = {
  context: AudioContext;
  source: AudioBufferSourceNode | null;
  abort: AbortController;
};
export function useBgm() {
  const audio = useRef<Playback | null>(null);
  const pending = useRef(false);
  const wanted = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const release = useCallback(() => {
    wanted.current = false;
    const current = audio.current;
    audio.current = null;
    if (current) {
      current.context.onstatechange = null;
      current.abort.abort();
      current.source?.stop();
      current.source?.disconnect();
      void current.context.close().catch(() => {});
    }
  }, []);
  const stop = useCallback(() => {
    release();
    setEnabled(false);
  }, [release]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
      release();
    };
  }, [release, stop]);
  const toggle = async () => {
    if (pending.current) return;
    if (enabled) {
      stop();
      return;
    }
    pending.current = true;
    wanted.current = true;
    setBusy(true);
    setError(false);
    try {
      const context = new AudioContext();
      const current: Playback = {
        context,
        source: null,
        abort: new AbortController(),
      };
      audio.current = current;
      context.onstatechange = () => {
        if (
          audio.current === current &&
          context.state !== "running" &&
          current.source
        )
          stop();
      };
      // Unlock audio inside the tap before fetching/decoding, including on iOS.
      await context.resume();
      if (!wanted.current || audio.current !== current) return;
      const response = await fetch(
        `${import.meta.env.BASE_URL}audio/investigation.mp3`,
        { signal: current.abort.signal },
      );
      if (!response.ok) throw new Error("BGM unavailable");
      const buffer = await context.decodeAudioData(
        await response.arrayBuffer(),
      );
      if (!wanted.current || document.hidden || audio.current !== current)
        return;
      if (context.state !== "running") throw new Error("Audio interrupted");
      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = 0.25;
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.connect(context.destination);
      current.source = source;
      source.start();
      setEnabled(true);
    } catch {
      const failed = wanted.current;
      stop();
      if (failed) setError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return { enabled, busy, error, toggle };
}
