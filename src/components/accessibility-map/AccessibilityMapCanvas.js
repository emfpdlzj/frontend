import { memo, useEffect, useRef, useState } from 'react';
import { NAVER_MAP_CONFIG } from '../../config/appConfig';
import { loadNaverMapScript } from '../../utils/naverMapSdk';
import { LoadingView } from '../common/LoadingView';
import { StatusMessage } from '../common/StatusMessage';

const NAVER_MAP_SCRIPT_ID = 'bridgework-naver-map-sdk';
const NAVER_MAP_READY_CALLBACK = '__bridgeworkNaverMapReady__';

function AccessibilityMapCanvasComponent({ currentLocation, viewport, viewState, onRetry }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const [mapScriptStatus, setMapScriptStatus] = useState(() =>
    NAVER_MAP_CONFIG.clientId ? 'loading' : 'missing-client-id'
  );
  const [mapInitError, setMapInitError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!NAVER_MAP_CONFIG.clientId) {
      setMapScriptStatus('missing-client-id');
      return undefined;
    }

    setMapScriptStatus('loading');
    setMapInitError('');

    loadNaverMapScript({
      clientId: NAVER_MAP_CONFIG.clientId,
      scriptId: NAVER_MAP_SCRIPT_ID,
      callbackName: NAVER_MAP_READY_CALLBACK
    })
      .then(() => {
        if (isMounted) {
          setMapScriptStatus('ready');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setMapScriptStatus('error');
          setMapInitError(error.message || 'script-load-failed');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (viewState !== 'success' || mapScriptStatus !== 'ready' || !mapElementRef.current || mapInstanceRef.current) {
      return undefined;
    }

    let cancelled = false;
    let frameId = 0;
    const mapElement = mapElementRef.current;

    const initializeMap = () => {
      if (cancelled) {
        return;
      }

      if (mapElement.clientWidth <= 0 || mapElement.clientHeight <= 0) {
        frameId = window.requestAnimationFrame(initializeMap);
        return;
      }

      try {
        if (!window.naver?.maps?.Map) {
          throw new Error('sdk-not-ready');
        }

        mapInstanceRef.current = new window.naver.maps.Map(mapElement, {
          center: new window.naver.maps.LatLng(viewport.center.lat, viewport.center.lng),
          zoom: viewport.zoom,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          zoomControl: true
        });

        setMapInitError('');
      } catch (error) {
        setMapInitError(error.message || 'map-init-failed');
      }
    };

    initializeMap();

    return () => {
      cancelled = true;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [mapScriptStatus, viewport, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || viewState !== 'success') {
      return;
    }

    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(viewport.center.lat, viewport.center.lng));
    mapInstanceRef.current.setZoom(viewport.zoom, false);
  }, [mapScriptStatus, viewport, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || viewState !== 'success') {
      return;
    }

    if (!currentLocation) {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
        currentLocationMarkerRef.current = null;
      }
      return;
    }

    const position = new window.naver.maps.LatLng(currentLocation.lat, currentLocation.lng);

    if (!currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current = new window.naver.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: '현재 위치',
        icon: {
          content:
            '<div class="accessibility-map__current-location-marker" aria-hidden="true"><span></span></div>',
          anchor: new window.naver.maps.Point(11, 11)
        }
      });
      return;
    }

    currentLocationMarkerRef.current.setPosition(position);
    currentLocationMarkerRef.current.setMap(mapInstanceRef.current);
  }, [currentLocation, mapScriptStatus, viewState]);

  useEffect(
    () => () => {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
      if (mapElementRef.current) {
        mapElementRef.current.innerHTML = '';
      }
      currentLocationMarkerRef.current = null;
      mapInstanceRef.current = null;
    },
    []
  );

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1, true);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1, true);
  };

  const handleMoveToCurrentLocation = () => {
    if (!mapInstanceRef.current || !currentLocation) {
      return;
    }

    mapInstanceRef.current.panTo(new window.naver.maps.LatLng(currentLocation.lat, currentLocation.lng));
  };

  if (viewState === 'loading') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <LoadingView label="지역 접근성 지도를 준비하는 중입니다..." />
      </section>
    );
  }

  if (viewState === 'error') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <StatusMessage kind="error">지도 데이터를 불러오지 못했습니다. 다시 시도해주세요.</StatusMessage>
        <button type="button" className="primary-button accessibility-map__retry-button" onClick={onRetry}>
          다시 시도
        </button>
      </section>
    );
  }

  if (mapScriptStatus === 'missing-client-id') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <StatusMessage kind="error">
          네이버 지도 Client ID가 없습니다. `.env.local`에 `REACT_APP_NAVER_MAP_CLIENT_ID`를 설정해주세요.
        </StatusMessage>
      </section>
    );
  }

  if (mapScriptStatus === 'loading') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <LoadingView label="네이버 지도를 불러오는 중입니다..." />
      </section>
    );
  }

  if (mapScriptStatus === 'error' || mapInitError) {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <StatusMessage kind="error">네이버 지도를 표시하지 못했습니다.</StatusMessage>
      </section>
    );
  }

  return (
    <section className="accessibility-map__map-panel" aria-label="지역 접근성 지도">
      <div className="accessibility-map__map-surface">
        <div ref={mapElementRef} className="accessibility-map__naver-map" />
      </div>
      <div className="accessibility-map__map-actions" aria-label="지도 조작">
        <button
          type="button"
          className="accessibility-map__map-action-button"
          onClick={handleZoomIn}
          aria-label="지도 확대"
        >
          +
        </button>
        <button
          type="button"
          className="accessibility-map__map-action-button"
          onClick={handleZoomOut}
          aria-label="지도 축소"
        >
          -
        </button>
        <button
          type="button"
          className="accessibility-map__map-action-button is-location"
          onClick={handleMoveToCurrentLocation}
          aria-label="현재 위치로 이동"
          disabled={!currentLocation}
        >
          현위치
        </button>
      </div>
    </section>
  );
}

export const AccessibilityMapCanvas = memo(AccessibilityMapCanvasComponent);
