import { useEffect, useRef, useState } from 'react';
import { NAVER_MAP_CONFIG } from '../../config/appConfig';
import { loadNaverMapScript } from '../../utils/naverMapSdk';

const POSTING_NAVER_MAP_SCRIPT_ID = 'bridgework-posting-naver-map-sdk';
const POSTING_NAVER_MAP_READY_CALLBACK = '__bridgeworkPostingNaverMapReady__';

export function PostingMapPreview({ mapPreview, title }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const hasPoint = Boolean(
    mapPreview?.available
    && typeof mapPreview?.lat === 'number'
    && typeof mapPreview?.lng === 'number'
  );
  const [status, setStatus] = useState(hasPoint ? 'loading' : 'empty');

  useEffect(() => {
    if (!hasPoint) {
      setStatus('empty');
      return undefined;
    }

    if (!NAVER_MAP_CONFIG.clientId) {
      setStatus('missing-client-id');
      return undefined;
    }

    let cancelled = false;
    let frameId = 0;

    setStatus('loading');

    loadNaverMapScript({
      clientId: NAVER_MAP_CONFIG.clientId,
      scriptId: POSTING_NAVER_MAP_SCRIPT_ID,
      callbackName: POSTING_NAVER_MAP_READY_CALLBACK
    })
      .then(() => {
        const initializeMap = () => {
          if (cancelled || !mapElementRef.current) {
            return;
          }

          if (mapElementRef.current.clientWidth <= 0 || mapElementRef.current.clientHeight <= 0) {
            frameId = window.requestAnimationFrame(initializeMap);
            return;
          }

          try {
            const position = new window.naver.maps.LatLng(mapPreview.lat, mapPreview.lng);
            mapInstanceRef.current = new window.naver.maps.Map(mapElementRef.current, {
              center: position,
              zoom: 16,
              mapTypeId: window.naver.maps.MapTypeId.NORMAL,
              zoomControl: true,
              zoomControlOptions: {
                position: window.naver.maps.Position.TOP_RIGHT
              }
            });
            markerRef.current = new window.naver.maps.Marker({
              position,
              map: mapInstanceRef.current,
              title
            });
            setStatus('ready');
          } catch (error) {
            setStatus('error');
          }
        };

        initializeMap();
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapElementRef.current) {
        mapElementRef.current.innerHTML = '';
      }
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [hasPoint, mapPreview?.lat, mapPreview?.lng, title]);

  if (!hasPoint) {
    return (
      <div className="scrap-map-preview is-empty">
        <strong>{mapPreview?.label}</strong>
        <p>{mapPreview?.address}</p>
      </div>
    );
  }

  return (
    <div className="scrap-naver-map-preview">
      <div ref={mapElementRef} className="scrap-naver-map-preview__canvas" role="img" aria-label={`${title} 근무지 지도`} />
      {status !== 'ready' ? (
        <div className="scrap-naver-map-preview__overlay" role={status === 'error' || status === 'missing-client-id' ? 'alert' : 'status'}>
          {status === 'missing-client-id'
            ? '네이버 지도 클라이언트 정보가 없습니다.'
            : status === 'error'
              ? '네이버 지도를 표시하지 못했습니다.'
              : '네이버 지도를 불러오는 중입니다.'}
        </div>
      ) : null}
      <div className="scrap-naver-map-preview__caption">
        <strong>{mapPreview?.label}</strong>
        <p>{mapPreview?.address}</p>
      </div>
    </div>
  );
}
