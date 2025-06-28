export interface OrderConfirmationEmailEvent {
  orderId: number;
  customerName: string;
  email: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}
