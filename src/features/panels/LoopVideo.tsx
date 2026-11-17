'use client';

/**
 * 소리 없이 되풀이되는 짧은 영상(ABOUT ME 첫 포트폴리오 칸, 11-13). 움직이는 그림(GIF·animated WebP)의 자리를 <video>로 대신한다.
 *
 * 왜 autoplay 속성이 아니라 직접 play()인가:
 *  - 움직임 줄이기 설정이면 저절로 재생하지 않아야 한다. autoplay 속성은 그 설정을 모른다.
 *  - 화면에 보일 때만 재생한다(IntersectionObserver). 창을 열자마자 스크롤 아래의 영상(약 2MB)을 받지 않게 preload="none"으로 두고,
 *    칸이 보이는 순간 play()가 받기 시작한다. 그 전에는 poster(첫 장면 그림)가 자리를 지킨다.
 * 왜 controls를 두나: 5초 넘게 저절로 움직이는 것은 멈출 방법이 있어야 한다(WCAG 2.2.2). 움직임 줄이기 사용자는 이 버튼으로 직접 재생한다.
 * muted + playsInline: 소리 없는 영상만 자동 재생이 허용되고(브라우저 정책), iOS는 playsInline이 없으면 전체 화면으로 튄다.
 * 파일에는 오디오 트랙이 없다(이 사이트는 소리를 쓰지 않는다).
 * sources는 앞에서부터 브라우저가 재생할 수 있는 첫 형식을 고른다(MP4를 앞에 두면 WebM을 못 읽는 구형 사파리도 재생).
 */
import { useEffect, useRef } from 'react';

export function LoopVideo({
  sources,
  poster,
  label,
  width,
  height,
  className,
}: {
  sources: readonly { src: string; type: string }[];
  poster: string;
  /** 영상에 보이는 것을 글로(스크린리더용, 그림의 alt 자리) */
  label: string;
  width: number;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          // 재생이 막히면(절전 모드 등) poster와 재생 버튼이 남는다. 오류로 다룰 일이 아니다
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      controls
      preload="none"
      poster={poster}
      aria-label={label}
      width={width}
      height={height}
      className={className}
    >
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
