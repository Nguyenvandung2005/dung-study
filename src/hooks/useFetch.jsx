import { useEffect, useRef, useState } from "react";

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache theo URL trong tung instance cua hook.
  const cacheRef = useRef({});

  useEffect(() => {
    if (!url) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (cacheRef.current[url]) {
      setData(cacheRef.current[url]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const payload = await response.json();
        cacheRef.current[url] = payload;
        setData(payload);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}
