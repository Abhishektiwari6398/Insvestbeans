/**
 * educationApi.ts
 *
 * CHANGES vs original:
 *  1. addModule    → now sends FormData (supports optional PDF file upload)
 *  2. updateModule → now sends FormData (supports optional new PDF file upload)
 *  3. uploadModulePdf   → NEW: upload/replace just the PDF for a module
 *  4. deleteModulePdf   → NEW: delete a module's PDF from Cloudinary
 *  5. apiFetch stays for JSON-only calls; apiFetchForm added for multipart
 *
 * Place in: src/api/educationApi.ts  (or src/services/api/educationApi.ts)
 */

const BASE           = import.meta.env.VITE_API_URL || "";
const ADMIN_SEGMENT  = import.meta.env.VITE_ADMIN_SEGMENT || "xp-insights-42";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Standard JSON fetch */
async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "API error");
  return json.data ?? json;
}

/**
 * Multipart FormData fetch — do NOT set Content-Type manually;
 * browser sets it automatically with the correct boundary.
 */
async function apiFetchForm(url: string, body: FormData, method = "POST") {
  const res = await fetch(`${BASE}${url}`, {
    method,
    credentials: "include",
    body,
    // ⚠️ No "Content-Type" header — browser fills it in with boundary
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "API error");
  return json.data ?? json;
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

/** List all category meta (no modules). Used by EducationView listing page. */
export const fetchCategories = () =>
  apiFetch("/api/v1/education/categories");

/** Get one full category including all modules. Used by EducationDetailView. */
export const fetchCategory = (categoryId: string) =>
  apiFetch(`/api/v1/education/categories/${categoryId}`);

// ── ADMIN ─────────────────────────────────────────────────────────────────────

/** Seed the DB from the static CATEGORY_DATA object (one-time import). */
export const seedEducation = (categories: Record<string, any>) =>
  apiFetch(`/api/v1/${ADMIN_SEGMENT}/education/seed`, {
    method: "POST",
    body: JSON.stringify({ categories }),
  });

/** Update category meta fields (title, description, accent, etc.). */
export const updateCategoryMeta = (categoryId: string, fields: Record<string, any>) =>
  apiFetch(`/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });

/**
 * Add a new module to a category.
 *
 * @param categoryId  - category slug (e.g. "financial-ebooks")
 * @param moduleData  - module fields (title, subtitle, description, level, isPaid,
 *                      videoUrl, highlights[], previewTopics[])
 * @param pdfFile     - optional PDF File object (≥ 1 MB, ≤ 50 MB)
 */
export const addModule = (
  categoryId: string,
  moduleData: Record<string, any>,
  pdfFile?: File | null
) => {
  const form = new FormData();

  // Append all scalar fields
  for (const [key, val] of Object.entries(moduleData)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      // Send arrays as JSON string — controller parses them back
      form.append(key, JSON.stringify(val));
    } else {
      form.append(key, String(val));
    }
  }

  // Append PDF file if provided
  if (pdfFile) {
    form.append("pdf", pdfFile, pdfFile.name);
  }

  return apiFetchForm(
    `/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}/modules`,
    form,
    "POST"
  );
};

/**
 * Edit an existing module.
 *
 * @param categoryId  - category slug
 * @param moduleId    - MongoDB _id of the module
 * @param fields      - fields to update
 * @param pdfFile     - optional new PDF File (replaces existing PDF on Cloudinary)
 */
export const updateModule = (
  categoryId: string,
  moduleId: string,
  fields: Record<string, any>,
  pdfFile?: File | null
) => {
  const form = new FormData();

  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      form.append(key, JSON.stringify(val));
    } else {
      form.append(key, String(val));
    }
  }

  if (pdfFile) {
    form.append("pdf", pdfFile, pdfFile.name);
  }

  return apiFetchForm(
    `/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}/modules/${moduleId}`,
    form,
    "PATCH"
  );
};

/** Upload / replace just the PDF for a module (dedicated endpoint). */
export const uploadModulePdf = (
  categoryId: string,
  moduleId: string,
  pdfFile: File
) => {
  const form = new FormData();
  form.append("pdf", pdfFile, pdfFile.name);
  return apiFetchForm(
    `/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}/modules/${moduleId}/pdf`,
    form,
    "POST"
  );
};

/** Delete a module's PDF from Cloudinary (clears pdfUrl on the module). */
export const deleteModulePdf = (categoryId: string, moduleId: string) =>
  apiFetch(
    `/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}/modules/${moduleId}/pdf`,
    { method: "DELETE" }
  );

/** Delete a module. */
export const deleteModule = (categoryId: string, moduleId: string) =>
  apiFetch(
    `/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}/modules/${moduleId}`,
    { method: "DELETE" }
  );

/** Reorder modules — pass array of _id strings in desired order. */
export const reorderModules = (categoryId: string, orderedIds: string[]) =>
  apiFetch(
    `/api/v1/${ADMIN_SEGMENT}/education/categories/${categoryId}/modules/reorder`,
    { method: "PATCH", body: JSON.stringify({ orderedIds }) }
  );