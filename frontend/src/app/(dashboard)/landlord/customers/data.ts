export interface Customer {
  id: string;
  name: string;
  phone: string;
  room: string;
  building: string;
  cccd: string;
  joinDate: string;
  endDate?: string;
  daysRemaining?: number;
  status: "Đang ở" | "Sắp hết hợp đồng" | "Đã rời" | string;
  dob?: string;
  gender?: string;
  address?: string;
  email?: string;
  job?: string;
  workplace?: string;
  note?: string;
  hasAccount?: boolean;
  accountEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemTenantUser {
  userId: string;
  name: string;
  phone: string;
  email: string;
  cccd: string;
  dob: string;
  gender: string;
  address: string;
  job: string;
  workplace: string;
  avatarUrl?: string;
}

export const getCustomerById = (_id: string): Customer | null => {
  return null;
};
