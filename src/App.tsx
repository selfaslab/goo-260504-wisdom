import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WisdomCard } from "./components/WisdomCard";
import {
  fetchWisdom,
  getApiKey,
  type WisdomPayload,
} from "./lib/openai";

/** Background images served from public/REF_IMG_DOC */
const BACKGROUND_PATHS = [
  "/REF_IMG_DOC/img1-hans-veth.jpg",
  "/REF_IMG_DOC/img2-Marwan Abdalah.jpg",
  "/REF_IMG_DOC/img3-marwan-abdalah.jpg",
];

function pickBackgroundUrl(): string {
  const i = Math.floor(Math.random() * BACKGROUND_PATHS.length);
  return BACKGROUND_PATHS[i] ?? BACKGROUND_PATHS[0];
}

function mapErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "알 수 없는 오류가 발생했습니다.";
  switch (err.message) {
    case "MISSING_KEY":
      return "API 키가 없습니다. env.md를 참고해 .env에 VITE_OPENAI_API_KEY를 설정하세요.";
    case "UNAUTHORIZED":
      return "인증에 실패했습니다. API 키를 확인하세요.";
    case "RATE_LIMIT":
      return "요청 한도에 걸렸습니다. 잠시 후 다시 시도하세요.";
    case "EMPTY_RESPONSE":
    case "INVALID_JSON":
    case "INCOMPLETE_PAYLOAD":
      return "응답 형식이 올바르지 않습니다. 다시 시도하세요.";
    default:
      if (err.message.startsWith("API_")) {
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.";
      }
      return err.message;
  }
}

export default function App() {
  const [bgUrl] = useState(pickBackgroundUrl);
  const [wisdom, setWisdom] = useState<WisdomPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadSeq = useRef(0);

  const hasKey = useMemo(() => Boolean(getApiKey()), []);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!getApiKey()) {
      setError(mapErrorMessage(new Error("MISSING_KEY")));
      return;
    }
    const id = ++loadSeq.current;
    setLoading(true);
    setError(null);
    setWisdom(null);
    try {
      const w = await fetchWisdom(signal);
      if (id !== loadSeq.current) return;
      setWisdom(w);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (id !== loadSeq.current) return;
      setWisdom(null);
      setError(mapErrorMessage(e));
    } finally {
      if (id === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasKey) {
      setError(mapErrorMessage(new Error("MISSING_KEY")));
      return;
    }
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [hasKey, load]);

  return (
    <div className="app-root" style={{ backgroundImage: `url(${bgUrl})` }}>
      <div className="app-overlay" />
      <header className="app-header">
        <h1 className="app-title">오늘의 철학</h1>
      </header>
      <main className="app-main">
        <WisdomCard
          wisdom={wisdom}
          loading={loading}
          error={error}
          onNew={() => void load()}
        />
      </main>
    </div>
  );
}
