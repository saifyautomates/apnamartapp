"use client";

import { useEffect, useRef, useState } from "react";

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  brand?: { name: string } | null;
  imageUrl?: string;
}

export function useSearch(debounceMs = 200) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setSuggestions(json.data?.suggestions ?? []);
        setIsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, debounceMs]);

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  };

  return {
    query,
    setQuery,
    suggestions,
    isOpen,
    setIsOpen,
    isLoading,
    clear,
  };
}
