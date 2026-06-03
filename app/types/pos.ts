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
}

export interface Cart {
  items: CartItem[];
  note: string;
  customer_id?: number | null;
}

export interface PaymentMethod {
  id: number;
  name: string;
  is_cash_count: boolean;
}

export interface PaymentLine {
  method_id: number;
  method_name: string;
  amount: number;
}

export interface OrderPayload {
  session_id: number;
  items: CartItem[];
  payments: PaymentLine[];
  note: string;
  order_discount: number;
  order_discount_type: "fixed" | "percent";
  service_fee: number;
  service_fee_type: "fixed" | "percent";
  customer_id: number | null;
  location_id: number | null;
}

export interface OrderResponse {
  success: boolean;
  order_id: number;
  name: string;
  message: string;
}

export interface CashMovementResponse {
  success: boolean;
  new_balance: number;
  message: string;
}

export interface CashMovement {
  type: "cash_in" | "cash_out";
  amount: number;
  reason: string;
  date?: string;
}

export interface SessionSummary {
  session_name: string;
  orders_count: number;
  total_sales: number;
  opening_cash: number;
  cash_balance: number;
  cash_movements: CashMovement[];
}
