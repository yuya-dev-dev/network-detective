import { useEffect } from "react";

type Playback = {
  context: AudioContext;
  abort: AbortController;
  music: AudioBufferSourceNode | null;
  loading: boolean;
  click: OscillatorNode | null;
};

// Both sounds are enabled. Browsers unlock them on the first user activation.
// This hook lives above the case provider so changing cases does not restart BGM.
export function useGameAudio() {
  useEffect(() => {
    let audio: Playback | null = null;
    let buffer: AudioBuffer | null = null;
    const release = () => {
      const current = audio;
      audio = null;
      if (!current) return;
      current.context.onstatechange = null;
      current.abort.abort();
      void current.context.close().catch(() => {});
    };
    const startMusic = async (current: Playback) => {
      if (current.music || current.loading) return;
      current.loading = true;
      try {
        if (!buffer) {
          const response = await fetch(
            `${import.meta.env.BASE_URL}audio/investigation.mp3`,
            { signal: current.abort.signal },
          );
          if (!response.ok) throw new Error("BGM unavailable");
          buffer = await current.context.decodeAudioData(
            await response.arrayBuffer(),
          );
        }
        if (
          audio !== current ||
          document.hidden ||
          current.context.state !== "running"
        )
          return;
        const source = current.context.createBufferSource();
        const gain = current.context.createGain();
        gain.gain.value = 0.18;
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(current.context.destination);
        current.music = source;
        source.start();
      } catch {
        // Missing music must not disable click feedback or game interaction.
      } finally {
        current.loading = false;
      }
    };
    const activate = () => {
      if (document.hidden) return null;
      try {
        if (!audio) {
          const context = new AudioContext();
          const current: Playback = {
            context,
            abort: new AbortController(),
            music: null,
            loading: false,
            click: null,
          };
          audio = current;
          context.onstatechange = () => {
            if (
              audio === current &&
              context.state !== "running" &&
              current.music
            )
              release();
          };
        }
        const current = audio;
        // Call resume synchronously inside the gesture, before fetch/decoding.
        void current.context
          .resume()
          .then(() => {
            if (audio === current) void startMusic(current);
          })
          .catch(() => {
            if (audio === current) release();
          });
        return current;
      } catch {
        release();
        return null;
      }
    };
    const click = (current: Playback) => {
      try {
        current.click?.stop();
        const { context } = current;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(650, now);
        oscillator.frequency.exponentialRampToValueAtTime(280, now + 0.045);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.055, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        oscillator.connect(gain);
        gain.connect(context.destination);
        current.click = oscillator;
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
          if (current.click === oscillator) current.click = null;
        };
        oscillator.start(now);
        oscillator.stop(now + 0.055);
      } catch {
        // Sound is optional feedback; it must never block the action.
      }
    };
    const control = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest(
            'button, [role="button"], input[type="checkbox"], input[type="radio"], summary',
          )
        : null;
    const usable = (element: Element | null) =>
      element &&
      !element.matches(":disabled") &&
      !element.closest('[aria-disabled="true"], [inert]');
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted) return;
      const element = control(event.target);
      if (element && !usable(element)) return;
      const current = activate();
      if (current && element) click(current);
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        !event.isTrusted ||
        event.repeat ||
        !["Enter", " "].includes(event.key)
      )
        return;
      const element = control(event.target);
      // Native controls emit click for keyboard activation. SVG role=button does not.
      if (
        usable(element) &&
        element!.matches('[role="button"]') &&
        !element!.matches("button")
      ) {
        const current = activate();
        if (current) click(current);
      }
    };
    const hidden = () => {
      if (document.hidden) release();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", release);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", release);
      release();
    };
  }, []);
}
