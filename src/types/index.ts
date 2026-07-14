export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "landlord" | "tenant";
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  price: number; // Giá thuê theo tháng (VND)
  area: number;  // Diện tích m2
  address: string;
  city: string;
  district: string;
  ward: string;
  images: string[];
  status: "available" | "rented" | "maintenance";
  facilities: string[]; // ['wifi', 'air_conditioner', 'parking', 'fridge'...]
  landlordId: string;
  landlord?: User;
  createdAt: string;
}

export interface Contract {
  id: string;
  roomId: string;
  room?: Room;
  tenantId: string;
  tenant?: User;
  startDate: string;
  endDate: string;
  rentalPrice: number;
  deposit: number;
  status: "pending" | "active" | "expired" | "terminated";
  createdAt: string;
}

export interface Invoice {
  id: string;
  contractId: string;
  amount: number;
  type: "rent" | "service" | "deposit" | "other";
  status: "unpaid" | "paid" | "overdue";
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}
