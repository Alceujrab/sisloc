import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      const raw = localStorage.getItem('favorites');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(ids));
  }, [ids]);

  const value = useMemo(() => ({
    ids,
    isFavorite: (id) => ids.includes(id),
    toggle: (id) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]),
    clear: () => setIds([]),
  }), [ids]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider');
  return ctx;
}
