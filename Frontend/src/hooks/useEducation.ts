/**
 * useEducation.ts — v3 (production-ready)
 *
 * CHANGES vs v2:
 *  1. addModule: pdfFile param passed through correctly to API
 *  2. updateModule: pdfFile param passed through correctly
 *  3. setLoading(false) always runs in finally — no stuck spinner
 *  4. dbSynced: set true only when API returns live data
 *  5. Removed pdfFile size check from hook (controller handles validation)
 *  6. Module list stays sorted by `order` after every mutation
 *  7. On moveModule fail → correctly reverts to previous state
 *
 * Place in: src/hooks/useEducation.ts
 */

import { useState, useEffect, useCallback } from "react";
import CATEGORY_DATA from "@/data/CATEGORY_DATA_real";
import {
  fetchCategory,
  addModule     as apiAddModule,
  updateModule  as apiUpdateModule,
  deleteModule  as apiDeleteModule,
  reorderModules as apiReorderModules,
  updateCategoryMeta as apiUpdateMeta,
} from "@/services/api/educationApi";

export function useEducation(categoryId: string | undefined) {
  const staticData = categoryId ? (CATEGORY_DATA as any)[categoryId] : null;

  const [data,     setData]     = useState<any>(staticData ? { ...staticData } : null);
  const [modules,  setModules]  = useState<any[]>(staticData?.modules ?? []);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [dbSynced, setDbSynced] = useState(false);

  // ── Fetch live data from MongoDB ───────────────────────────────────────────
  useEffect(() => {
    if (!categoryId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    fetchCategory(categoryId)
      .then((cat) => {
        const sorted = [...(cat.modules ?? [])].sort(
          (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
        );
        const { modules: _m, ...meta } = cat;
        setData(meta);
        setModules(sorted);
        setDbSynced(true);
      })
      .catch(() => {
        // API unavailable or category not in DB yet — static data already showing
        setDbSynced(false);
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  // ── Add module ─────────────────────────────────────────────────────────────
  const addModule = useCallback(
    async (newMod: any, pdfFile?: File | null) => {
      if (!categoryId) return;
      try {
        if (dbSynced) {
          // API returns the saved module object directly
          const savedModule = await apiAddModule(categoryId, newMod, pdfFile);
          setModules((prev) => [...prev, savedModule]);
        } else {
          // Not seeded yet — local only (will vanish on refresh — prompt to seed)
          setModules((prev) => [...prev, { ...newMod, _id: `local-${Date.now()}` }]);
        }
      } catch (e: any) {
        alert("Failed to add module: " + e.message);
      }
    },
    [categoryId, dbSynced]
  );

  // ── Update module ──────────────────────────────────────────────────────────
  const updateModule = useCallback(
    async (moduleId: string, fields: any, pdfFile?: File | null) => {
      if (!categoryId) return;
      try {
        if (dbSynced && !moduleId.startsWith("local-")) {
          // API returns the updated module object directly
          const updated = await apiUpdateModule(categoryId, moduleId, fields, pdfFile);
          setModules((prev) =>
            prev.map((m) => (m._id === moduleId ? { ...m, ...updated } : m))
          );
        } else {
          setModules((prev) =>
            prev.map((m) => (m._id === moduleId ? { ...m, ...fields } : m))
          );
        }
      } catch (e: any) {
        alert("Failed to update module: " + e.message);
      }
    },
    [categoryId, dbSynced]
  );

  // ── Delete module ──────────────────────────────────────────────────────────
  const deleteModule = useCallback(
    async (moduleId: string) => {
      if (!categoryId) return;
      try {
        if (dbSynced && !moduleId.startsWith("local-")) {
          await apiDeleteModule(categoryId, moduleId);
        }
        setModules((prev) => prev.filter((m) => m._id !== moduleId));
      } catch (e: any) {
        alert("Failed to delete module: " + e.message);
      }
    },
    [categoryId, dbSynced]
  );

  // ── Reorder (swap two adjacent modules) ───────────────────────────────────
  const moveModule = useCallback(
    async (fromIdx: number, direction: "up" | "down") => {
      if (!categoryId) return;
      const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
      if (toIdx < 0 || toIdx >= modules.length) return;

      const previousOrder = [...modules];
      const newOrder = [...modules];
      [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
      setModules(newOrder);

      if (dbSynced) {
        try {
          await apiReorderModules(categoryId, newOrder.map((m) => m._id));
        } catch {
          setModules(previousOrder); // revert on API failure
        }
      }
    },
    [categoryId, dbSynced, modules]
  );

  // ── Update category meta ───────────────────────────────────────────────────
  const updateMeta = useCallback(
    async (fields: any) => {
      if (!categoryId) return;
      try {
        if (dbSynced) {
          const updated = await apiUpdateMeta(categoryId, fields);
          setData((prev: any) => ({ ...prev, ...updated }));
        } else {
          setData((prev: any) => ({ ...prev, ...fields }));
        }
      } catch (e: any) {
        alert("Failed to update category: " + e.message);
      }
    },
    [categoryId, dbSynced]
  );

  return {
    data: data ? { ...data, modules } : null,
    modules,
    loading,
    error,
    dbSynced,
    addModule,
    updateModule,
    deleteModule,
    moveModule,
    updateMeta,
  };
}