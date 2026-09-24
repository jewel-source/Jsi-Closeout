export interface JewelryPhoto {
  url: string;
  alt?: string;
}
export interface JewelryItem {
  id: string;
  styleNumber: string;
  name: string;
  description: string;
  category: string;
  metal?: string;
  stone?: string;
  size?: string;
  ctw?: string;
  gtw?: string;
  collection?: string;
  closeoutYear?: string;
  soldOut?: boolean;
  quantityAvailable?: number;
  price?: number;
  photos: JewelryPhoto[];
}
export interface QuoteRequestItem {
  id: string;
  styleNumber: string;
  name: string;
  quantity: number;
}
