"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock,
  Package,
  Plus,
  Trash2,
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  Database,
  ShieldAlert,
  Images,
  Upload,
  Camera,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  FolderKanban,
  Megaphone,
  X,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatMXN } from "@/lib/whatsapp";
import {
  AIDetectedProductItem,
  AIProductAnalysisResponse,
  Category,
  CategorySlug,
  Product,
  StoreBanner,
  StoreGalleryPhoto,
} from "@/types/store";
import {
  ensureInitialCatalogSeeded,
  isSupabaseConfigured,
  supabase,
  uploadImageToSupabaseStorage,
  verifyOrBootstrapAdmin,
} from "@/lib/supabase";
import {
  compressImageForAI,
  MAX_PRODUCT_IMAGES,
  optimizeFileForStorage,
} from "@/lib/imageUtils";

interface ServerStatus {
  supabaseConfigured: boolean;
  aiConfigured: boolean;
  aiProvider: "gemini" | "openai" | null;
  missingVariables: string[];
}

export default function AdminPage() {
  const {
    products,
    categories,
    storeGallery,
    banners,
    orders,
    refreshStoreData,
    upsertProduct,
    deleteProduct,
    upsertCategory,
    updateGalleryPhoto,
    upsertBanner,
    updateOrderStatus,
    showToast,
  } = useStore();

  // Estado de autenticación real con Supabase Auth
  const [authChecking, setAuthChecking] = useState(isSupabaseConfigured);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);

  // Formulario de inicio de sesión seguro (sin auto-registro público para evitar apropiación del panel)
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  // Estado del servidor (solo se consulta una vez autenticada la administradora)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  // Navegación del panel administrativo
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "banners_gallery" | "orders" | "system"
  >("products");

  // Estados de edición manual
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  const [editingGallery, setEditingGallery] = useState<StoreGalleryPhoto | null>(null);
  const [savingGallery, setSavingGallery] = useState(false);

  const [editingBanner, setEditingBanner] = useState<StoreBanner | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);

  // Estados del asistente "Agregar producto con IA"
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiFiles, setAiFiles] = useState<File[]>([]);
  const [aiPreviews, setAiPreviews] = useState<string[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIProductAnalysisResponse | null>(null);
  const [selectedAiItem, setSelectedAiItem] = useState<AIDetectedProductItem | null>(null);
  const [aiDraftName, setAiDraftName] = useState("");
  const [aiDraftSubtitle, setAiDraftSubtitle] = useState("");
  const [aiDraftCategory, setAiDraftCategory] = useState<CategorySlug>("regalos");
  const [aiDraftDescription, setAiDraftDescription] = useState("");
  const [aiDraftPrice, setAiDraftPrice] = useState("");
  const [aiDraftStock, setAiDraftStock] = useState("");
  const [aiPublishing, setAiPublishing] = useState(false);

  // Consultar estado real del servidor únicamente para sesión administrativa autorizada
  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((data: ServerStatus) => setServerStatus(data))
      .catch(() => {});
  }, [isAuthorizedAdmin]);

  // Verificar sesión activa de Supabase Auth
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setAuthChecking(false);
      return;
    }

    let mounted = true;

    async function checkCurrentSession() {
      if (!supabase) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setIsAuthorizedAdmin(false);
            setAdminEmail(null);
            setAccessToken(null);
            setAuthChecking(false);
          }
          return;
        }

        const isAdmin = await verifyOrBootstrapAdmin();
        if (mounted) {
          if (isAdmin) {
            setIsAuthorizedAdmin(true);
            setAdminEmail(session.user.email || "Administradora");
            setAccessToken(session.access_token);
            await ensureInitialCatalogSeeded();
            await refreshStoreData(true);
          } else {
            setAuthError(
              "Tu cuenta no cuenta con permisos de administración autorizados."
            );
            await supabase.auth.signOut();
            setIsAuthorizedAdmin(false);
          }
          setAuthChecking(false);
        }
      } catch {
        if (mounted) setAuthChecking(false);
      }
    }

    checkCurrentSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        if (mounted) {
          setIsAuthorizedAdmin(false);
          setAdminEmail(null);
          setAccessToken(null);
        }
        return;
      }
      setAccessToken(session.access_token);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshStoreData]);

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Panel administrativo temporalmente no disponible.");
      return;
    }

    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });
      if (error) throw error;

      const ok = await verifyOrBootstrapAdmin();
      if (!ok) {
        await supabase.auth.signOut();
        throw new Error(
          "Acceso denegado: esta cuenta no tiene autorización administrativa."
        );
      }

      setIsAuthorizedAdmin(true);
      setAdminEmail(data.user?.email || emailInput.trim());
      setAccessToken(data.session?.access_token || null);
      await ensureInitialCatalogSeeded();
      await refreshStoreData(true);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "No fue posible iniciar sesión."
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthorizedAdmin(false);
    setAdminEmail(null);
    setAccessToken(null);
  };

  // ============================================================================
  // SUBIDA DE HASTA 5 FOTOGRAFÍAS POR PRODUCTO (CÁMARA O GALERÍA) A SUPABASE STORAGE
  // ============================================================================
  const handleProductPhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !editingProduct) return;

    const currentImages = editingProduct.images || [];
    const remainingSlots = MAX_PRODUCT_IMAGES - currentImages.length;

    if (remainingSlots <= 0) {
      showToast("Ya subiste el máximo de 5 fotografías para este producto.", "error");
      e.target.value = "";
      return;
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots);
    setUploadingPhotos(true);
    try {
      const uploadedUrls: string[] = [];
      for (const rawFile of selectedFiles) {
        const optimized = await optimizeFileForStorage(rawFile);
        const publicUrl = await uploadImageToSupabaseStorage(optimized, "products");
        uploadedUrls.push(publicUrl);
      }
      setEditingProduct((prev) => ({
        ...prev,
        images: [...(prev?.images || []), ...uploadedUrls].slice(0, MAX_PRODUCT_IMAGES),
      }));
      showToast(
        `${uploadedUrls.length} fotografía(s) subida(s) a Supabase Storage correctamente.`,
        "success"
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al subir fotografías.",
        "error"
      );
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const handleRemoveProductPhoto = (indexToRemove: number) => {
    if (!editingProduct) return;
    const updated = (editingProduct.images || []).filter((_, idx) => idx !== indexToRemove);
    setEditingProduct({ ...editingProduct, images: updated });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name?.trim()) return;

    setSavingProduct(true);
    try {
      const numericPrice =
        editingProduct.price !== undefined &&
        editingProduct.price !== null &&
        String(editingProduct.price) !== ""
          ? Number(editingProduct.price)
          : null;

      const numericStock =
        editingProduct.stock !== undefined &&
        editingProduct.stock !== null &&
        String(editingProduct.stock) !== ""
          ? Number(editingProduct.stock)
          : null;

      const cleanImages = (editingProduct.images || []).filter(Boolean).slice(0, 5);

      const newProd: Product = {
        id: editingProduct.id || `prod-${Date.now()}`,
        slug:
          editingProduct.slug ||
          `${editingProduct.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-4)}`,
        name: editingProduct.name.trim(),
        subtitle: editingProduct.subtitle?.trim() || "(Disponible en tienda)",
        description:
          editingProduct.description?.trim() ||
          "Artículo disponible en Regalos, Disfraces y Más — Los Ángeles.",
        price: numericPrice,
        promoPrice: editingProduct.promoPrice ? Number(editingProduct.promoPrice) : undefined,
        categorySlug: (editingProduct.categorySlug as CategorySlug) || "regalos",
        images:
          cleanImages.length > 0 ? cleanImages : ["/images/products/prod-box.jpg"],
        stock: numericStock,
        isFeatured: Boolean(editingProduct.isFeatured ?? true),
        isSpecialOffer: Boolean(editingProduct.isSpecialOffer),
        active: editingProduct.active ?? true,
        isDemo: false,
      };

      await upsertProduct(newProd);
      setEditingProduct(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "No se pudo guardar el producto.",
        "error"
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductVisibility = async (prod: Product) => {
    try {
      await upsertProduct({
        ...prod,
        active: !prod.active,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al cambiar visibilidad.",
        "error"
      );
    }
  };

  // ============================================================================
  // FLUJO COMPLETO: "AGREGAR PRODUCTO CON IA"
  // ============================================================================
  const openAiAssistant = () => {
    setAiFiles([]);
    setAiPreviews([]);
    setAiError(null);
    setAiResult(null);
    setSelectedAiItem(null);
    setAiDraftName("");
    setAiDraftSubtitle("");
    setAiDraftCategory("regalos");
    setAiDraftDescription("");
    setAiDraftPrice("");
    setAiDraftStock("");
    setAiModalOpen(true);
  };

  const applyDetectedItemToDraft = (item: AIDetectedProductItem) => {
    setSelectedAiItem(item);
    setAiDraftName(item.suggestedName);
    setAiDraftSubtitle(item.suggestedSubtitle);
    setAiDraftCategory(item.categorySlug);
    setAiDraftDescription(item.description);
  };

  const handleAiPhotoSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList).slice(0, MAX_PRODUCT_IMAGES - aiFiles.length);
    if (incoming.length === 0) {
      showToast("Puedes agregar hasta 5 fotografías por producto.", "info");
      e.target.value = "";
      return;
    }

    const nextFiles = [...aiFiles, ...incoming].slice(0, MAX_PRODUCT_IMAGES);
    setAiFiles(nextFiles);

    const newUrls = incoming.map((f) => URL.createObjectURL(f));
    setAiPreviews((prev) => [...prev, ...newUrls].slice(0, MAX_PRODUCT_IMAGES));
    e.target.value = "";

    // Si es la primera fotografía tomada o seleccionada, iniciar análisis visual con IA automáticamente
    if (aiFiles.length === 0 && incoming[0]) {
      await runAiVisualAnalysis(incoming[0]);
    }
  };

  const runAiVisualAnalysis = async (fileToAnalyze: File) => {
    setAiAnalyzing(true);
    setAiError(null);
    setAiResult(null);
    setSelectedAiItem(null);

    try {
      const { base64, mimeType } = await compressImageForAI(fileToAnalyze);

      const res = await fetch("/api/admin/ai-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "No fue posible analizar la imagen con IA en este momento."
        );
      }

      const analysis = data as AIProductAnalysisResponse;
      setAiResult(analysis);

      if (analysis.items.length === 1) {
        applyDetectedItemToDraft(analysis.items[0]);
      }
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "Error inesperado al comunicarse con el servicio de IA."
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handlePublishAiProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDraftName.trim()) {
      showToast("Revisa o escribe el nombre comercial antes de publicar.", "error");
      return;
    }
    if (aiFiles.length === 0) {
      showToast("Selecciona o toma al menos una fotografía del producto.", "error");
      return;
    }
    if (aiDraftPrice.trim() === "" || Number(aiDraftPrice) < 0) {
      showToast("Ingresa el precio real en MXN antes de publicar.", "error");
      return;
    }
    if (aiDraftStock.trim() === "" || Number(aiDraftStock) < 0) {
      showToast("Ingresa las existencias reales antes de publicar.", "error");
      return;
    }

    setAiPublishing(true);
    try {
      const uploadedUrls: string[] = [];
      for (const rawFile of aiFiles.slice(0, MAX_PRODUCT_IMAGES)) {
        const optimized = await optimizeFileForStorage(rawFile);
        const publicUrl = await uploadImageToSupabaseStorage(optimized, "products");
        uploadedUrls.push(publicUrl);
      }

      const slugBase = aiDraftName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
        name: aiDraftName.trim(),
        subtitle: aiDraftSubtitle.trim() || "(Disponible en tienda)",
        description: aiDraftDescription.trim(),
        price: Number(aiDraftPrice),
        categorySlug: aiDraftCategory,
        images: uploadedUrls,
        stock: Math.floor(Number(aiDraftStock)),
        isFeatured: true,
        isSpecialOffer: false,
        active: true,
        isDemo: false,
        badge: {
          text: "Nuevo",
          variant: "new",
        },
      };

      await upsertProduct(newProduct);
      setAiModalOpen(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al publicar el producto.",
        "error"
      );
    } finally {
      setAiPublishing(false);
    }
  };

  // ============================================================================
  // GUARDADO DE CATEGORÍAS, GALERÍA Y BANNERS CON SUPABASE STORAGE
  // ============================================================================
  const handleSingleImageUploadToStorage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: "gallery" | "categories" | "banners",
    onUploaded: (publicUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhotos(true);
    try {
      const optimized = await optimizeFileForStorage(file);
      const url = await uploadImageToSupabaseStorage(optimized, folder);
      onUploaded(url);
      showToast("Fotografía subida a Supabase Storage.", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al subir la fotografía.",
        "error"
      );
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSavingCategory(true);
    try {
      await upsertCategory(editingCategory);
      setEditingCategory(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al guardar categoría.",
        "error"
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveGalleryPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGallery) return;
    setSavingGallery(true);
    try {
      const orderIdx =
        storeGallery.findIndex((g) => g.id === editingGallery.id) + 1 || 1;
      await updateGalleryPhoto(editingGallery, orderIdx);
      setEditingGallery(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al guardar foto de galería.",
        "error"
      );
    } finally {
      setSavingGallery(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    setSavingBanner(true);
    try {
      await upsertBanner(editingBanner);
      setEditingBanner(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al guardar el banner.",
        "error"
      );
    } finally {
      setSavingBanner(false);
    }
  };

  // ============================================================================
  // PANTALLA DE AUTENTICACIÓN SEGURA
  // ============================================================================
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF2F7] p-4">
        <div className="bg-white rounded-3xl p-8 shadow-boutique border border-pink-200 flex flex-col items-center gap-3 text-center max-w-sm w-full">
          <Loader2 className="w-8 h-8 text-[#D81B60] animate-spin" />
          <p className="text-sm font-bold text-[#6A1B4D]">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#FDF2F7] via-[#FCEBF3] to-[#FCE4EC]">
        <div className="bg-white rounded-3xl max-w-md w-full p-7 sm:p-8 shadow-boutique border border-pink-200 text-center space-y-6">
          {/* Logotipo Oficial */}
          <div className="flex justify-center">
            <div className="bg-[#FDF2F7] p-3 rounded-2xl border border-pink-100 shadow-sm inline-flex items-center justify-center">
              <img
                src="/images/logo-header.jpg"
                alt="Regalos, Disfraces y Más — Los Ángeles"
                className="h-20 sm:h-24 w-auto object-contain rounded-xl"
              />
            </div>
          </div>

          {!isSupabaseConfigured ? (
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-pink-50 border border-pink-200 text-[#D81B60] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#6A1B4D]">
                Panel administrativo temporalmente no disponible
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Regalos, Disfraces y Más — Los Ángeles
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="btn-shimmer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white text-xs sm:text-sm font-bold shadow-boutique hover:shadow-boutiqueHover transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a la tienda</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-left">
              <div className="text-center space-y-1.5">
                <h1 className="text-xl font-extrabold text-[#6A1B4D]">
                  Panel Administrativo — Los Ángeles
                </h1>
                <p className="text-xs text-gray-600">
                  Inicia sesión con tu cuenta de administradora autorizada.
                </p>
              </div>

              <form onSubmit={handleSupabaseAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ingresa tu contraseña..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40"
                  />
                </div>

                {authError && (
                  <p className="text-xs font-bold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="btn-shimmer w-full py-3 rounded-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white text-sm font-bold shadow-md hover:brightness-105 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Iniciar sesión</span>
                </button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D81B60] hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a la tienda</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // PANEL PRINCIPAL DE LA ADMINISTRADORA (OPTIMIZADO PARA CELULAR Y ESCRITORIO)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#FDF2F7]/70 pb-16">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-pink-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-header.jpg"
            alt="Los Ángeles"
            className="h-9 sm:h-10 w-auto rounded-lg border border-pink-100"
          />
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#6A1B4D] leading-tight">
              Administración — Los Ángeles
            </h1>
            <p className="text-[11px] text-gray-500 truncate max-w-[210px] sm:max-w-none">
              Sesión activa: {adminEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAiAssistant}
            className="btn-shimmer inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white text-xs font-bold shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>Agregar producto con IA</span>
          </button>

          <Link
            href="/"
            className="px-3 py-2 rounded-full border border-pink-200 bg-pink-50 text-[#6A1B4D] text-xs font-bold hover:bg-pink-100 transition"
          >
            Ver tienda
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-gray-800 text-white text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3.5 sm:p-6 space-y-5">
        {/* Navegación móvil deslizable por pestañas */}
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition ${
              activeTab === "products"
                ? "bg-[#D81B60] text-white shadow"
                : "bg-white text-[#6A1B4D] border border-pink-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition ${
              activeTab === "categories"
                ? "bg-[#D81B60] text-white shadow"
                : "bg-white text-[#6A1B4D] border border-pink-200"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Categorías ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("banners_gallery")}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition ${
              activeTab === "banners_gallery"
                ? "bg-[#D81B60] text-white shadow"
                : "bg-white text-[#6A1B4D] border border-pink-200"
            }`}
          >
            <Images className="w-4 h-4" />
            <span>Banners y Galería ({storeGallery.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition ${
              activeTab === "orders"
                ? "bg-[#D81B60] text-white shadow"
                : "bg-white text-[#6A1B4D] border border-pink-200"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition ${
              activeTab === "system"
                ? "bg-[#D81B60] text-white shadow"
                : "bg-white text-[#6A1B4D] border border-pink-200"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Estado y Seguridad</span>
          </button>
        </div>

        {/* ===================================================================
            PESTAÑA 1: PRODUCTOS E INVENTARIO
           =================================================================== */}
        {activeTab === "products" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-pink-200 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-[#6A1B4D]">
                  Catálogo e Inventario Real ({products.length} productos)
                </h2>
                <p className="text-xs text-gray-500">
                  Toma hasta 5 fotografías por artículo con tu celular, usa IA para describirlo o
                  regístralo manualmente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openAiAssistant}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#E91E63] to-[#AD1457] text-white text-xs font-bold shadow"
                >
                  <Sparkles className="w-4 h-4 text-[#FDE68A]" />
                  <span>Agregar producto con IA</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      name: "",
                      subtitle: "(Disponible en tienda)",
                      description: "",
                      price: null,
                      stock: null,
                      categorySlug: "peluches",
                      isFeatured: true,
                      isSpecialOffer: false,
                      active: true,
                      images: [],
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-pink-50 border border-pink-200 text-[#6A1B4D] text-xs font-bold hover:bg-pink-100"
                >
                  <Plus className="w-4 h-4 text-[#D81B60]" />
                  <span>Registro Manual</span>
                </button>
              </div>
            </div>

            {/* Formulario de Edición / Creación Manual de Producto (Hasta 5 fotos) */}
            {editingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#D81B60] shadow-boutique space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#6A1B4D]">
                    {editingProduct.id ? "Editar Producto" : "Registrar Producto Manualmente"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Fotografías del producto (hasta 5) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Fotografías del producto ({(editingProduct.images || []).length} / 5 máximo)
                  </label>

                  <div className="flex flex-wrap gap-2.5">
                    {(editingProduct.images || []).map((imgUrl, idx) => (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden border border-pink-200 bg-pink-50 group"
                      >
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-[#6A1B4D]/85 text-white text-[9px] font-bold text-center py-0.5">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveProductPhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow"
                          aria-label="Quitar fotografía"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {(editingProduct.images || []).length < MAX_PRODUCT_IMAGES && (
                      <div className="flex flex-wrap gap-2">
                        {/* Botón Cámara de Celular */}
                        <label className="flex flex-col items-center justify-center w-24 h-20 rounded-2xl border-2 border-dashed border-[#D81B60] bg-pink-50/60 text-[#6A1B4D] text-[11px] font-bold cursor-pointer hover:bg-pink-100/60 p-2 text-center">
                          {uploadingPhotos ? (
                            <Loader2 className="w-5 h-5 text-[#D81B60] animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-5 h-5 text-[#D81B60] mb-1" />
                              <span>Cámara</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            disabled={uploadingPhotos}
                            className="hidden"
                            onChange={handleProductPhotosSelected}
                          />
                        </label>

                        {/* Botón Galería del Celular / Computadora */}
                        <label className="flex flex-col items-center justify-center w-24 h-20 rounded-2xl border-2 border-dashed border-pink-300 bg-white text-[#6A1B4D] text-[11px] font-bold cursor-pointer hover:bg-pink-50 p-2 text-center">
                          {uploadingPhotos ? (
                            <Loader2 className="w-5 h-5 text-[#D81B60] animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-[#D81B60] mb-1" />
                              <span>Galería</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            disabled={uploadingPhotos}
                            className="hidden"
                            onChange={handleProductPhotosSelected}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre comercial *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Subtítulo / Presentación
                    </label>
                    <input
                      type="text"
                      value={editingProduct.subtitle || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, subtitle: e.target.value })
                      }
                      placeholder="Ej. (Tamaño Grande) o (Sección Peluches)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                    <select
                      value={editingProduct.categorySlug || "peluches"}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          categorySlug: e.target.value as CategorySlug,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Precio en MXN
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.price ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          price: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Ej. 299.00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Precio Promocional (opcional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.promoPrice ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          promoPrice: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      placeholder="Opcional"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Existencias disponibles (unidades)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.stock ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stock: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Ej. 5"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descripción comercial (sin prometer personalización)
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.active ?? true}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, active: e.target.checked })
                      }
                      className="rounded text-[#D81B60]"
                    />
                    <span>Publicado en tienda (visible al público)</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured ?? true}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                      }
                      className="rounded text-[#D81B60]"
                    />
                    <span>Mostrar en Destacados</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isSpecialOffer ?? false}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          isSpecialOffer: e.target.checked,
                        })
                      }
                      className="rounded text-[#D81B60]"
                    />
                    <span>Incluir en Sorpresas y Novedades</span>
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-full border border-gray-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct || uploadingPhotos}
                    className="px-5 py-2 rounded-full bg-[#D81B60] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {savingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Guardar y Publicar</span>
                  </button>
                </div>
              </form>
            )}

            {/* Lista de productos adaptable a móvil y escritorio */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between gap-3 shadow-sm ${
                    prod.active ? "border-pink-200" : "border-gray-300 opacity-75"
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-16 h-16 rounded-xl object-cover border border-pink-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase text-[#D81B60]">
                          {prod.categorySlug}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {prod.active ? "Publicado" : "Oculto"}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-800 truncate mt-0.5">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-extrabold text-[#C2185B] mt-0.5">
                        {formatMXN(prod.promoPrice ?? prod.price)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Existencias:{" "}
                        <strong>
                          {prod.stock !== null ? `${prod.stock} uds.` : "Por confirmar"}
                        </strong>{" "}
                        • {prod.images.length} foto(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-pink-100">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-pink-50 text-[#D81B60] text-xs font-bold hover:bg-pink-100 transition"
                    >
                      Editar / Precio
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleProductVisibility(prod)}
                      className="py-1.5 px-2.5 rounded-xl border border-pink-200 text-[#6A1B4D] text-xs font-semibold hover:bg-pink-50 inline-flex items-center gap-1"
                      title={prod.active ? "Ocultar del catálogo" : "Publicar en catálogo"}
                    >
                      {prod.active ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publicar</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Deseas eliminar permanentemente "${prod.name}" del catálogo?`
                          )
                        ) {
                          deleteProduct(prod.id).catch((err) =>
                            showToast(err.message, "error")
                          );
                        }
                      }}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 2: ADMINISTRACIÓN DE CATEGORÍAS
           =================================================================== */}
        {activeTab === "categories" && (
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-2xl border border-pink-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#6A1B4D]">
                  Categorías Oficiales ({categories.length})
                </h2>
                <p className="text-xs text-gray-600">
                  Administra el nombre, descripción, fotografía y visibilidad de cada categoría.
                </p>
              </div>
            </div>

            {editingCategory && (
              <form
                onSubmit={handleSaveCategory}
                className="bg-white p-5 rounded-3xl border-2 border-[#D81B60] shadow-boutique space-y-4"
              >
                <h3 className="text-sm font-extrabold text-[#6A1B4D]">
                  Editar Categoría: {editingCategory.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                          shortName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCategory.description}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Fotografía de categoría
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#D81B60] bg-pink-50/50 text-xs font-bold text-[#6A1B4D] cursor-pointer">
                      <Camera className="w-4 h-4 text-[#D81B60]" />
                      <span>Tomar o subir foto...</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) =>
                          handleSingleImageUploadToStorage(e, "categories", (url) =>
                            setEditingCategory({ ...editingCategory, image: url })
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 rounded-full border border-gray-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingCategory || uploadingPhotos}
                    className="px-5 py-2 rounded-full bg-[#D81B60] text-white text-xs font-bold"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-pink-200 p-4 flex items-center gap-3.5 shadow-sm"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-pink-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-extrabold text-[#6A1B4D]">{cat.name}</h3>
                    <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                      {cat.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(cat)}
                      className="mt-2 px-3 py-1 rounded-lg bg-pink-50 text-[#D81B60] text-[11px] font-bold hover:bg-pink-100"
                    >
                      Editar categoría
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 3: BANNERS Y GALERÍA DEL ESTABLECIMIENTO
           =================================================================== */}
        {activeTab === "banners_gallery" && (
          <div className="space-y-6">
            {/* Sección Banners Promocionales */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-200 space-y-4">
              <div className="flex items-center gap-2 text-[#6A1B4D]">
                <Megaphone className="w-5 h-5 text-[#D81B60]" />
                <div>
                  <h2 className="text-sm font-extrabold">
                    Banners Promocionales de Portada ({banners.length})
                  </h2>
                  <p className="text-xs text-gray-500">
                    Edita los textos e imágenes del banner principal animado.
                  </p>
                </div>
              </div>

              {editingBanner && (
                <form
                  onSubmit={handleSaveBanner}
                  className="p-4 rounded-2xl bg-[#FDF2F7] border border-[#D81B60] space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Título Línea 1
                      </label>
                      <input
                        type="text"
                        required
                        value={editingBanner.titleLine1}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, titleLine1: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Título Línea 2 (Destacado)
                      </label>
                      <input
                        type="text"
                        required
                        value={editingBanner.titleLine2}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, titleLine2: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Fotografía del Banner
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#D81B60] bg-white text-xs font-bold text-[#6A1B4D] cursor-pointer">
                        <Upload className="w-4 h-4 text-[#D81B60]" />
                        <span>Cambiar imagen...</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) =>
                            handleSingleImageUploadToStorage(e, "banners", (url) =>
                              setEditingBanner({ ...editingBanner, imageUrl: url })
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Subtítulo descriptivo
                    </label>
                    <input
                      type="text"
                      required
                      value={editingBanner.subtitle}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBanner(null)}
                      className="px-4 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingBanner}
                      className="px-4 py-1.5 rounded-full bg-[#D81B60] text-white text-xs font-bold"
                    >
                      Guardar Banner
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {banners.map((ban) => (
                  <div
                    key={ban.id}
                    className="p-3.5 rounded-2xl border border-pink-200 bg-pink-50/30 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#D81B60] uppercase">
                        {ban.badge}
                      </span>
                      <h3 className="text-xs font-extrabold text-[#6A1B4D] mt-0.5">
                        {ban.titleLine1} {ban.titleLine2}
                      </h3>
                      <p className="text-[11px] text-gray-600 mt-1">{ban.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingBanner(ban)}
                      className="w-full py-1.5 rounded-xl bg-white border border-pink-200 text-[#D81B60] text-xs font-bold hover:bg-pink-50"
                    >
                      Editar Banner
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección Galería "Conoce nuestra tienda" */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-200 space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-[#6A1B4D]">
                  Galería del Establecimiento “Conoce nuestra tienda” ({storeGallery.length} fotos)
                </h2>
                <p className="text-xs text-gray-600">
                  Sube desde la cámara de tu celular o desde tu galería las fotografías reales del
                  establecimiento.
                </p>
              </div>

              {editingGallery && (
                <form
                  onSubmit={handleSaveGalleryPhoto}
                  className="p-4 rounded-2xl bg-[#FDF2F7] border-2 border-[#D81B60] space-y-3"
                >
                  <h3 className="text-xs font-extrabold text-[#6A1B4D]">
                    Actualizar Fotografía del Establecimiento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Título</label>
                      <input
                        type="text"
                        required
                        value={editingGallery.title}
                        onChange={(e) =>
                          setEditingGallery({ ...editingGallery, title: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Descripción breve
                      </label>
                      <input
                        type="text"
                        required
                        value={editingGallery.caption}
                        onChange={(e) =>
                          setEditingGallery({ ...editingGallery, caption: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Fotografía (Cámara o Galería)
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#D81B60] bg-white text-xs font-bold text-[#6A1B4D] cursor-pointer">
                        <Camera className="w-4 h-4 text-[#D81B60]" />
                        <span>Subir foto real...</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) =>
                            handleSingleImageUploadToStorage(e, "gallery", (url) =>
                              setEditingGallery({ ...editingGallery, image: url })
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingGallery(null)}
                      className="px-4 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingGallery || uploadingPhotos}
                      className="px-4 py-1.5 rounded-full bg-[#D81B60] text-white text-xs font-bold"
                    >
                      Guardar en Galería
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeGallery.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="rounded-2xl border border-pink-200 p-3 flex flex-col justify-between bg-pink-50/20"
                  >
                    <div>
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-pink-50 mb-2.5">
                        <img
                          src={photo.image}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-[#D81B60]">
                        Espacio #{idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-gray-800">{photo.title}</h3>
                      <p className="text-[11px] text-gray-600 mt-0.5">{photo.caption}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingGallery(photo)}
                      className="mt-3 w-full py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#D81B60] text-xs font-bold transition"
                    >
                      Reemplazar fotografía
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 4: HISTORIAL Y CONTROL DE PEDIDOS
           =================================================================== */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl border border-pink-200 p-5">
            <h2 className="text-base font-extrabold text-[#6A1B4D] mb-4">
              Gestión de Pedidos Registrados ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">
                Aún no hay pedidos registrados en la base de datos.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-pink-200 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-sm text-[#6A1B4D]">
                        {ord.id} — {ord.customerName} ({ord.customerPhone})
                      </p>
                      <p className="text-gray-600">
                        Entrega: {ord.address || "Recolección en tienda"} • Ocasión: {ord.occasion}
                      </p>
                      <p className="font-extrabold text-[#C2185B]">
                        {ord.total > 0 ? formatMXN(ord.total) : "Precio por confirmar en tienda"}
                      </p>
                    </div>
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        updateOrderStatus(ord.id, e.target.value as typeof ord.status).catch(
                          (err) => showToast(err.message, "error")
                        )
                      }
                      className="px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold bg-pink-50 text-[#6A1B4D]"
                    >
                      <option value="pendiente_whatsapp">Pendiente WhatsApp</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="en_preparacion">En preparación</option>
                      <option value="listo_entrega">Listo para entrega</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 5: ESTADO Y SEGURIDAD DEL SISTEMA
           =================================================================== */}
        {activeTab === "system" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-pink-200 space-y-2.5">
              <div className="flex items-center gap-2 text-[#D81B60] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Políticas de Seguridad y RLS Activas</span>
              </div>
              <ul className="text-xs text-gray-700 space-y-1.5">
                <li>
                  • <strong>Supabase Auth:</strong> Autenticación real sin contraseñas fijas.
                </li>
                <li>
                  • <strong>Row Level Security (RLS):</strong> Escritura en productos, categorías,
                  banners, galería y estados de pedidos restringida mediante{" "}
                  <code>public.is_admin()</code>.
                </li>
                <li>
                  • <strong>Supabase Storage:</strong> Bucket <code>store-media</code> configurado
                  para hasta 5 fotos por producto (JPG, PNG, WEBP, máx. 5 MB).
                </li>
                <li>
                  • <strong>Regla Comercial:</strong> Cero promesas de personalización de regalos.
                </li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-pink-200 space-y-2.5">
              <div className="flex items-center gap-2 text-[#6A1B4D] font-bold text-sm">
                <Database className="w-5 h-5" />
                <span>Estado de Conexiones Externas</span>
              </div>
              <p className="text-xs text-gray-700">
                • <strong>WhatsApp (+52 56 3547 8874):</strong> Operativo.
              </p>
              <p className="text-xs text-gray-700">
                • <strong>Supabase PostgreSQL & Storage:</strong>{" "}
                {isSupabaseConfigured ? "Conectado y persistente." : "Pendiente de credenciales."}
              </p>
              <p className="text-xs text-gray-700">
                • <strong>Asistente IA Multimodal (Servidor):</strong>{" "}
                {serverStatus?.aiConfigured
                  ? `Operativo (${serverStatus.aiProvider?.toUpperCase()})`
                  : "Pendiente configurar GEMINI_API_KEY en el servidor."}
              </p>
              <p className="text-xs text-gray-700">
                • <strong>Mercado Pago:</strong> Cobros reales desactivados preventivamente hasta
                autorización expresa.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL: ASISTENTE "AGREGAR PRODUCTO CON IA" (OPTIMIZADO PARA CELULAR)
         ===================================================================== */}
      {aiModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agregar producto con Inteligencia Artificial"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-pink-200 space-y-5">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] text-white flex items-center justify-center shadow">
                  <Sparkles className="w-5 h-5 text-[#FDE68A]" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#6A1B4D]">
                    Agregar producto con IA
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Toma o elige una foto • La IA sugiere los datos • Tú confirmas precio y
                    publicas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="w-8 h-8 rounded-full bg-pink-50 text-[#6A1B4D] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paso 1: Captura con cámara o selección de galería (hasta 5 fotos) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-extrabold text-[#6A1B4D]">
                1. Toma o selecciona las fotografías del artículo ({aiFiles.length} / 5)
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white text-xs font-bold shadow cursor-pointer hover:brightness-105 text-center">
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Tomar foto con cámara</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="hidden"
                    onChange={handleAiPhotoSelection}
                  />
                </label>

                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-[#6A1B4D] text-xs font-bold cursor-pointer hover:bg-pink-100 text-center">
                  <Upload className="w-4 h-4 text-[#D81B60] shrink-0" />
                  <span>Elegir de galería</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleAiPhotoSelection}
                  />
                </label>
              </div>

              {aiPreviews.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {aiPreviews.map((src, idx) => (
                    <div
                      key={src}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-pink-200"
                    >
                      <img src={src} alt={`Vista previa ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAiFiles((prev) => prev.filter((_, i) => i !== idx));
                          setAiPreviews((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {aiFiles[0] && !aiAnalyzing && (
                    <button
                      type="button"
                      onClick={() => runAiVisualAnalysis(aiFiles[0])}
                      className="text-[11px] font-bold text-[#D81B60] underline ml-2"
                    >
                      Re-analizar foto principal con IA
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Estado de análisis visual con IA */}
            {aiAnalyzing && (
              <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 flex items-center gap-3 text-xs font-bold text-[#6A1B4D]">
                <Loader2 className="w-5 h-5 text-[#D81B60] animate-spin shrink-0" />
                <span>
                  La Inteligencia Artificial está analizando visualmente el artículo desde el
                  servidor...
                </span>
              </div>
            )}

            {aiError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{aiError}</p>
                  <p className="text-[11px] text-amber-800">
                    No se simulan respuestas de IA. Puedes configurar la clave en el servidor o
                    completar los campos manualmente aquí abajo.
                  </p>
                </div>
              </div>
            )}

            {/* Si la IA detecta varios productos en una misma imagen, solicitar que la administradora seleccione cuál desea registrar */}
            {aiResult && aiResult.items.length > 1 && (
              <div className="p-4 rounded-2xl bg-[#FDF2F7] border border-pink-300 space-y-2.5">
                <p className="text-xs font-extrabold text-[#6A1B4D]">
                  Detectamos varios productos en la fotografía. Selecciona cuál deseas registrar:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiResult.items.map((item) => {
                    const isSelected = selectedAiItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyDetectedItemToDraft(item)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? "border-[#D81B60] bg-white shadow-sm"
                            : "border-pink-200 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <span className="text-[10px] font-extrabold uppercase text-[#D81B60]">
                          {item.visualLabel}
                        </span>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">
                          {item.suggestedName}
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulario de revisión humana obligatoria + Precio y Existencias */}
            <form onSubmit={handlePublishAiProduct} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre comercial sugerido *
                  </label>
                  <input
                    type="text"
                    required
                    value={aiDraftName}
                    onChange={(e) => setAiDraftName(e.target.value)}
                    placeholder="Revisa o escribe el nombre del artículo..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Categoría sugerida *
                  </label>
                  <select
                    value={aiDraftCategory}
                    onChange={(e) => setAiDraftCategory(e.target.value as CategorySlug)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtítulo / Presentación visible
                </label>
                <input
                  type="text"
                  value={aiDraftSubtitle}
                  onChange={(e) => setAiDraftSubtitle(e.target.value)}
                  placeholder="Ej. (Sección Peluches)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descripción comercial sugerida (fiel a la imagen) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={aiDraftDescription}
                  onChange={(e) => setAiDraftDescription(e.target.value)}
                  placeholder="Descripción basada únicamente en los detalles visibles..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200"
                />
              </div>

              {selectedAiItem && selectedAiItem.visualFeaturesConfirmed.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAiItem.visualFeaturesConfirmed.map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-[10px] font-semibold text-[#6A1B4D]"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FDF2F7] border border-pink-200">
                <div>
                  <label className="block text-xs font-extrabold text-[#6A1B4D] mb-1">
                    Precio real en MXN *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={aiDraftPrice}
                    onChange={(e) => setAiDraftPrice(e.target.value)}
                    placeholder="Ej. 350.00"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#6A1B4D] mb-1">
                    Existencias reales *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={aiDraftStock}
                    onChange={(e) => setAiDraftStock(e.target.value)}
                    placeholder="Ej. 3"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-300 bg-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={aiPublishing || aiAnalyzing}
                  className="btn-shimmer px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white text-xs font-bold shadow-md disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {aiPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publicar en Catálogo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
