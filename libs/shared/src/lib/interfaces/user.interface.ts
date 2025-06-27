export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}