"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "branch:voiceURI";
const RATE = 0.95; // a touch slower than default — easier to follow

type SpeechContextValue = {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  setVoiceURI: (uri: string) => void;
  // Configure an utterance with the chosen voice + rate.
  makeUtterance: (text: string) => SpeechSynthesisUtterance;
  // Speak a single phrase now, cancelling anything in progress.
  speak: (text: string) => void;
  cancel: () => void;
};

const SpeechContext = createContext<SpeechContextValue | null>(null);

// Pick a pleasant English default rather than the browser's robotic fallback:
// prefer Microsoft "Natural" voices, then Google voices, then the OS default.
function pickDefault(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const find = (test: (v: SpeechSynthesisVoice) => boolean) =>
    voices.find(test);
  return (
    find((v) => /natural/i.test(v.name) && v.lang.startsWith("en")) ??
    find((v) => /google/i.test(v.name) && v.lang.startsWith("en")) ??
    find((v) => v.default && v.lang.startsWith("en")) ??
    find((v) => v.lang.startsWith("en")) ??
    voices[0]
  );
}

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURIState] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  // Voices load asynchronously in most browsers, so listen for them.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setAllVoices(v);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // Once voices exist, restore the saved choice or fall back to a good default.
  useEffect(() => {
    if (allVoices.length === 0 || voiceURI) return;
    const saved =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (saved && allVoices.some((v) => v.voiceURI === saved)) {
      setVoiceURIState(saved);
    } else {
      const def = pickDefault(allVoices);
      if (def) setVoiceURIState(def.voiceURI);
    }
  }, [allVoices, voiceURI]);

  // Only surface English voices in the picker, to keep the list short.
  const voices = useMemo(() => {
    const en = allVoices.filter((v) => v.lang.startsWith("en"));
    return en.length ? en : allVoices;
  }, [allVoices]);

  const selectedVoice = useMemo(
    () => allVoices.find((v) => v.voiceURI === voiceURI) ?? null,
    [allVoices, voiceURI],
  );

  const setVoiceURI = useCallback((uri: string) => {
    setVoiceURIState(uri);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, uri);
    }
  }, []);

  const makeUtterance = useCallback(
    (text: string) => {
      const u = new SpeechSynthesisUtterance(text);
      if (selectedVoice) u.voice = selectedVoice;
      u.rate = RATE;
      return u;
    },
    [selectedVoice],
  );

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(makeUtterance(text));
    },
    [makeUtterance],
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const value: SpeechContextValue = {
    supported,
    voices,
    voiceURI,
    setVoiceURI,
    makeUtterance,
    speak,
    cancel,
  };

  return (
    <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>
  );
}

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within a SpeechProvider");
  return ctx;
}
