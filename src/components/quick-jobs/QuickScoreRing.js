import { useEffect, useRef, useState } from 'react';
import { getScoreRingOffset } from '../../utils/quickJobs';

export function ScoreRing({
  className,
  score,
  animationKey = 0,
  enableAnimation = true,
  scoreRingRef = null
}) {
  return (
    <div
      ref={scoreRingRef}
      className={`${className || ''}${enableAnimation ? '' : ' score-ring--no-animate'}`.trim()}
      style={{ '--score-ring-offset': String(getScoreRingOffset(score)) }}
      aria-label={typeof score === 'number' ? `${score}점` : '점수 확인 필요'}
    >
      <svg className="score-ring__chart" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="score-ring__track" cx="60" cy="60" r="52" />
        <circle key={`${animationKey}-${score ?? 'empty'}`} className="score-ring__value" cx="60" cy="60" r="52" pathLength="100" />
      </svg>
      <strong>{typeof score === 'number' ? score : '-'}</strong>
      <span>{typeof score === 'number' ? '/ 100' : ''}</span>
    </div>
  );
}

export function VisibilityTriggeredScoreRing({ className, score, observeKey }) {
  const scoreRingRef = useRef(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [enableAnimation, setEnableAnimation] = useState(false);

  useEffect(() => {
    setAnimationKey(0);
    setEnableAnimation(false);
  }, [observeKey, score]);

  useEffect(() => {
    const target = scoreRingRef.current;
    if (!target || enableAnimation) {
      return undefined;
    }

    if (typeof window.IntersectionObserver !== 'function') {
      setEnableAnimation(true);
      setAnimationKey((previous) => previous + 1);
      return undefined;
    }

    let frameId = 0;
    // 점수 링이 화면에 처음 보일 때만 애니메이션을 시작한다.
    const observer = new window.IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) {
        return;
      }
      observer.disconnect();
      frameId = window.requestAnimationFrame(() => {
        setEnableAnimation(true);
        setAnimationKey((previous) => previous + 1);
      });
    }, { threshold: 0.35 });

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [enableAnimation]);

  return (
    <ScoreRing
      className={className}
      score={score}
      animationKey={animationKey}
      enableAnimation={enableAnimation}
      scoreRingRef={scoreRingRef}
    />
  );
}
