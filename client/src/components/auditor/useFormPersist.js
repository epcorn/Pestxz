import { useEffect, useRef } from "react";

const STORAGE_KEY = "audit-form-draft";

export function useFormPersist({ watch, reset, getValues }) {
  const hasRestored = useRef(false);

  // Restore saved draft on mount, once
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset(parsed, { keepDefaultValues: true });
      }
    } catch (err) {
      console.error("Failed to restore audit draft:", err);
    }
  }, [reset]);

  // Save on every change, debounced
  useEffect(() => {
    let timeout;
    const subscription = watch((values) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        try {
          // Strip FileList fields — can't be JSON-serialized
          const cleaned = Object.fromEntries(
            Object.entries(values).filter(
              ([key, val]) =>
                !(val instanceof FileList) && !key.endsWith("_images"),
            ),
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        } catch (err) {
          console.error("Failed to save audit draft:", err);
        }
      }, 500); // debounce so typing doesn't hammer localStorage
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [watch]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { clearDraft };
}
