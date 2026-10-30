"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  SystemSettings,
  CompanyProfile,
  CatalogProduct,
  BankProfile,
  DEFAULT_COMPANY_PROFILES,
  DEFAULT_BANK_PROFILES,
} from "@/types/settings";
import {
  fetchSettings,
  updateSettings,
  downloadFullSystemBackup,
  restoreSystemBackupFromFile,
  logoutAdminSession,
} from "@/lib/settings-storage";
import { getAllInvoices } from "@/lib/storage";
import {
  X,
  Building2,
  Package,
  Landmark,
  Database,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Check,
  Download,
  Upload,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: SystemSettings) => void;
}

type TabType = "company" | "products" | "bank" | "backup" | "security";

export default function SettingsModal({ isOpen, onClose, onSettingsChanged }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("company");
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Editing state for Company Profiles
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);
  const [isNewCompany, setIsNewCompany] = useState(false);

  // Editing state for Catalog Products
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Editing state for Bank Profiles
  const [editingBank, setEditingBank] = useState<BankProfile | null>(null);
  const [isNewBank, setIsNewBank] = useState(false);

  // Backup & Restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [isRestoring, setIsRestoring] = useState(false);

  // Load settings on open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchSettings()
        .then((s) => {
          setSettings(s);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveSettings = async (newSettings: SystemSettings) => {
    setSaving(true);
    try {
      const saved = await updateSettings(newSettings);
      setSettings(saved);
      if (onSettingsChanged) onSettingsChanged(saved);
      showToast("Settings updated & synced across all devices!");
    } catch {
      showToast("Error saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  /* ──────────────────────────────────────────────────────────────────────────
   * COMPANY PROFILES HANDLERS
   * ────────────────────────────────────────────────────────────────────────── */
  const handleSaveCompanyProfile = () => {
    if (!settings || !editingCompany) return;
    if (!editingCompany.profileName.trim() || !editingCompany.header.companyName.trim()) {
      alert("Please enter a Profile Name and Company Name.");
      return;
    }

    let updatedProfiles = [...settings.companyProfiles];
    if (isNewCompany) {
      updatedProfiles.push(editingCompany);
    } else {
      updatedProfiles = updatedProfiles.map((p) =>
        p.id === editingCompany.id ? editingCompany : p
      );
    }

    // If marked default or if only 1 profile, make it default
    if (editingCompany.isDefault || updatedProfiles.length === 1) {
      updatedProfiles = updatedProfiles.map((p) => ({
        ...p,
        isDefault: p.id === editingCompany.id,
      }));
    }

    const updated = { ...settings, companyProfiles: updatedProfiles };
    handleSaveSettings(updated);
    setEditingCompany(null);
  };

  const handleDeleteCompanyProfile = (id: string) => {
    if (!settings) return;
    if (settings.companyProfiles.length <= 1) {
      alert("You must keep at least one company header profile.");
      return;
    }
    if (confirm("Delete this company header profile?")) {
      const filtered = settings.companyProfiles.filter((p) => p.id !== id);
      if (!filtered.some((p) => p.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      handleSaveSettings({ ...settings, companyProfiles: filtered });
    }
  };

  const handleSetDefaultCompanyProfile = (id: string) => {
    if (!settings) return;
    const updated = settings.companyProfiles.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    handleSaveSettings({ ...settings, companyProfiles: updated });
  };

  /* ──────────────────────────────────────────────────────────────────────────
   * CATALOG PRODUCTS HANDLERS
   * ────────────────────────────────────────────────────────────────────────── */
  const handleSaveProduct = () => {
    if (!settings || !editingProduct) return;
    if (!editingProduct.description.trim()) {
      alert("Please enter product description.");
      return;
    }

    let list = [...settings.productCatalog];
    if (isNewProduct) {
      list.push(editingProduct);
    } else {
      list = list.map((p) => (p.id === editingProduct.id ? editingProduct : p));
    }

    handleSaveSettings({ ...settings, productCatalog: list });
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (!settings) return;
    if (confirm("Delete this product from catalog?")) {
      const list = settings.productCatalog.filter((p) => p.id !== id);
      handleSaveSettings({ ...settings, productCatalog: list });
    }
  };

  const handleAutoPopulateProducts = () => {
    if (!settings) return;
    const pastInvoices = getAllInvoices();
    const seen = new Set<string>();
    const extracted: CatalogProduct[] = [];

    pastInvoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const key = item.description.trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          extracted.push({
            id: uuidv4(),
            code: `PROD-${extracted.length + 1}`,
            description: item.description,
            specifications: item.specifications || "",
            hsnSac: item.hsnSac || "",
            unit: item.unit || "Nos",
            rate: Number(item.rate) || 0,
          });
        }
      });
    });

    if (extracted.length === 0) {
      showToast("No products found in past invoices yet.", "error");
      return;
    }

    const merged = [...settings.productCatalog];
    extracted.forEach((item) => {
      if (!merged.some((m) => m.description.toLowerCase() === item.description.toLowerCase())) {
        merged.push(item);
      }
    });

    handleSaveSettings({ ...settings, productCatalog: merged });
    showToast(`Added ${extracted.length} items from past bills to catalog!`);
  };

  /* ──────────────────────────────────────────────────────────────────────────
   * BANK PROFILES HANDLERS
   * ────────────────────────────────────────────────────────────────────────── */
  const handleSaveBankProfile = () => {
    if (!settings || !editingBank) return;
    if (!editingBank.profileName.trim() || !editingBank.bankDetails.bankName.trim()) {
      alert("Please enter Profile Name and Bank Name.");
      return;
    }

    let list = [...settings.bankProfiles];
    if (isNewBank) {
      list.push(editingBank);
    } else {
      list = list.map((b) => (b.id === editingBank.id ? editingBank : b));
    }

    if (editingBank.isDefault || list.length === 1) {
      list = list.map((b) => ({ ...b, isDefault: b.id === editingBank.id }));
    }

    handleSaveSettings({ ...settings, bankProfiles: list });
    setEditingBank(null);
  };

  const handleDeleteBankProfile = (id: string) => {
    if (!settings) return;
    if (settings.bankProfiles.length <= 1) {
      alert("You must keep at least one bank account profile.");
      return;
    }
    if (confirm("Delete this bank profile?")) {
      const filtered = settings.bankProfiles.filter((b) => b.id !== id);
      if (!filtered.some((b) => b.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      handleSaveSettings({ ...settings, bankProfiles: filtered });
    }
  };

  const handleSetDefaultBank = (id: string) => {
    if (!settings) return;
    const list = settings.bankProfiles.map((b) => ({
      ...b,
      isDefault: b.id === id,
    }));
    handleSaveSettings({ ...settings, bankProfiles: list });
  };

  /* ──────────────────────────────────────────────────────────────────────────
   * BACKUP & RESUME HANDLERS
   * ────────────────────────────────────────────────────────────────────────── */
  const handleDownloadBackup = async () => {
    try {
      await downloadFullSystemBackup();
      showToast("Full system backup (.json) downloaded!");
    } catch {
      showToast("Error downloading backup.", "error");
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      alert("Please select a JSON backup file first.");
      return;
    }

    if (
      restoreMode === "replace" &&
      !confirm("Warning: REPLACE mode will overwrite existing bills with the backup file. Continue?")
    ) {
      return;
    }

    setIsRestoring(true);
    try {
      const result = await restoreSystemBackupFromFile(restoreFile, restoreMode);
      showToast(result.message);
      // Reload current settings & notify parent
      const updated = await fetchSettings();
      setSettings(updated);
      if (onSettingsChanged) onSettingsChanged(updated);
      setRestoreFile(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] max-h-[800px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* ── HEADER ── */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              ⚙️
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base leading-tight">
                System Settings &amp; Master Data
              </h2>
              <p className="text-slate-400 text-xs">
                Manage company profiles, item catalogs, banks, backup, and sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toast && (
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-semibold animate-in fade-in ${
                  toast.type === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {toast.text}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── TABS NAVIGATION BAR ── */}
        <div className="flex border-b border-slate-200 bg-white px-5 overflow-x-auto shrink-0 gap-1 sm:gap-2">
          {[
            { id: "company", label: "Company Headers", icon: Building2 },
            { id: "products", label: "Product Catalog", icon: Package },
            { id: "bank", label: "Bank & Terms", icon: Landmark },
            { id: "backup", label: "Backup & Resume", icon: Database },
            { id: "security", label: "Security & Logout", icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setEditingCompany(null);
                  setEditingProduct(null);
                  setEditingBank(null);
                }}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-amber-500 text-amber-600 bg-amber-50/40"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT BODY ── */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amber-500" />
              <p className="text-xs">Loading settings...</p>
            </div>
          ) : !settings ? (
            <div className="text-center py-12 text-slate-500 text-xs">Failed to load settings.</div>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────────
               * TAB 1: COMPANY PROFILES
               * ───────────────────────────────────────────────────────────── */}
              {activeTab === "company" && (
                <div className="space-y-4">
                  {!editingCompany ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            Company Header &amp; Bill Profiles
                          </h3>
                          <p className="text-slate-500 text-xs">
                            Create multiple company headers. Select one as default for billing.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCompany({
                              id: uuidv4(),
                              profileName: "New Company Profile",
                              isDefault: false,
                              header: { ...DEFAULT_COMPANY_PROFILES[0].header },
                            });
                            setIsNewCompany(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Profile</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {settings.companyProfiles.map((prof) => (
                          <div
                            key={prof.id}
                            className={`p-4 rounded-xl border bg-white shadow-xs relative transition-all ${
                              prof.isDefault
                                ? "border-amber-400 ring-2 ring-amber-400/20"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {prof.profileName}
                              </span>
                              {prof.isDefault ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Default
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultCompanyProfile(prof.id)}
                                  className="text-[11px] text-amber-600 hover:underline font-semibold"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>

                            <p className="font-bold text-slate-800 text-xs">{prof.header.companyName}</p>
                            <p className="text-slate-400 text-[11px] truncate">{prof.header.address}</p>
                            <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                              <span>GST: <strong>{prof.header.gstin}</strong></span>
                              <span>State: {prof.header.stateCode}</span>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCompany({ ...prof });
                                  setIsNewCompany(false);
                                }}
                                className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md text-xs font-semibold flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              {settings.companyProfiles.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCompanyProfile(prof.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Edit Company Profile Form */
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {isNewCompany ? "Add Company Profile" : "Edit Company Profile"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingCompany(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Profile Label / Nickname *
                          </label>
                          <input
                            type="text"
                            value={editingCompany.profileName}
                            onChange={(e) =>
                              setEditingCompany({ ...editingCompany, profileName: e.target.value })
                            }
                            placeholder="e.g. Primary HQ or Unit 2"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Company Name *
                          </label>
                          <input
                            type="text"
                            value={editingCompany.header.companyName}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, companyName: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Tagline / Motto
                          </label>
                          <input
                            type="text"
                            value={editingCompany.header.tagline}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, tagline: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Invoice Title
                          </label>
                          <input
                            type="text"
                            value={editingCompany.header.invoiceTitle}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, invoiceTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-semibold mb-1">
                            Full Company Address
                          </label>
                          <textarea
                            rows={2}
                            value={editingCompany.header.address}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, address: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">GSTIN</label>
                          <input
                            type="text"
                            value={editingCompany.header.gstin}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, gstin: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            State Code
                          </label>
                          <input
                            type="text"
                            value={editingCompany.header.stateCode}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, stateCode: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Phone / Mobile
                          </label>
                          <input
                            type="text"
                            value={editingCompany.header.phone}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, phone: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Email</label>
                          <input
                            type="email"
                            value={editingCompany.header.email}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                header: { ...editingCompany.header, email: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={editingCompany.isDefault}
                            onChange={(e) =>
                              setEditingCompany({ ...editingCompany, isDefault: e.target.checked })
                            }
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>Set as Default Header for new bills</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleSaveCompanyProfile}
                          disabled={saving}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
               * TAB 2: PRODUCT CATALOG
               * ───────────────────────────────────────────────────────────── */}
              {activeTab === "products" && (
                <div className="space-y-4">
                  {!editingProduct ? (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            Master Product Catalog &amp; Specifications
                          </h3>
                          <p className="text-slate-500 text-xs">
                            Define master products. When typing item code or description during billing, specifications &amp; rates are prefilled!
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAutoPopulateProducts}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-600 bg-white border border-slate-300 hover:border-amber-400 font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-2xs"
                            title="Auto-extract items from past invoices"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Import from Bills</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct({
                                id: uuidv4(),
                                code: `ITEM-${settings.productCatalog.length + 1}`,
                                description: "",
                                specifications: "",
                                hsnSac: "",
                                unit: "Nos",
                                rate: 0,
                              });
                              setIsNewProduct(true);
                            }}
                            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Product</span>
                          </button>
                        </div>
                      </div>

                      {settings.productCatalog.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                          <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="font-bold text-slate-800 text-xs">No products in catalog yet</p>
                          <p className="text-slate-400 text-[11px] mt-1 mb-3">
                            Add your frequent items or click &quot;Import from Bills&quot; to auto-populate from past invoices.
                          </p>
                          <button
                            type="button"
                            onClick={handleAutoPopulateProducts}
                            className="text-xs text-amber-600 hover:underline font-bold"
                          >
                            Auto-Import Items from Saved Bills
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                              <tr>
                                <th className="px-3.5 py-2.5">Code</th>
                                <th className="px-3.5 py-2.5">Description &amp; Specifications</th>
                                <th className="px-3.5 py-2.5">HSN/SAC</th>
                                <th className="px-3.5 py-2.5">Unit</th>
                                <th className="px-3.5 py-2.5 text-right">Default Rate</th>
                                <th className="px-3.5 py-2.5 text-center w-20">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {settings.productCatalog.map((prod) => (
                                <tr key={prod.id} className="hover:bg-slate-50/80">
                                  <td className="px-3.5 py-2.5 font-bold font-mono text-amber-600">
                                    {prod.code}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <p className="font-semibold text-slate-900">{prod.description}</p>
                                    {prod.specifications && (
                                      <p className="text-slate-400 text-[11px] truncate max-w-sm">
                                        {prod.specifications}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-slate-600">{prod.hsnSac || "-"}</td>
                                  <td className="px-3.5 py-2.5 text-slate-600">{prod.unit}</td>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                    ₹{Number(prod.rate).toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProduct({ ...prod });
                                          setIsNewProduct(false);
                                        }}
                                        className="p-1 text-slate-500 hover:text-amber-600"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteProduct(prod.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Edit Product Form */
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {isNewProduct ? "Add Catalog Product" : "Edit Catalog Product"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Item Code / SKU *
                          </label>
                          <input
                            type="text"
                            value={editingProduct.code}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, code: e.target.value })
                            }
                            placeholder="e.g. JSS-101"
                            className="w-full px-3 py-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            HSN / SAC Code
                          </label>
                          <input
                            type="text"
                            value={editingProduct.hsnSac}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, hsnSac: e.target.value })
                            }
                            placeholder="e.g. 8466"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-semibold mb-1">
                            Item Description *
                          </label>
                          <input
                            type="text"
                            value={editingProduct.description}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, description: e.target.value })
                            }
                            placeholder="e.g. Industrial Valve Assembly"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-semibold mb-1">
                            Detailed Specifications
                          </label>
                          <textarea
                            rows={2}
                            value={editingProduct.specifications}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                specifications: e.target.value,
                              })
                            }
                            placeholder="e.g. Stainless steel 316, pressure rating 300 PSI"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Unit</label>
                          <input
                            type="text"
                            value={editingProduct.unit}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, unit: e.target.value })
                            }
                            placeholder="Nos, Sets, Mtr, Kg..."
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Default Rate (₹)
                          </label>
                          <input
                            type="number"
                            value={editingProduct.rate || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                rate: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleSaveProduct}
                          disabled={saving}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Product</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
               * TAB 3: BANK & TERMS PROFILES
               * ───────────────────────────────────────────────────────────── */}
              {activeTab === "bank" && (
                <div className="space-y-4">
                  {!editingBank ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            Bank Accounts &amp; Terms Profiles
                          </h3>
                          <p className="text-slate-500 text-xs">
                            Manage multiple bank accounts and custom terms &amp; conditions. Select one as default.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBank({
                              id: uuidv4(),
                              profileName: "Alternate Bank Account",
                              isDefault: false,
                              bankDetails: { ...DEFAULT_BANK_PROFILES[0].bankDetails },
                              termsAndConditions: DEFAULT_BANK_PROFILES[0].termsAndConditions,
                            });
                            setIsNewBank(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Bank Profile</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {settings.bankProfiles.map((prof) => (
                          <div
                            key={prof.id}
                            className={`p-4 rounded-xl border bg-white shadow-xs relative transition-all ${
                              prof.isDefault
                                ? "border-amber-400 ring-2 ring-amber-400/20"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {prof.profileName}
                              </span>
                              {prof.isDefault ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Default
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultBank(prof.id)}
                                  className="text-[11px] text-amber-600 hover:underline font-semibold"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>

                            <p className="font-bold text-slate-800 text-xs">
                              {prof.bankDetails.bankName}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              A/C: <span className="font-mono font-bold">{prof.bankDetails.accountNo}</span>
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              IFSC: <span className="font-mono">{prof.bankDetails.ifscCode}</span>
                            </p>
                            <p className="text-slate-400 text-[10px] truncate">{prof.bankDetails.branch}</p>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBank({ ...prof });
                                  setIsNewBank(false);
                                }}
                                className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md text-xs font-semibold flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              {settings.bankProfiles.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBankProfile(prof.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Edit Bank Form */
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {isNewBank ? "Add Bank Profile" : "Edit Bank Profile"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingBank(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Profile Name *
                          </label>
                          <input
                            type="text"
                            value={editingBank.profileName}
                            onChange={(e) =>
                              setEditingBank({ ...editingBank, profileName: e.target.value })
                            }
                            placeholder="e.g. Primary Union Bank"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            value={editingBank.bankDetails.bankName}
                            onChange={(e) =>
                              setEditingBank({
                                ...editingBank,
                                bankDetails: { ...editingBank.bankDetails, bankName: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            value={editingBank.bankDetails.accountHolder}
                            onChange={(e) =>
                              setEditingBank({
                                ...editingBank,
                                bankDetails: {
                                  ...editingBank.bankDetails,
                                  accountHolder: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            value={editingBank.bankDetails.accountNo}
                            onChange={(e) =>
                              setEditingBank({
                                ...editingBank,
                                bankDetails: { ...editingBank.bankDetails, accountNo: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            value={editingBank.bankDetails.ifscCode}
                            onChange={(e) =>
                              setEditingBank({
                                ...editingBank,
                                bankDetails: { ...editingBank.bankDetails, ifscCode: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg font-mono uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Branch Location
                          </label>
                          <input
                            type="text"
                            value={editingBank.bankDetails.branch}
                            onChange={(e) =>
                              setEditingBank({
                                ...editingBank,
                                bankDetails: { ...editingBank.bankDetails, branch: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-semibold mb-1">
                            Standard Terms &amp; Conditions
                          </label>
                          <textarea
                            rows={3}
                            value={editingBank.termsAndConditions}
                            onChange={(e) =>
                              setEditingBank({ ...editingBank, termsAndConditions: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={editingBank.isDefault}
                            onChange={(e) =>
                              setEditingBank({ ...editingBank, isDefault: e.target.checked })
                            }
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>Set as Default Bank Account for new bills</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleSaveBankProfile}
                          disabled={saving}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Bank Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
               * TAB 4: BACKUP & RESUME (IMPORT / EXPORT SYSTEM DATA)
               * ───────────────────────────────────────────────────────────── */}
              {activeTab === "backup" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Import &amp; Export Whole System Data
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Export your entire database (all bills, products, and profiles) to a single backup file or restore old data anytime.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export Card */}
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Export Full System Backup</h4>
                          <p className="text-slate-400 text-[11px]">
                            Download complete JSON backup containing all bills and settings.
                          </p>
                        </div>
                      </div>

                      <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-lg">
                        <li>All invoices &amp; bills metadata</li>
                        <li>Company header profiles</li>
                        <li>Master product catalog items</li>
                        <li>Bank account profiles &amp; terms</li>
                      </ul>

                      <button
                        type="button"
                        onClick={handleDownloadBackup}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Full Backup (.json)</span>
                      </button>
                    </div>

                    {/* Import / Resume Card */}
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Restore / Resume from Backup</h4>
                          <p className="text-slate-400 text-[11px]">
                            Upload an existing backup file to restore system state.
                          </p>
                        </div>
                      </div>

                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                        className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 w-full"
                      />

                      <div className="flex items-center gap-4 text-xs pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === "merge"}
                            onChange={() => setRestoreMode("merge")}
                            className="text-amber-500"
                          />
                          <span>Merge (Keep both)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === "replace"}
                            onChange={() => setRestoreMode("replace")}
                            className="text-rose-600"
                          />
                          <span>Replace all</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleRestoreBackup}
                        disabled={!restoreFile || isRestoring}
                        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Restoring System Data...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Restore &amp; Resume System</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
               * TAB 5: SECURITY & LOGOUT (INCLUDING REMOTE ALL-DEVICES LOGOUT)
               * ───────────────────────────────────────────────────────────── */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Admin Session &amp; Security Management
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Sign out of this device or remotely sign out across all phones, tablets, and computers.
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Current Administrator</p>
                        <p className="text-slate-400 text-[11px]">Logged in as <strong>adminjss</strong></p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active Session
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                      {/* Logout This Device */}
                      <button
                        type="button"
                        onClick={() => logoutAdminSession(false)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-lg text-xs transition-colors border border-slate-200"
                      >
                        <LogOut className="w-4 h-4 text-slate-600" />
                        <span>Logout This Device</span>
                      </button>

                      {/* Logout All Devices Remotely */}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to log out of ALL devices remotely? All active sessions on other phones and laptops will be invalidated."
                            )
                          ) {
                            logoutAdminSession(true);
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Logout All Devices</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
