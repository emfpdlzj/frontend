import { useEffect, useRef, useState } from 'react';
import { NAVER_MAP_CONFIG } from '../config/appConfig';
import { StatusMessage } from '../components/common/StatusMessage';
import { loadNaverMapScript } from '../utils/naverMapSdk';

const NAVER_MAP_SCRIPT_ID = 'bridgework-naver-map-sdk-smoke';
const NAVER_MAP_READY_CALLBACK = '__bridgeworkNaverMapSmokeReady__';

export function NaverMapSmokeTestPage() {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [status, setStatus] = useState('SDK 로드 대기 중');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const mapElement = mapElementRef.current;

    if (!NAVER_MAP_CONFIG.clientId) {
      setError('REACT_APP_NAVER_MAP_CLIENT_ID가 없습니다.');
      return undefined;
    }

    setStatus('SDK 로드 중');

    loadNaverMapScript({
      clientId: NAVER_MAP_CONFIG.clientId,
      scriptId: NAVER_MAP_SCRIPT_ID,
      callbackName: NAVER_MAP_READY_CALLBACK
    })
      .then(() => {
        if (cancelled || !mapElement) {
          return;
        }

        setStatus('지도 생성 중');

        mapInstanceRef.current = new window.naver.maps.Map(mapElement, {
          center: new window.naver.maps.LatLng(37.5666103, 126.9783882),
          zoom: 15,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          zoomControl: true
        });

        window.naver.maps.Event.addListener(mapInstanceRef.current, 'tilesloaded', () => {
          if (!cancelled) {
            setStatus('타일 로드 완료');
          }
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || 'map-load-failed');
        }
      });

    return () => {
      cancelled = true;
      if (mapElement) {
        mapElement.innerHTML = '';
      }
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <main className="map-smoke-page">
      <header className="map-smoke-page__header">
        <h1>네이버 지도 단독 테스트</h1>
        <p>오버레이 없이 SDK 기본 지도만 렌더링합니다.</p>
      </header>

      <div className="map-smoke-page__status">
        <StatusMessage>{status}</StatusMessage>
        {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
      </div>

      <section className="map-smoke-page__map-shell" aria-label="네이버 지도 단독 테스트">
        <div ref={mapElementRef} className="map-smoke-page__map" />
      </section>
    </main>
  );
}
