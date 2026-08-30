import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cffrPrototypeReports';

/**
 * Custom hook for managing report storage
 * @returns {object} reports array, loading state, error, and functions to load/save reports
 */
export function useReportStorage() {
  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  function loadReports() {
    try {
      const savedValue = window.localStorage.getItem(STORAGE_KEY);
      const savedReports = savedValue ? JSON.parse(savedValue) : [];
      setReports(Array.isArray(savedReports) ? savedReports : []);
      setError('');
    } catch (storageError) {
      console.error('Could not load prototype reports:', storageError);
      setError('Saved reports could not be loaded. Check that browser storage is enabled.');
      setReports([]);
    } finally {
      setLoaded(true);
    }
  }

  function saveReport(newReport) {
    try {
      const savedValue = window.localStorage.getItem(STORAGE_KEY);
      const savedReports = savedValue ? JSON.parse(savedValue) : [];
      const currentReports = Array.isArray(savedReports) ? savedReports : [];
      const updatedReports = [newReport, ...currentReports];

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
      setReports(updatedReports);
      return { success: true, error: null };
    } catch (storageError) {
      console.error('Could not save prototype report:', storageError);
      const errorMessage = getStorageErrorMessage(storageError);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  function getStorageErrorMessage(error) {
    if (error.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Please clear some old reports.';
    }
    return 'The report could not be saved. Check that browser storage is enabled.';
  }

  return { reports, loaded, error, loadReports, saveReport };
}
