export type UserRole = "shopper" | "admin";

export type ProductStatus = "active" | "draft" | "out_of_stock";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "successful" | "failed" | "timed_out";

export type DiscountType = "percentage" | "fixed" | "coupon" | "flash_sale";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
  parent?: Category | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  images: string[];
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartItemDB {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  tax_amount: number;
  total: number;
  status: OrderStatus;
  momo_transaction_id: string | null;
  momo_reference_id: string | null;
  payment_status: PaymentStatus;
  shipping_address: string;
  customer_phone: string;
  customer_name: string;
  notes: string | null;
  discount_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  customer?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Discount {
  id: string;
  type: DiscountType;
  value: number;
  code: string | null;
  max_usage: number | null;
  usage_count: number;
  min_cart_value: number | null;
  max_discount_cap: number | null;
  applicable_to: string | null;
  target_ids: string[];
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  store_name: string;
  store_description: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  contact_phone: string;
  whatsapp_number: string;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  delivery_fee: number;
  free_delivery_threshold: number | null;
  tax_percentage: number;
  currency_code: string;
  primary_color: string;
  updated_at: string;
}
