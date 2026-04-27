/**
 * useEducation.ts — v4 (production-ready)
 *
 * FIX vs v3:
 *  addModule now returns the saved module object so the caller (handleAddModule)
 *  can immediately use the new module's _id to upload cert PDFs via the cert-pdfs
 *  endpoint — without needing a page reload to discover the _id.
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
  // FIX: returns the saved module so the caller can get the new _id for cert-pdf uploads
  const addModule = useCallback(
    async (newMod: any, pdfFile?: File | null): Promise<any | null> => {
      if (!categoryId) return null;
      try {
        if (dbSynced) {
          // API returns the saved module object directly (including _id)
          const savedModule = await apiAddModule(categoryId, newMod, pdfFile);
          setModules((prev) => [...prev, savedModule]);
          return savedModule; // ← FIXED: was missing return, caller couldn't get _id
        } else {
          // Not seeded yet — local only (will vanish on refresh — prompt to seed)
          const localMod = { ...newMod, _id: `local-${Date.now()}` };
          setModules((prev) => [...prev, localMod]);
          return localMod;
        }
      } catch (e: any) {
        alert("Failed to add module: " + e.message);
        return null;
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