export type Category = { name: string; slug: string };

export type Product = {
  id: number;
  name: string;
  slug: string;
  priceKobo: number;
  stock: number;
  illustrativePhoto: boolean;
  category: Category;
  imageUrl: string | null;
};

export type ProductDetail = Product & {
  description: string;
  specs: { label: string; value: string }[];
  imageUrls: string[];
};

export type CategoryWithCount = Category & { count: number };

export type CartLine = {
  productId: number;
  name: string;
  slug: string;
  priceKobo: number;
  stock: number;
  quantity: number;
  lineTotalKobo: number;
  exceedsStock: boolean;
  category: Category;
  imageUrl: string | null;
};

export type Cart = {
  itemCount: number;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  hasStockProblem: boolean;
  lines: CartLine[];
};

export type User = { id: string; name: string | null; email: string | null; image: string | null };

export type Session = { token: string; user: User };

export type RealtimeConfig = { key: string; cluster: string; channel: string; event: string };
