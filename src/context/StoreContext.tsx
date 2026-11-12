"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  Category,
  CategorySlug,
  CartItem,
  CustomerOrder,
  Product,
  StoreBanner,
  StoreGalleryPhoto,
} from "@/types/store";
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_STORE_GALLERY,
} from "@/data/mockCatalog";
import {
  isSupabaseConfigured,
  mapBannerToRow,
  mapCategoryToRow,
  mapOrderToRow,
  mapProductToRow,
  mapRowToBanner,
  mapRowToCategory,
  mapRowToGalleryPhoto,
  mapRowToOrder,
  mapRowToProduct,
  supabase,
} from "@/lib/supabase";

export type ToastVariant = "success" | "error" | "info";

interface StoreContextType {
  categories: Category[];
  products: Product[];
  storeGallery: StoreGalleryPhoto[];
  banners: StoreBanner[];
  cart: CartItem[];
  favorites: string[];
  orders: CustomerOrder[];
  isLoadingCatalog: boolean;
  isPersistedInSupabase: boolean;
  searchQuery: string;
  selectedCategory: CategorySlug | "all";
  sortBy: "featured" | "price-asc" | "price-desc" | "name-asc";
  isCartOpen: boolean;
  isFavoritesOpen: boolean;
  activeProductModal: Product | null;
  toastMessage: string | null;
  toastVariant: ToastVariant;
  celebrationActive: boolean;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: CategorySlug | "all") => void;
  setSortBy: (sort: "featured" | "price-asc" | "price-desc" | "name-asc") => void;
  setIsCartOpen: (open: boolean) => void;
  setIsFavoritesOpen: (open: boolean) => void;
  setActiveProductModal: (product: Product | null) => void;
  showToast: (msg: string, variant?: ToastVariant) => void;
  triggerCelebration: () => void;
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariants?: Record<string, string>,
    orderNotes?: string
  ) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  cartCount: number;
  cartSubtotal: number;
  hasUnpricedItemsInCart: boolean;
  refreshStoreData: (includeAdminData?: boolean) => Promise<void>;
  createOrder: (
    orderData: Omit<CustomerOrder, "id" | "createdAt" | "status">
  ) => Promise<CustomerOrder>;
  upsertProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  upsertCategory: (category: Category) => Promise<void>;
  updateGalleryPhoto: (photo: StoreGalleryPhoto, displayOrder?: number) => Promise<void>;
  upsertBanner: (banner: StoreBanner) => Promise<void>;
  updateOrderStatus: (orderId: string, status: CustomerOrder["status"]) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Solo se conserva en el navegador el carrito y la lista de deseos del comprador
