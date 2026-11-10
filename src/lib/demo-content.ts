import street from "@/assets/look-street.jpg";
import couture from "@/assets/look-couture.jpg";
import future from "@/assets/look-future.jpg";
import minimal from "@/assets/look-minimal.jpg";
import hero from "@/assets/hero-editorial.jpg";

export interface Designer { id: string; name: string; city: string; bio: string; avatar: string }
export interface Product { id: string; title: string; designer: string; price: number; image: string; category: string; description: string; likes: number }
export interface Inspiration { id: string; title: string; category: string; image: string; tags: string[] }

export const DESIGNERS: Designer[] = [
  { id: "aiko", name: "Aiko Mori", city: "Tokyo", bio: "Deconstructed streetwear and technical layering.", avatar: street },
  { id: "lena", name: "Lena Varga", city: "Paris", bio: "Sculptural couture in silk and satin.", avatar: couture },
  { id: "omar", name: "Omar Haddad", city: "Dubai", bio: "Metallic, futurist tailoring for the night.", avatar: future },
  { id: "sofi", name: "Sofi Lind", city: "Copenhagen", bio: "Quiet minimalism in natural fibres.", avatar: minimal },
  { id: "noir", name: "Maison Noir", city: "Milan", bio: "Oversized outerwear with hidden colour.", avatar: hero },
];

export const PRODUCTS: Product[] = [
  { id: "p1", title: "Shard Hoodie", designer: "aiko", price: 48, image: street, category: "Streetwear", description: "Heavyweight digital hoodie with violet geometric panels.", likes: 1240 },
  { id: "p2", title: "Pleat Gown No. 4", designer: "lena", price: 220, image: couture, category: "Haute couture", description: "Fan-pleated silk gown, single shoulder.", likes: 3120 },
  { id: "p3", title: "Chrome Crop Jacket", designer: "omar", price: 135, image: future, category: "Futuristic", description: "Liquid-metal cropped jacket with cyan piping trousers.", likes: 2070 },
  { id: "p4", title: "Linen Weekend Set", designer: "sofi", price: 64, image: minimal, category: "Minimalism", description: "Washed linen shirt over relaxed denim.", likes: 860 },
  { id: "p5", title: "Eclipse Coat", designer: "noir", price: 310, image: hero, category: "Luxury", description: "Volume coat with violet satin lining.", likes: 4410 },
  { id: "p6", title: "Night Grid Hoodie", designer: "aiko", price: 52, image: street, category: "Streetwear", description: "Reflective grid detail, dropped shoulder.", likes: 640 },
];

const CATS = ["Streetwear", "Luxury", "Minimalism", "Avant-garde", "Casual", "Haute couture", "Futuristic"] as const;
export const INSPIRATION_CATEGORIES = CATS;
const IMG: Record<string, string> = {
  Streetwear: street, Luxury: hero, Minimalism: minimal, "Avant-garde": future, Casual: minimal, "Haute couture": couture, Futuristic: future,
};
export const INSPIRATION: Inspiration[] = CATS.flatMap((c, i) => [
  { id: `${i}a`, title: `${c} study I`, category: c, image: IMG[c], tags: [c.toLowerCase(), "editorial"] },
  { id: `${i}b`, title: `${c} study II`, category: c, image: IMG[c], tags: [c.toLowerCase(), "lookbook"] },
]);
