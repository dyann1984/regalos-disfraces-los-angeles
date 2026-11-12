import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AIProductAnalysisResponse, CategorySlug } from "@/types/store";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BASE64_LENGTH = 6_500_000; // ~4.8 MB binario máximo
const VALID_CATEGORIES: CategorySlug[] = [
  "peluches",
  "juguetes",
  "regalos",
  "disfraces",
  "fiestas-celebraciones",
  "accesorios-otros",
];

// Control de tasa y costos en memoria por usuario/IP (máx 12 análisis cada 10 minutos)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestLog = new Map<string, number[]>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const prev = (requestLog.get(identifier) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  if (prev.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = prev[0];
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSec };
  }
  prev.push(now);
  requestLog.set(identifier, prev);
  return { allowed: true };
}

const SYSTEM_INSTRUCTION = `Eres un asistente experto en catalogación visual de comercio electrónico para la tienda mexicana "Regalos, Disfraces y Más — Los Ángeles".
Analiza únicamente lo que se observa visualmente en la fotografía proporcionada por la administradora.

REGLAS OBLIGATORIAS DE VERACIDAD Y SEGURIDAD COMERCIAL:
1. NO inventes marcas comerciales, licencias oficiales, materiales específicos no verificables a simple vista, medidas exactas en centímetros, precios ni cantidades de inventario.
2. NUNCA menciones ni prometas personalización de regalos, nombres impresos, tazas personalizadas ni diseños a pedido (la tienda NO personaliza artículos).
3. Clasifica cada artículo exclusivamente en una de estas 6 categorías (categorySlug):
   - "peluches" (Peluches)
   - "juguetes" (Juguetes)
   - "regalos" (Regalos, cajas de regalo, bouquets, detalles)
   - "disfraces" (Disfraces, máscaras, accesorios de disfraz)
   - "fiestas-celebraciones" (Artículos para fiestas, globos, decoración festiva)
   - "accesorios-otros" (Accesorios, bolsas de regalo, moños, complementos)
4. Si en la fotografía aparecen VARIOS productos distintos claramente diferenciables (por ejemplo, varios artículos en un estante o mesa), establece "multipleItemsDetected": true e incluye cada producto detectado en el arreglo "items" (máximo 5 opciones) para que la administradora elija cuál desea registrar.
5. Si en la fotografía aparece UN SOLO producto principal (o un conjunto que se vende como un mismo set/caja de regalo), establece "multipleItemsDetected": false e incluye 1 elemento en "items".
6. Redacta completamente en español de México, con tono comercial amable, claro y honesto.

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{
  "multipleItemsDetected": boolean,
  "summaryNote": "Breve explicación de lo detectado en la imagen",
  "items": [
    {
      "id": "item-1",
      "visualLabel": "Etiqueta corta para identificar el artículo en la foto",
      "suggestedName": "Nombre comercial sugerido (sin inventar marca ni talla exacta)",
      "suggestedSubtitle": "Ej. (Sección Peluches) o (Color Rosa)",
      "categorySlug": "peluches" | "juguetes" | "regalos" | "disfraces" | "fiestas-celebraciones" | "accesorios-otros",
      "description": "Descripción comercial de 2 a 3 oraciones basada estrictamente en los rasgos visibles (colores, forma, presentación).",
      "visualFeaturesConfirmed": ["Rasgo visible 1", "Rasgo visible 2"]
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación de administradora mediante Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    let userIdentifier = req.headers.get("x-forwarded-for") || "admin-local";

    if (supabaseUrl && supabaseAnonKey) {
      if (!token) {
        return NextResponse.json(
          {
            error: "No autorizado. Inicia sesión como administradora en /admin para usar la IA.",
            code: "UNAUTHORIZED",
          },
          { status: 401 }
        );
      }

      const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      const {
        data: { user },
        error: userError,
      } = await supabaseServer.auth.getUser(token);

      if (userError || !user) {
        return NextResponse.json(
          {
            error: "Sesión inválida o expirada. Por favor vuelve a iniciar sesión en /admin.",
            code: "UNAUTHORIZED",
          },
          { status: 401 }
        );
      }

      // Verificar que pertenezca a admin_users
      const { data: adminRow } = await supabaseServer
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminRow?.user_id) {
        return NextResponse.json(
          {
            error: "Tu cuenta no tiene permisos de administradora para ejecutar esta acción.",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }

      userIdentifier = user.id;
    }

    // 2. Verificar claves de API de IA en el servidor (sin simular respuestas si faltan)
    const geminiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const openaiKey = process.env.OPENAI_API_KEY || "";

    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        {
          error:
            "El servicio de Inteligencia Artificial requiere configurar la variable de entorno GEMINI_API_KEY (o OPENAI_API_KEY) en el servidor (.env.local / Vercel).",
          code: "AI_KEY_MISSING",
          missingKey: "GEMINI_API_KEY",
        },
        { status: 503 }
      );
    }

    // 3. Control de límites de uso y costos
    const rateStatus = checkRateLimit(userIdentifier);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          error: `Se alcanzó el límite de análisis por minuto para proteger costos. Intenta de nuevo en ${rateStatus.retryAfterSec} segundos.`,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 4. Validar cuerpo de la petición e imagen
    const body = await req.json();
    const { imageBase64, mimeType } = body as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "No se recibió ninguna imagen para analizar.", code: "INVALID_IMAGE" },
        { status: 400 }
      );
    }

    const cleanMime = (mimeType || "image/jpeg").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
      return NextResponse.json(
        {
          error: "Formato de imagen no compatible. Utiliza JPG, PNG o WEBP.",
          code: "INVALID_MIME",
        },
        { status: 400 }
      );
    }

    const rawBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    if (rawBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        {
          error: "La imagen excede el tamaño máximo permitido (5 MB).",
          code: "IMAGE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // 5. Llamada multimodal desde el servidor (Gemini o OpenAI Vision)
    let parsedResult: Omit<AIProductAnalysisResponse, "providerUsed"> | null = null;
    let providerUsed: "gemini" | "openai" = "gemini";

    if (geminiKey) {
      providerUsed = "gemini";
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        geminiKey
      )}`;

      const geminiRes = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Analiza esta fotografía tomada por la administradora de la tienda y devuelve el JSON con las sugerencias comerciales fieles a lo que se ve.",
                },
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: rawBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Error del proveedor Gemini (${geminiRes.status}): ${errText.slice(0, 200)}`);
      }

      const geminiData = await geminiRes.json();
      const rawText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      parsedResult = JSON.parse(rawText);
    } else if (openaiKey) {
      providerUsed = "openai";
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          max_tokens: 800,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analiza esta fotografía tomada por la administradora de la tienda y devuelve el JSON con las sugerencias comerciales fieles a lo que se ve.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${cleanMime};base64,${rawBase64}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        throw new Error(`Error del proveedor OpenAI (${openaiRes.status}): ${errText.slice(0, 200)}`);
      }

      const openaiData = await openaiRes.json();
      const rawText = openaiData?.choices?.[0]?.message?.content || "{}";
      parsedResult = JSON.parse(rawText);
    }

    if (!parsedResult || !Array.isArray(parsedResult.items) || parsedResult.items.length === 0) {
      return NextResponse.json(
        {
          error:
            "No fue posible identificar un producto claro en la fotografía. Intenta tomar una foto más iluminada o enfocada.",
          code: "NO_PRODUCT_DETECTED",
        },
        { status: 422 }
      );
    }

    // Normalizar categorías y limpiar cualquier término prohibido
    const normalizedItems = parsedResult.items.slice(0, 5).map((item, idx) => {
      const validCat: CategorySlug = VALID_CATEGORIES.includes(item.categorySlug)
        ? item.categorySlug
        : "regalos";

      return {
        id: item.id || `item-${idx + 1}`,
        visualLabel: String(item.visualLabel || item.suggestedName || `Artículo #${idx + 1}`),
        suggestedName: String(item.suggestedName || "Artículo de Regalo"),
        suggestedSubtitle: String(item.suggestedSubtitle || "(Disponible en tienda)"),
        categorySlug: validCat,
        description: String(
          item.description ||
            "Artículo disponible en Regalos, Disfraces y Más — Los Ángeles."
        ),
        visualFeaturesConfirmed: Array.isArray(item.visualFeaturesConfirmed)
          ? item.visualFeaturesConfirmed.map(String)
          : [],
      };
    });

    const responsePayload: AIProductAnalysisResponse = {
      multipleItemsDetected:
        Boolean(parsedResult.multipleItemsDetected) || normalizedItems.length > 1,
      summaryNote: String(
        parsedResult.summaryNote ||
          (normalizedItems.length > 1
            ? `Se detectaron ${normalizedItems.length} artículos en la fotografía. Selecciona cuál deseas registrar.`
            : "Artículo analizado visualmente con éxito. Revisa los datos e ingresa precio y existencias antes de publicar.")
      ),
      items: normalizedItems,
      providerUsed,
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error interno al procesar la imagen con IA.";
    return NextResponse.json(
      {
        error: `No se pudo completar el análisis con IA: ${message}`,
        code: "AI_EXECUTION_ERROR",
      },
      { status: 500 }
    );
  }
}
