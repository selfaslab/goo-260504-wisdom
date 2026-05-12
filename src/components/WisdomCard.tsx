import { useCallback, useEffect, useState } from "react";
import type { WisdomPayload } from "../lib/openai";
import {
  formatCopyText,
  formatWisdomLine,
  initialsFromAuthor,
} from "../lib/openai";

type Props = {
  wisdom: WisdomPayload | null;
  loading: boolean;
  error: string | null;
  onNew: () => void;
};

export function WisdomCard({ wisdom, loading, error, onNew }: Props) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(false);
  }, [wisdom]);

  useEffect(() => {
    return () => speechSynthesis.cancel();
  }, [wisdom]);

  const handleShare = useCallback(async () => {
    if (!wisdom) return;
    const text = formatCopyText(wisdom);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "오늘의 철학",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        window.alert("클립보드에 복사했습니다.");
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        window.alert("클립보드에 복사했습니다.");
      } catch {
        window.prompt("공유할 내용:", text);
      }
    }
  }, [wisdom]);

  const handleSpeak = useCallback(() => {
    if (!wisdom) return;
    speechSynthesis.cancel();
    const ko = new SpeechSynthesisUtterance(wisdom.quoteKorean);
    ko.lang = "ko-KR";
    ko.rate = 0.92;
    const orig = new SpeechSynthesisUtterance(wisdom.quoteOriginal);
    orig.rate = 0.9;
    ko.onend = () => speechSynthesis.speak(orig);
    speechSynthesis.speak(ko);
  }, [wisdom]);

  const handleSpeakClick = useCallback(() => {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      return;
    }
    handleSpeak();
  }, [handleSpeak]);

  return (
    <article className="wisdom-card" aria-busy={loading}>
      {wisdom && !loading && (
        <div className="wisdom-card__toolbar">
          <button
            type="button"
            className="wisdom-card__icon-btn"
            onClick={() => void handleShare()}
            aria-label="공유"
            title="공유"
          >
            📤
          </button>
          <button
            type="button"
            className="wisdom-card__icon-btn"
            onClick={() => setLiked((v) => !v)}
            aria-label="좋아요"
            title="좋아요"
            aria-pressed={liked}
          >
            {liked ? "❤️" : "🤍"}
          </button>
          <button
            type="button"
            className="wisdom-card__icon-btn"
            onClick={handleSpeakClick}
            aria-label="읽기"
            title="읽어주기 (다시 누르면 중지)"
          >
            🔊
          </button>
        </div>
      )}

      <div className="wisdom-card__figure-wrap">
        {loading ? (
          <div
            className="wisdom-card__figure wisdom-card__figure--loading"
            aria-hidden
          />
        ) : wisdom?.imageUrl ? (
          <div className="wisdom-card__figure">
            <img
              className="wisdom-card__art"
              src={wisdom.imageUrl}
              alt=""
              loading="lazy"
            />
          </div>
        ) : wisdom ? (
          <div className="wisdom-card__figure wisdom-card__figure--avatar">
            <div className="wisdom-card__avatar">
              {initialsFromAuthor(wisdom.author)}
            </div>
          </div>
        ) : (
          <div className="wisdom-card__figure wisdom-card__figure--placeholder">
            <div className="wisdom-card__avatar wisdom-card__avatar--muted">
              …
            </div>
          </div>
        )}
      </div>

      <div className="wisdom-card__content">
        {error && (
          <p className="wisdom-card__error" role="alert">
            {error}
          </p>
        )}

        {wisdom && !loading && (
          <>
            <blockquote className="wisdom-card__quote wisdom-card__quote--ko">
              “{wisdom.quoteKorean}”
            </blockquote>
            <blockquote className="wisdom-card__quote wisdom-card__quote--original">
              “{wisdom.quoteOriginal}”
            </blockquote>
            <p className="wisdom-card__meta">{formatWisdomLine(wisdom)}</p>
            {wisdom.localeNote && (
              <p className="wisdom-card__locale">{wisdom.localeNote}</p>
            )}
            {!wisdom.imageUrl && (
              <p className="wisdom-card__image-fallback">
                이미지 생성에 실패했습니다. 잠시 후 New wisdom을 다시 눌러 보세요.
              </p>
            )}
          </>
        )}

        {!wisdom && !loading && !error && (
          <p className="wisdom-card__hint">New wisdom으로 명언을 불러오세요.</p>
        )}

        {loading && (
          <p className="wisdom-card__loading">
            <span className="wisdom-card__spinner" aria-hidden />
            명언과 이미지를 불러오는 중…
          </p>
        )}

        <div className="wisdom-card__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={onNew}
            disabled={loading}
          >
            New wisdom
          </button>
        </div>
      </div>
    </article>
  );
}
