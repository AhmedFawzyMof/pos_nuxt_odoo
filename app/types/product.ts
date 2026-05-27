export interface POSCategory {
  id: number;
  name: string;
}

export interface InternalCategory {
  id: number;
  name: string;
}

export interface Product {
  id?: number;
  name: string;
  display_name?: string;
  barcode: string;
  type: "consu" | "service" | "product";
  categ_id?: [number, string] | null;
  internal_category?: InternalCategory | null;
  list_price: number;
  standard_price: number;
  qty_available: number;
  virtual_available: number;
  incoming_qty: number;
  outgoing_qty: number;
  weight: number;
  volume: number;
  sale_ok: boolean;
  purchase_ok: boolean;
  active: boolean;
  available_in_pos: boolean;
  to_weight?: boolean;
  location_id?: number | null;
  pos_categ_ids?: number[];
  pos_categories?: POSCategory[];
  image_1920?: string | null;
}
