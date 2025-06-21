export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderConfirmationEmailEvent {
  orderId: number;
  customerName: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
}
