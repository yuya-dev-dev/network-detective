import { useEffect } from "react";

type Playback = {
  context: AudioContext;
  abort: AbortController;
  music: AudioBufferSourceNode | null;
  loading: boolean;
  click: OscillatorNode[];
};

type Track = "title" | "investigation";
const trackForScreen = (): Track =>
  /^#(?:case\d+\/)?(?:brief|investigation|result)(?:\/|$)/.test(location.hash)
    ? "investigation"
    : "title";

// Both sounds are enabled. Browsers unlock them on the first user activation.
// This hook lives above the case provider so changing cases does not restart BGM.
export function useGameAudio() {
  useEffect(() => {
    let audio: Playback | null = null;
    const buffers = new Map<Track, AudioBuffer>();
    let wanted = trackForScreen();
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
      const track = wanted;
      current.loading = true;
      try {
        let buffer = buffers.get(track);
        if (!buffer) {
          const response = await fetch(
            `${import.meta.env.BASE_URL}audio/${track}.mp3`,
            { signal: current.abort.signal },
          );
          if (!response.ok) throw new Error("BGM unavailable");
          buffer = await current.context.decodeAudioData(
            await response.arrayBuffer(),
          );
          buffers.set(track, buffer);
        }
        if (
          audio !== current ||
          track !== wanted ||
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
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
        };
        current.music = source;
        source.start();
      } catch {
        // Missing music must not disable click feedback or game interaction.
      } finally {
        current.loading = false;
        // Navigation may change the requested track during fetch or decoding.
        if (audio === current && track !== wanted) void startMusic(current);
      }
    };
    const activate = () => {
      if (document.hidden) return null;
      // replaceState redirects do not emit hashchange.
      changeTrack();
      try {
        if (!audio) {
          const context = new AudioContext();
          const current: Playback = {
            context,
            abort: new AbortController(),
            music: null,
            loading: false,
            click: [],
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
    const click = (current: Playback, selection: boolean) => {
      try {
        current.click.forEach((node) => node.stop());
        current.click = [];
        const { context } = current;
        if (selection) {
          // Inharmonic sine partials give a soft, metallic decision chime.
          for (const [frequency, volume, duration] of [
            [1108, 0.035, 0.42],
            [1662, 0.012, 0.3],
            [3055, 0.006, 0.2],
          ]) {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const now = context.currentTime;
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            oscillator.connect(gain);
            gain.connect(context.destination);
            current.click.push(oscillator);
            oscillator.onended = () => {
              oscillator.disconnect();
              gain.disconnect();
              current.click = current.click.filter(
                (node) => node !== oscillator,
              );
            };
            oscillator.start(now);
            oscillator.stop(now + duration + 0.01);
          }
          return;
        }
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
        current.click.push(oscillator);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
          current.click = current.click.filter((node) => node !== oscillator);
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
      if (current && element)
        click(current, element.getAttribute("data-sound") === "select");
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
        if (current)
          click(current, element!.getAttribute("data-sound") === "select");
      }
    };
    const hidden = () => {
      if (document.hidden) release();
    };
    const changeTrack = () => {
      const next = trackForScreen();
      if (next === wanted) return;
      wanted = next;
      const current = audio;
      if (!current) return;
      current.music?.stop();
      current.music = null;
      if (!document.hidden && current.context.state === "running")
        void startMusic(current);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", release);
    window.addEventListener("hashchange", changeTrack);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", release);
      window.removeEventListener("hashchange", changeTrack);
      release();
    };
  }, []);
}
