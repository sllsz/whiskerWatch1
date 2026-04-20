import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api';

const CatContext = createContext();

export function CatProvider({ children }) {
  const [cats, setCats] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track selectedCatId via ref so fetchCats doesn't depend on it,
  // avoiding a re-fetch every time the user switches cats.
  const selectedCatIdRef = useRef(selectedCatId);
  selectedCatIdRef.current = selectedCatId;

  const fetchCats = useCallback(async () => {
    const result = await apiFetch('/cats');
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setError(null);
    setCats(result.data);
    // Auto-select the first cat only if nothing is selected yet
    if (result.data.length > 0 && !selectedCatIdRef.current) {
      setSelectedCatId(result.data[0].id);
    }
    setLoading(false);
  }, []); // no deps — stable reference

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const selectedCat = cats.find(c => c.id === selectedCatId) || null;

  /**
   * Creates a new cat profile. Only auto-selects if it's the first cat
   * (onboarding). Otherwise the caller can choose to switch.
   */
  const addCat = async (cat) => {
    const result = await apiFetch('/cats', { method: 'POST', body: cat });
    if (!result.ok) throw new Error(result.error);
    setCats(prev => [...prev, result.data]);
    if (cats.length === 0) {
      setSelectedCatId(result.data.id);
    }
    return result.data;
  };

  const updateCat = async (id, cat) => {
    const result = await apiFetch(`/cats/${id}`, { method: 'PUT', body: cat });
    if (!result.ok) throw new Error(result.error);
    setCats(prev => prev.map(c => c.id === id ? result.data : c));
    return result.data;
  };

  /**
   * Deletes a cat and all their logs. If the deleted cat was selected,
   * falls back to another cat. Uses the setCats callback to avoid
   * stale-closure issues when deriving the fallback.
   */
  const deleteCat = async (id) => {
    const result = await apiFetch(`/cats/${id}`, { method: 'DELETE' });
    if (!result.ok) throw new Error(result.error);
    setCats(prev => {
      const remaining = prev.filter(c => c.id !== id);
      // If we deleted the currently selected cat, pick the first remaining one
      if (selectedCatIdRef.current === id) {
        setSelectedCatId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  return (
    <CatContext.Provider value={{
      cats, selectedCat, selectedCatId, setSelectedCatId,
      addCat, updateCat, deleteCat, loading, error, refreshCats: fetchCats,
    }}>
      {children}
    </CatContext.Provider>
  );
}

export const useCats = () => useContext(CatContext);
