import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { accessibilityMapMockData } from '../config/accessibilityMapMockData';

const VALID_PERSONAS = ['wheelchair', 'vision', 'hearing'];
const VALID_TABS = ['accessibility', 'job', 'company'];
const VALID_STATES = ['loading', 'error', 'empty', 'success'];

export function useAccessibilityMapMock() {
  const [searchParams] = useSearchParams();
  const initialPersona = searchParams.get('persona');
  const initialTab = searchParams.get('tab');
  const initialState = searchParams.get('mockState');

  const [selectedPersona, setSelectedPersona] = useState(
    VALID_PERSONAS.includes(initialPersona) ? initialPersona : 'wheelchair'
  );
  const [selectedTab, setSelectedTab] = useState(
    VALID_TABS.includes(initialTab) ? initialTab : 'accessibility'
  );
  const [selectedJobId, setSelectedJobId] = useState(accessibilityMapMockData.jobs[0]?.id ?? null);
  const [viewState, setViewState] = useState(
    VALID_STATES.includes(initialState) ? initialState : 'success'
  );

  const selectedJob = useMemo(
    () => accessibilityMapMockData.jobs.find((job) => job.id === selectedJobId) ?? accessibilityMapMockData.jobs[0],
    [selectedJobId]
  );

  return {
    jobs: accessibilityMapMockData.jobs,
    navItems: accessibilityMapMockData.navItems,
    personas: accessibilityMapMockData.personas,
    filterGroups: accessibilityMapMockData.filterGroups,
    mapLegend: accessibilityMapMockData.mapLegend,
    mapRadiusMeters: accessibilityMapMockData.mapRadiusMeters,
    mapRoutes: accessibilityMapMockData.mapRoutes,
    mapMarkers: accessibilityMapMockData.mapMarkers,
    mapViewport: accessibilityMapMockData.mapViewport,
    searchPlaceholder: accessibilityMapMockData.searchPlaceholder,
    selectedJob,
    selectedJobId,
    selectedPersona,
    selectedTab,
    viewState,
    setSelectedJobId,
    setSelectedPersona,
    setSelectedTab,
    setViewState
  };
}