const CLIENT_SESSION_KEYS = {
  CART: "la_boutique_cart_v3",
  FAVS: "la_boutique_favs_v3",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [storeGallery, setStoreGallery] = useState<StoreGalleryPhoto[]>(INITIAL_STORE_GALLERY);
  const [banners, setBanners] = useState<StoreBanner[]>(INITIAL_BANNERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(isSupabaseConfigured);
  const [isPersistedInSupabase, setIsPersistedInSupabase] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | "all">("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name-asc">(
    "featured"
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("success");
  const [celebrationActive, setCelebrationActive] = useState(false);

  const showToast = useCallback((msg: string, variant: ToastVariant = "success") => {
    setToastVariant(variant);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const triggerCelebration = useCallback(() => {
    setCelebrationActive(true);
    setTimeout(() => {
      setCelebrationActive(false);
    }, 1500);
  }, []);

  // Cargar carrito y favoritos de sesión del comprador (filtrando productos de demostración o sin precio confirmado)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CLIENT_SESSION_KEYS.CART);
      if (savedCart) {
        const parsed: CartItem[] = JSON.parse(savedCart);
        const validCart = Array.isArray(parsed)
          ? parsed.filter((item) => {
              const p = item?.product;
              if (!p || p.isDemo) return false;
              const unitPrice = p.promoPrice ?? p.price;
              return (
                unitPrice !== null &&
                unitPrice !== undefined &&
                unitPrice > 0 &&
                p.stock !== null &&
                p.stock !== undefined &&
                p.stock > 0
              );
            })
          : [];
        setCart(validCart);
      }

      const savedFavs = localStorage.getItem(CLIENT_SESSION_KEYS.FAVS);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch {
      // Ignorar restricciones de navegador en modo privado
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLIENT_SESSION_KEYS.CART, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(CLIENT_SESSION_KEYS.FAVS, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const refreshStoreData = useCallback(async (includeAdminData = false) => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoadingCatalog(false);
      setIsPersistedInSupabase(false);
      return;
    }

    setIsLoadingCatalog(true);
    try {
      const [catRes, prodRes, galRes, banRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order", { ascending: true }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("store_gallery").select("*").order("display_order", { ascending: true }),
        supabase.from("store_banners").select("*").order("display_order", { ascending: true }),
      ]);

      if (!catRes.error && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setCategories(catRes.data.map(mapRowToCategory));
      }

      if (!prodRes.error && Array.isArray(prodRes.data)) {
        // Si ya hay productos reales en Supabase, mostrarlos; si la tabla está vacía, mantener catálogo base hasta que la administradora publique el primero
        if (prodRes.data.length > 0) {
          setProducts(prodRes.data.map(mapRowToProduct));
        }
        setIsPersistedInSupabase(true);
      }

      if (!galRes.error && Array.isArray(galRes.data) && galRes.data.length > 0) {
        setStoreGallery(galRes.data.map(mapRowToGalleryPhoto));
      }

      if (!banRes.error && Array.isArray(banRes.data) && banRes.data.length > 0) {
        setBanners(banRes.data.map(mapRowToBanner));
      }

      if (includeAdminData) {
        const ordRes = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (!ordRes.error && Array.isArray(ordRes.data)) {
          setOrders(ordRes.data.map(mapRowToOrder));
        }
      }
    } catch {
      // Conservar datos iniciales de respaldo si la red falla temporalmente
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshStoreData(false);
  }, [refreshStoreData]);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedVariants?: Record<string, string>,
    orderNotes?: string
  ) => {
    const effectivePrice = product.promoPrice ?? product.price;
    if (
      product.isDemo ||
      effectivePrice === null ||
      effectivePrice === undefined ||
      effectivePrice <= 0 ||
      product.stock === null ||
      product.stock === undefined
    ) {
      showToast(
        "Producto de referencia — Consulta disponibilidad directamente por WhatsApp.",
        "info"
      );
      return;
    }

    if (product.stock <= 0) {
      showToast("Lo sentimos, este producto está agotado temporalmente.", "error");
      return;
    }

    const maxAllowed = product.stock;

    setCart((prev) => {
      const variantSignature = JSON.stringify(selectedVariants || {});
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedVariants || {}) === variantSignature &&
          (item.orderNotes || "") === (orderNotes || "")
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const nextQty = Math.min(maxAllowed, updated[existingIndex].quantity + quantity);
        updated[existingIndex] = { ...updated[existingIndex], quantity: nextQty };
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity: Math.min(maxAllowed, quantity),
          selectedVariants,
          orderNotes,
        },
      ];
    });

    showToast(`¡"${product.name}" se agregó a tu carrito!`, "success");
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
    showToast("Artículo eliminado del carrito.", "info");
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const maxStock = updated[index].product.stock;
      const limit = maxStock !== null ? maxStock : 99;
      if (maxStock !== null && quantity > maxStock) {
        showToast(`Existencia máxima disponible: ${maxStock} unidades.`, "info");
      }
      updated[index] = {
        ...updated[index],
        quantity: Math.min(limit, quantity),
      };
      return updated;
    });
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(
        exists ? "Producto eliminado de tus favoritos" : "Producto guardado en tus favoritos",
        exists ? "info" : "success"
      );
      return next;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = cart.reduce((acc, item) => {
    const unitPrice = item.product.promoPrice ?? item.product.price ?? 0;
    return acc + unitPrice * item.quantity;
  }, 0);

  const hasUnpricedItemsInCart = cart.some(
    (item) => (item.product.promoPrice ?? item.product.price) === null
  );

  const createOrder = async (
    orderData: Omit<CustomerOrder, "id" | "createdAt" | "status">
  ): Promise<CustomerOrder> => {
    const newOrder: CustomerOrder = {
      ...orderData,
      id: `PED-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: "pendiente_whatsapp",
    };

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.from("orders").insert(mapOrderToRow(newOrder));
      if (error) {
        showToast(
          `Nota: El pedido se enviará por WhatsApp, pero no se pudo registrar en BD (${error.message}).`,
          "info"
        );
      }
    }

    setOrders((prev) => [newOrder, ...prev]);
    triggerCelebration();
    showToast(`¡Pedido ${newOrder.id} generado con éxito!`, "success");
    return newOrder;
  };

  const upsertProduct = async (product: Product): Promise<void> => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error(
        "Supabase no está configurado. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    const sanitizedProduct: Product = {
      ...product,
      images: (product.images || []).slice(0, 5),
    };

    const { error } = await supabase
      .from("products")
      .upsert(mapProductToRow(sanitizedProduct), { onConflict: "id" });

    if (error) {
      throw new Error(`No se pudo guardar el producto en Supabase: ${error.message}`);
    }

    setProducts((prev) => {
      const exists = prev.some((p) => p.id === sanitizedProduct.id);
      return exists
        ? prev.map((p) => (p.id === sanitizedProduct.id ? sanitizedProduct : p))
        : [sanitizedProduct, ...prev];
    });
    showToast(`Producto "${sanitizedProduct.name}" publicado y sincronizado.`, "success");
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase no está configurado.");
    }

    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      throw new Error(`No se pudo eliminar el producto: ${error.message}`);
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast("Producto eliminado permanentemente del catálogo.", "info");
  };

  const upsertCategory = async (category: Category): Promise<void> => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase no está configurado.");
    }

    const { error } = await supabase
      .from("categories")
      .upsert(mapCategoryToRow(category), { onConflict: "slug" });

    if (error) {
      throw new Error(`Error al guardar categoría: ${error.message}`);
    }

    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id || c.slug === category.slug);
      return exists
        ? prev.map((c) => (c.id === category.id || c.slug === category.slug ? category : c))
        : [...prev, category];
    });
    showToast(`Categoría "${category.name}" actualizada en la base de datos.`, "success");
  };

  const updateGalleryPhoto = async (
    photo: StoreGalleryPhoto,
    displayOrder = 1
  ): Promise<void> => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase no está configurado.");
    }

    const { error } = await supabase.from("store_gallery").upsert(
      {
        id: photo.id,
        title: photo.title,
        caption: photo.caption,
        image_url: photo.image,
        display_order: displayOrder,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      throw new Error(`Error al actualizar fotografía de galería: ${error.message}`);
    }

    setStoreGallery((prev) => {
      const exists = prev.some((g) => g.id === photo.id);
      return exists ? prev.map((g) => (g.id === photo.id ? photo : g)) : [...prev, photo];
    });
    showToast(`Fotografía "${photo.title}" guardada en Supabase.`, "success");
  };

  const upsertBanner = async (banner: StoreBanner): Promise<void> => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase no está configurado.");
    }

    const { error } = await supabase
      .from("store_banners")
      .upsert(mapBannerToRow(banner), { onConflict: "id" });

    if (error) {
      throw new Error(`Error al actualizar el banner: ${error.message}`);
    }

    setBanners((prev) => {
      const exists = prev.some((b) => b.id === banner.id);
      return exists ? prev.map((b) => (b.id === banner.id ? banner : b)) : [...prev, banner];
    });
    showToast("Banner promocional actualizado correctamente.", "success");
  };

  const updateOrderStatus = async (
    orderId: string,
    status: CustomerOrder["status"]
  ): Promise<void> => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase no está configurado.");
    }

    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      throw new Error(`Error al actualizar el pedido: ${error.message}`);
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    showToast(`Estado del pedido ${orderId} actualizado a "${status}".`, "success");
  };

  return (
    <MotionConfig reducedMotion="user">
      <StoreContext.Provider
        value={{
          categories,
          products,
          storeGallery,
          banners,
          cart,
          favorites,
          orders,
          isLoadingCatalog,
          isPersistedInSupabase,
          searchQuery,
          selectedCategory,
          sortBy,
          isCartOpen,
          isFavoritesOpen,
          activeProductModal,
          toastMessage,
          toastVariant,
          celebrationActive,
          setSearchQuery,
          setSelectedCategory,
          setSortBy,
          setIsCartOpen,
          setIsFavoritesOpen,
          setActiveProductModal,
          showToast,
          triggerCelebration,
          addToCart,
          removeFromCart,
          updateCartQuantity,
          clearCart,
          toggleFavorite,
          isFavorite,
          cartCount,
          cartSubtotal,
          hasUnpricedItemsInCart,
          refreshStoreData,
          createOrder,
          upsertProduct,
          deleteProduct,
          upsertCategory,
          updateGalleryPhoto,
          upsertBanner,
          updateOrderStatus,
        }}
      >
        {children}
      </StoreContext.Provider>
    </MotionConfig>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore debe utilizarse dentro de un StoreProvider");
  }
  return context;
}
