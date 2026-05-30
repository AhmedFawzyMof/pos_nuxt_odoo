export interface POSRegister {
  id: number;
  name: string;
  session_id: number | null;
  session_state:
    | "opened"
    | "closed"
    | "opening_control"
    | "closing_control"
    | "unknown";
}

export interface POSCategory {
  id: number;
  name: string;
  parent_id?: { id: number; name: string } | null;
  sequence: number;
  image?: string | null;
  productsCount: number;
}

export interface POSProduct {
  id: number;
  name: string;
  display_name: string;
  barcode: string;
  type: "consu" | "service" | "product";
  list_price: number;
  standard_price: number;
  qty_available: number;
  virtual_available: number;
  incoming_qty: number;
  outgoing_qty: number;
  weight: number;
  volume: number;
  sale_ok: boolean;
  active: boolean;
  available_in_pos: boolean;
  to_weight?: boolean;
  pos_categ_ids?: number[];
  pos_categories?: { id: number; name: string }[];
  image_1920?: string | null;
  categ_id?: [number, string] | null;
  taxes_id?: number[];
  stock_by_location?: { location_id: number; location_name: string; quantity: number }[];
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
  price: number;
  discount: number;
  tax_ids?: number[];
  tax_percentage?: number;
}

export interface Cart {
  items: CartItem[];
  note: string;
  customer_id?: number | null;
}
