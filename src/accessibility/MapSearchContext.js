import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MapSearchContext = createContext({
  searchEnabled: false,
  submittedQuery: '',
  setSearchEnabled: () => {},
  submitQuery: () => {},
  clearQuery: () => {}
});

export function MapSearchProvider({ children }) {
  const [searchEnabled, setSearchEnabledState] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');

  const setSearchEnabled = useCallback((enabled) => {
    setSearchEnabledState(Boolean(enabled));
  }, []);

  const submitQuery = useCallback((query) => {
    setSubmittedQuery(String(query || '').trim());
  }, []);

  const clearQuery = useCallback(() => {
    setSubmittedQuery('');
  }, []);

  const value = useMemo(
    () => ({
      searchEnabled,
      submittedQuery,
      setSearchEnabled,
      submitQuery,
      clearQuery
    }),
    [searchEnabled, submittedQuery, setSearchEnabled, submitQuery, clearQuery]
  );

  return (
    <MapSearchContext.Provider value={value}>
      {children}
    </MapSearchContext.Provider>
  );
}

export function useMapSearch() {
  return useContext(MapSearchContext);
}

