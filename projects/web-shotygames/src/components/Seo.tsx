import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  /** URL canónica absoluta de esta página */
  canonical: string;
  /** Imagen absoluta para compartir en WhatsApp / Facebook */
  image?: string;
  type?: "website" | "product" | "article";
}

/**
 * Reemplazo casero de react-helmet-async.
 *
 * Por qué existe: react-helmet-async dejó de aplicar las meta tags en este
 * proyecto — ni la v2.0.5 ni la v1.3.0 escribían nada en el <head> (verificado
 * en producción y en build local: el atributo `data-rh` que la librería usa
 * para marcar sus tags nunca aparecía, y no había error en consola). El
 * resultado era que las ~12 landings compartían el título y la imagen
 * genéricos del index.html: al compartir cualquier link por WhatsApp salía
 * siempre lo mismo, y para Google todas las páginas se veían idénticas.
 *
 * Esto manipula document.head directamente, sin dependencias. Reutiliza la
 * tag si ya existe (para no duplicar las que vienen del index.html) y marca
 * las que crea con data-seo para poder limpiarlas al desmontar.
 */
export const Seo = ({ title, description, canonical, image, type = "website" }: SeoProps) => {
  useEffect(() => {
    document.title = title;

    const upsert = (
      selector: string,
      create: () => HTMLElement,
      apply: (el: HTMLElement) => void,
    ) => {
      let el = document.head.querySelector<HTMLElement>(selector);
      if (!el) {
        el = create();
        el.setAttribute("data-seo", "");
        document.head.appendChild(el);
      }
      apply(el);
    };

    const meta = (attr: "name" | "property", key: string, content: string) =>
      upsert(
        `meta[${attr}="${key}"]`,
        () => {
          const m = document.createElement("meta");
          m.setAttribute(attr, key);
          return m;
        },
        (el) => el.setAttribute("content", content),
      );

    meta("name", "description", description);

    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      },
      (el) => el.setAttribute("href", canonical),
    );

    meta("property", "og:title", title);
    meta("property", "og:description", description);
    meta("property", "og:url", canonical);
    meta("property", "og:type", type);

    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", title);
    meta("name", "twitter:description", description);

    if (image) {
      meta("property", "og:image", image);
      meta("name", "twitter:image", image);
    }
  }, [title, description, canonical, image, type]);

  return null;
};

export default Seo;
