let naverMapScriptPromise = null;

export function loadNaverMapScript({ clientId, scriptId, callbackName }) {
  if (!clientId) {
    return Promise.reject(new Error('missing-client-id'));
  }

  if (window.naver?.maps) {
    return Promise.resolve(window.naver.maps);
  }

  if (naverMapScriptPromise) {
    return naverMapScriptPromise;
  }

  naverMapScriptPromise = new Promise((resolve, reject) => {
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.naver?.maps);
    };

    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener('error', () => reject(new Error('script-load-failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('script-load-failed'));
    document.head.appendChild(script);
  }).catch((error) => {
    naverMapScriptPromise = null;
    throw error;
  });

  return naverMapScriptPromise;
}
