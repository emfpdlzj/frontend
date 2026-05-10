const sendWebVital = (metric) => {
  const endpoint = process.env.REACT_APP_WEB_VITALS_ENDPOINT;

  if (!endpoint) {
    return;
  }

  const body = JSON.stringify({
    name: metric.name,
    id: metric.id,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType
  });

  if (navigator.sendBeacon?.(endpoint, body)) {
    return;
  }

  fetch(endpoint, {
    method: 'POST',
    body,
    keepalive: true,
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch(() => {});
};

const reportWebVitals = (onPerfEntry = sendWebVital) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
