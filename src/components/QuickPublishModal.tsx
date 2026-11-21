"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  ImagePlus,
  Sparkles,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  ExternalLink,
  Plus,
  Minus,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import {
  AIProductAnalysisResponse,
  Category,
  CategorySlug,
  Product,
} from "@/types/store";
import {
  compressImageForAI,
  MAX_PRODUCT_IMAGES,
  OptimizedImageResult,
  optimizeImageWithPreview,
} from "@/lib/imageUtils";
import {
  deleteImageFromCloudinary,
  firebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { formatMXN } from "@/lib/whatsapp";

interface QuickPublishModalProps {
  open: boolean;
  categories: Category[];
  aiConfigured?: boolean;
  onClose: () => void;
  onUploadPhoto: (file: File) => Promise<string>;
  onSaveProduct: (product: Product) => Promise<void>;
  onSwitchToAdvanced: () => void;
  onShowToast: (msg: string, variant?: "success" | "error" | "info") => void;
}

function createUniqueProductId(): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `prod-${Date.now()}-${rand}`;
}

function buildProductSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
  return `${base || "producto"}-${Date.now().toString().slice(-4)}`;
}

export default function QuickPublishModal({
  open,
  categories,
  aiConfigured = true,
  onClose,
  onUploadPhoto,
  onSaveProduct,
  onSwitchToAdvanced,
  onShowToast,
}: QuickPublishModalProps) {
  const activeCategories = categories.filter((c) => c.active);
  const defaultCategorySlug: CategorySlug =
    activeCategories[0]?.slug || "regalos";

  // Estado del formulario rápido (soporta 1 a 5 fotografías optimizadas WebP)
  const [photos, setPhotos] = useState<OptimizedImageResult[]>([]);
  const [photoCaptureMode, setPhotoCaptureMode] = useState<"replace" | "append">("replace");
  const photo = photos[0] || null;
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [categorySlug, setCategorySlug] =
    useState<CategorySlug>(defaultCategorySlug);
  const [stock, setStock] = useState<number>(1);

  // Sugerencia opcional de categoría con Gemini
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [geminiNote, setGeminiNote] = useState<string | null>(null);
  const [geminiSuggestedName, setGeminiSuggestedName] = useState<string | null>(
    null
  );
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Estado de envío con protección anti-duplicados por doble clic
  const [submittingMode, setSubmittingMode] = useState<
    "publish" | "draft" | null
  >(null);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<{
    product: Product;
    isDraft: boolean;
  } | null>(null);

  const submittingRef = useRef(false);
  const sessionProductIdRef = useRef<string>(createUniqueProductId());
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<string[]>([]);

  // Limpiar object URLs al desmontar
  useEffect(() => {
    previewUrlsRef.current = photos.map((p) => p.previewUrl);
  }, [photos]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const resetFormForNewProduct = () => {
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrlsRef.current = [];
    setPhotos([]);
    setPhotoCaptureMode("replace");
    setName("");
    setPriceInput("");
    setCategorySlug(defaultCategorySlug);
    setStock(1);
    setGeminiNote(null);
    setGeminiSuggestedName(null);
    setGeminiError(null);
    setFormError(null);
    setStatusStep(null);
    setSavedResult(null);
    setSubmittingMode(null);
    submittingRef.current = false;
    sessionProductIdRef.current = createUniqueProductId();
  };

  useEffect(() => {
    if (open) {
      resetFormForNewProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isBusy = Boolean(submittingMode) || processingPhoto;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    // Resetear input inmediatamente para permitir tomar otra foto en iOS Safari / Android Chrome
    e.target.value = "";
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);
    setFormError(null);
    setGeminiError(null);
    if (photoCaptureMode === "replace") {
      setGeminiNote(null);
      setGeminiSuggestedName(null);
    }
    setProcessingPhoto(true);

    try {
      const remainingSlots =
        photoCaptureMode === "append"
          ? Math.max(0, MAX_PRODUCT_IMAGES - photos.length)
          : MAX_PRODUCT_IMAGES;
      if (remainingSlots <= 0) {
        onShowToast(`Máximo ${MAX_PRODUCT_IMAGES} fotografías por producto.`, "info");
        return;
      }

      const optimizedBatch: OptimizedImageResult[] = [];
      for (const rawFile of incoming.slice(0, remainingSlots)) {
        const opt = await optimizeImageWithPreview(rawFile, 1400, 0.84);
        optimizedBatch.push(opt);
      }

      if (photoCaptureMode === "append") {
        setPhotos((prev) => [...prev, ...optimizedBatch].slice(0, MAX_PRODUCT_IMAGES));
      } else {
        setPhotos((prev) => {
          if (prev[0]) URL.revokeObjectURL(prev[0].previewUrl);
          const rest = prev.slice(1);
          return [...optimizedBatch, ...rest].slice(0, MAX_PRODUCT_IMAGES);
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo procesar la fotografía seleccionada.";
      setFormError(message);
      onShowToast(message, "error");
    } finally {
      setProcessingPhoto(false);
    }
  };

  const handleRemovePhotoAt = (idx: number) => {
    setPhotos((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleMakePrimaryPhoto = (idx: number) => {
    if (idx <= 0) return;
    setPhotos((prev) => {
      const chosen = prev[idx];
      if (!chosen) return prev;
      return [chosen, ...prev.filter((_, i) => i !== idx)];
    });
  };

  const handleSuggestCategoryWithGemini = async () => {
    if (!photo || suggestingCategory || isBusy) return;

    setSuggestingCategory(true);
    setGeminiError(null);
    setGeminiNote(null);

    try {
      const idToken = await firebaseAuth?.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error(
          "Tu sesión administrativa expiró. Vuelve a iniciar sesión para usar Gemini."
        );
      }

      const { base64, mimeType } = await compressImageForAI(photo.file, 960, 0.8);
      const res = await fetch("/api/admin/ai-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            "No fue posible obtener la sugerencia de Gemini en este momento."
        );
      }

      const analysis = data as AIProductAnalysisResponse;
      const topItem = analysis.items?.[0];
      if (!topItem) {
        throw new Error(
          "Gemini no pudo identificar claramente el artículo. Selecciona la categoría manualmente."
        );
      }

      setCategorySlug(topItem.categorySlug);
      const matchedCategory = categories.find(
        (c) => c.slug === topItem.categorySlug
      );
      setGeminiNote(
        `Gemini sugirió: ${matchedCategory?.name || topItem.categorySlug}`
      );
      if (!name.trim() && topItem.suggestedName) {
        setGeminiSuggestedName(topItem.suggestedName);
      }
      onShowToast(
        `Categoría sugerida por Gemini: ${matchedCategory?.name || topItem.categorySlug}`,
        "success"
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al consultar Gemini. Puedes elegir la categoría manualmente.";
      setGeminiError(msg);
    } finally {
      setSuggestingCategory(false);
    }
  };

  const handleSubmit = async (mode: "publish" | "draft") => {
    // Bloqueo síncrono inmediato contra doble clic / doble toque táctil
    if (submittingRef.current) return;

    setFormError(null);

    // 1. Validar fotografía obligatoria
    if (!photo?.file) {
      setFormError(
        "Primero toma una fotografía o selecciona una desde tu galería."
      );
      return;
    }

    // 2. Validar nombre obligatorio
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setFormError("Escribe el nombre del producto antes de continuar.");
      return;
    }

    // 3. Validar precio en MXN
    const trimmedPrice = priceInput.trim();
    const parsedPrice = trimmedPrice === "" ? null : Number(trimmedPrice);

    if (mode === "publish") {
      if (
        parsedPrice === null ||
        Number.isNaN(parsedPrice) ||
        parsedPrice <= 0
      ) {
        setFormError(
          "Ingresa un precio válido mayor a $0 MXN antes de publicar."
        );
        return;
      }
    } else if (
      parsedPrice !== null &&
      (Number.isNaN(parsedPrice) || parsedPrice < 0)
    ) {
      setFormError("El precio en MXN debe ser un número válido mayor o igual a 0.");
      return;
    }

    // 4. Validar existencias
    const cleanStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 1;

    submittingRef.current = true;
    setSubmittingMode(mode);

    let uploadedUrls: string[] = [];
    try {
      // Paso A: Subida firmada a Cloudinary (1 a 5 fotos; nunca publicar si falla)
      for (let i = 0; i < photos.length; i++) {
        setStatusStep(
          photos.length > 1
            ? `Subiendo fotografía ${i + 1} de ${photos.length} a Cloudinary...`
            : "Subiendo fotografía WebP optimizada a Cloudinary..."
        );
        const url = await onUploadPhoto(photos[i].file);
        if (!url || !url.startsWith("http")) {
          throw new Error(
            "La subida de la fotografía no devolvió una URL válida. No se publicó el producto."
          );
        }
        uploadedUrls.push(url);
      }

      // Paso B: Guardar producto real en Cloud Firestore (isDemo: false)
      setStatusStep(
        mode === "publish"
          ? "Guardando y publicando en Cloud Firestore..."
          : "Guardando borrador en Cloud Firestore..."
      );

      const selectedCatName =
        categories.find((c) => c.slug === categorySlug)?.name || "Tienda";

      const newProduct: Product = {
        id: sessionProductIdRef.current,
        slug: buildProductSlug(cleanName),
        name: cleanName,
        subtitle: `(${selectedCatName})`,
        description: `${cleanName} disponible en Regalos, Disfraces y Más — Los Ángeles.`,
        price: parsedPrice,
        categorySlug,
        images: uploadedUrls,
        stock: cleanStock,
        isFeatured: mode === "publish",
        isSpecialOffer: false,
        active: mode === "publish",
        isDemo: false,
        badge:
          mode === "publish"
            ? {
                text: "Nuevo",
                variant: "new",
              }
            : undefined,
      };

      await onSaveProduct(newProduct);

      setSavedResult({
        product: newProduct,
        isDraft: mode === "draft",
      });
    } catch (err) {
      // Si se subieron imágenes a Cloudinary pero falló Firestore, limpiar imágenes huérfanas
      if (uploadedUrls.length > 0 && isFirebaseConfigured) {
        uploadedUrls.forEach((u) => {
          deleteImageFromCloudinary(u).catch(() => {});
        });
      }

      const errorMsg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar el producto. No se publicó en el catálogo.";
      setFormError(errorMsg);
      onShowToast(errorMsg, "error");
    } finally {
      setStatusStep(null);
      setSubmittingMode(null);
      submittingRef.current = false;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publicación rápida de producto"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white w-full sm:max-w-lg max-h-[96dvh] sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-200 overflow-hidden">
        {/* Encabezado fijo */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-pink-100 bg-gradient-to-r from-[#FDF2F7] to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-[#FDE68A]" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#6A1B4D] leading-tight">
                Publicación rápida
              </h2>
              <p className="text-[11px] text-gray-500">
                Toma foto, escribe nombre y precio MXN y publica al instante
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            aria-label="Cerrar publicación rápida"
            className="w-9 h-9 rounded-full bg-pink-50 text-[#6A1B4D] hover:bg-pink-100 flex items-center justify-center disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs ocultos de cámara y galería compatibles con Android Chrome y Safari iOS */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isBusy}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={isBusy}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {savedResult ? (
            /* Pantalla de éxito inmediata */
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-[#6A1B4D]">
                  {savedResult.isDraft
                    ? "¡Borrador guardado!"
                    : "¡Producto publicado en el catálogo!"}
                </h3>
                <p className="text-xs text-gray-600">
                  {savedResult.isDraft
                    ? "Tu producto se guardó como borrador oculto en Cloud Firestore. Puedes publicarlo cuando quieras desde el panel."
                    : "La fotografía se guardó en Cloudinary y el producto ya es visible en el catálogo público."}
                </p>
              </div>

              <div className="bg-[#FDF2F7] border border-pink-200 rounded-2xl p-3 flex items-center gap-3 text-left max-w-sm mx-auto">
                <img
                  src={savedResult.product.images[0]}
                  alt={savedResult.product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-pink-200 shrink-0 bg-white"
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 ${
                      savedResult.isDraft
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {savedResult.isDraft ? "Borrador" : "Publicado"}
                  </span>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {savedResult.product.name}
                  </p>
                  <p className="text-sm font-extrabold text-[#C2185B]">
                    {savedResult.product.price !== null
                      ? formatMXN(savedResult.product.price)
                      : "Precio pendiente"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Existencias: {savedResult.product.stock ?? 0} ud(s).
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetFormForNewProduct}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white text-sm font-bold shadow-md inline-flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Agregar otro producto</span>
                </button>

                {!savedResult.isDraft && (
                  <Link
                    href="/catalogo"
                    className="flex-1 py-3 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-[#6A1B4D] text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-pink-100"
                  >
                    <ExternalLink className="w-4 h-4 text-[#D81B60]" />
                    <span>Ver en catálogo</span>
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 underline"
              >
                Volver al panel de administración
              </button>
            </div>
          ) : (
            <>
              {/* PASO 1: FOTOGRAFÍA (CÁMARA O GALERÍA) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#6A1B4D]">
                    1. Fotografía del producto *
                  </span>
                  {photo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {photo.mimeType === "image/webp" ? "WebP" : "JPEG"} •{" "}
                      {photo.sizeKB} KB
                    </span>
                  )}
                </div>

                {processingPhoto ? (
                  <div className="h-52 rounded-2xl border-2 border-dashed border-pink-300 bg-[#FDF2F7] flex flex-col items-center justify-center gap-2 text-center p-4">
                    <Loader2 className="w-8 h-8 text-[#D81B60] animate-spin" />
                    <p className="text-xs font-bold text-[#6A1B4D]">
                      Corrigiendo orientación y optimizando imagen a WebP...
                    </p>
                  </div>
                ) : !photo ? (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn-shimmer w-full py-5 px-4 rounded-2xl bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white shadow-boutique flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="text-base font-extrabold">
                        Tomar foto
                      </span>
                      <span className="text-[11px] text-pink-100">
                        Abre la cámara trasera de tu celular
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-[#6A1B4D] text-sm font-bold flex items-center justify-center gap-2 hover:bg-pink-100 active:scale-[0.99] transition"
                    >
                      <ImagePlus className="w-4 h-4 text-[#D81B60]" />
                      <span>Subir desde galería</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-pink-200 bg-[#FDF2F7] flex items-center justify-center">
                      <img
                        src={photo.previewUrl}
                        alt="Vista previa del producto"
                        className="w-full max-h-64 object-contain"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setPhotoCaptureMode("replace");
                          cameraInputRef.current?.click();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-pink-50 border border-pink-200 text-[#6A1B4D] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-pink-100 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#D81B60]" />
                        <span>Tomar otra foto</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setPhotoCaptureMode("replace");
                          galleryInputRef.current?.click();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-white border border-pink-200 text-[#6A1B4D] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-pink-50 disabled:opacity-50"
                      >
                        <ImagePlus className="w-3.5 h-3.5 text-[#D81B60]" />
                        <span>Cambiar de galería</span>
                      </button>
                    </div>

                    {/* Galería multi-foto (hasta 5 fotos por producto) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {photos.map((pItem, idx) => (
                        <div
                          key={pItem.previewUrl}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 bg-[#FFF9FB] p-0.5 ${
                            idx === 0 ? "border-[#D81B60]" : "border-pink-200"
                          }`}
                        >
                          <img
                            src={pItem.previewUrl}
                            alt={`Foto ${idx + 1}`}
                            onClick={() => handleMakePrimaryPhoto(idx)}
                            className="w-full h-full object-contain cursor-pointer"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-[#6A1B4D]/85 text-white text-[8px] font-bold text-center">
                              Principal
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRemovePhotoAt(idx)}
                            aria-label={`Quitar foto ${idx + 1}`}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {photos.length < MAX_PRODUCT_IMAGES && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setPhotoCaptureMode("append");
                              cameraInputRef.current?.click();
                            }}
                            className="h-14 px-2.5 rounded-xl border-2 border-dashed border-[#D81B60] bg-pink-50/60 text-[#6A1B4D] text-[10px] font-bold flex flex-col items-center justify-center gap-0.5"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#D81B60]" />
                            <span>+ Foto ({photos.length}/{MAX_PRODUCT_IMAGES})</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setPhotoCaptureMode("append");
                              galleryInputRef.current?.click();
                            }}
                            className="h-14 px-2.5 rounded-xl border-2 border-dashed border-pink-300 bg-white text-[#6A1B4D] text-[10px] font-bold flex flex-col items-center justify-center gap-0.5"
                          >
                            <ImagePlus className="w-3.5 h-3.5 text-[#D81B60]" />
                            <span>+ Galería</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 2: NOMBRE Y PRECIO EN MXN */}
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="quick-product-name"
                    className="block text-xs font-extrabold text-[#6A1B4D] mb-1"
                  >
                    2. Nombre del producto *
                  </label>
                  <input
                    id="quick-product-name"
                    type="text"
                    required
                    disabled={isBusy}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Oso de peluche rosa mediano"
                    autoComplete="off"
                    className="w-full px-3.5 py-3 text-base rounded-2xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40 disabled:bg-gray-50"
                  />
                  {geminiSuggestedName && !name.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setName(geminiSuggestedName);
                        setGeminiSuggestedName(null);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#D81B60] bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-full hover:bg-pink-100"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Usar nombre sugerido: “{geminiSuggestedName}”</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Precio en MXN */}
                  <div className="col-span-7">
                    <label
                      htmlFor="quick-product-price"
                      className="block text-xs font-extrabold text-[#6A1B4D] mb-1"
                    >
                      3. Precio (MXN) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-base font-extrabold text-[#D81B60]">
                        $
                      </span>
                      <input
                        id="quick-product-price"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        disabled={isBusy}
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="250"
                        className="w-full pl-8 pr-12 py-3 text-base font-bold rounded-2xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D81B60]/40 disabled:bg-gray-50"
                      />
                      <span className="absolute right-3 text-[11px] font-bold text-gray-400">
                        MXN
                      </span>
                    </div>
                  </div>

                  {/* Existencias (1 por defecto, editable) */}
                  <div className="col-span-5">
                    <label
                      htmlFor="quick-product-stock"
                      className="block text-xs font-extrabold text-[#6A1B4D] mb-1"
                    >
                      Existencia
                    </label>
                    <div className="flex items-center rounded-2xl border border-pink-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        disabled={isBusy || stock <= 0}
                        onClick={() => setStock((s) => Math.max(0, s - 1))}
                        aria-label="Disminuir existencia"
                        className="w-10 h-[50px] flex items-center justify-center text-[#6A1B4D] hover:bg-pink-50 disabled:opacity-40"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="quick-product-stock"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        disabled={isBusy}
                        value={stock}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setStock(Number.isNaN(v) ? 0 : Math.max(0, v));
                        }}
                        className="w-full text-center text-base font-extrabold text-[#6A1B4D] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setStock((s) => s + 1)}
                        aria-label="Aumentar existencia"
                        className="w-10 h-[50px] flex items-center justify-center text-[#6A1B4D] hover:bg-pink-50 disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 3: CATEGORÍA (MANUAL O SUGERIDA POR GEMINI) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#6A1B4D]">
                    4. Categoría
                  </span>
                  <button
                    type="button"
                    disabled={!photo || suggestingCategory || isBusy}
                    onClick={handleSuggestCategoryWithGemini}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#6A1B4D] to-[#AD1457] text-white text-[11px] font-bold shadow-sm disabled:opacity-45"
                  >
                    {suggestingCategory ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
                    )}
                    <span>
                      {suggestingCategory
                        ? "Consultando Gemini..."
                        : "Sugerir con Gemini"}
                    </span>
                  </button>
                </div>

                {!aiConfigured && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    La sugerencia automática con Gemini está pendiente de activar en el servidor.
                    Puedes elegir la categoría manualmente aquí abajo.
                  </p>
                )}

                {geminiNote && (
                  <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{geminiNote}</span>
                  </p>
                )}

                {geminiError && (
                  <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    {geminiError}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {activeCategories.map((cat) => {
                    const selected = categorySlug === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setCategorySlug(cat.slug)}
                        className={`px-3 py-2 rounded-full text-xs font-bold transition ${
                          selected
                            ? "bg-[#D81B60] text-white shadow-sm"
                            : "bg-pink-50 text-[#6A1B4D] border border-pink-200 hover:bg-pink-100"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estado de progreso o error */}
              {statusStep && (
                <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 flex items-center gap-2.5 text-xs font-bold text-[#6A1B4D]">
                  <Loader2 className="w-4 h-4 text-[#D81B60] animate-spin shrink-0" />
                  <span>{statusStep}</span>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-2 text-xs font-bold text-rose-800"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Enlace al formulario avanzado */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onSwitchToAdvanced}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6A1B4D] hover:text-[#D81B60] underline disabled:opacity-40"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    ¿Necesitas más campos o hasta 5 fotos? Usar formulario avanzado
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Barra de acciones inferior fija (optimizada para pulgar en móvil) */}
        {!savedResult && (
          <div className="px-4 sm:px-5 py-3 border-t border-pink-100 bg-white shrink-0 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleSubmit("publish")}
              className="btn-shimmer w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#E91E63] via-[#D81B60] to-[#AD1457] text-white text-sm font-extrabold shadow-md disabled:opacity-55 flex items-center justify-center gap-2 active:scale-[0.99] transition"
            >
              {submittingMode === "publish" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando producto...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar producto</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleSubmit("draft")}
              className="w-full py-2.5 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-[#6A1B4D] text-xs font-bold hover:bg-pink-100 disabled:opacity-55 flex items-center justify-center gap-1.5 transition"
            >
              {submittingMode === "draft" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando borrador...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#D81B60]" />
                  <span>Guardar como borrador</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
