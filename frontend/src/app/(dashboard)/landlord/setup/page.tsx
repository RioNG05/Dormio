"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LoaderCircle, Plus, Trash2, Wrench } from "lucide-react";
import {
  createBoardingHouse,
  type InitialRoomTypePayload,
  type InitialServicePayload,
} from "@/services/boarding-house.service";

type ServiceDraft = InitialServicePayload & { id: string };
type RoomTypeDraft = InitialRoomTypePayload & { id: string };

const createDraftId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyService = (): ServiceDraft => ({
  id: createDraftId(),
  name: "",
  unit: "",
  price: "",
  isMetered: false,
});

const emptyRoomType = (): RoomTypeDraft => ({
  id: createDraftId(),
  name: "",
  description: "",
});

export default function SetupWizardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    description: "",
    country: "Việt Nam",
    province: "",
    city: "",
    district: "",
    ward: "",
    street: "",
    houseNumber: "",
    totalFloor: "",
    builtAt: "",
  });
  const [services, setServices] = useState<ServiceDraft[]>([
    { ...emptyService(), name: "Điện", unit: "kWh", price: "3500", isMetered: true },
    { ...emptyService(), name: "Nước", unit: "m³", price: "25000", isMetered: true },
  ]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDraft[]>([emptyRoomType()]);

  const updateProfile = (field: keyof typeof profile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const updateService = (
    id: string,
    field: keyof InitialServicePayload,
    value: string | boolean,
  ) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id ? { ...service, [field]: value } : service,
      ),
    );
  };

  const updateRoomType = (
    id: string,
    field: keyof InitialRoomTypePayload,
    value: string,
  ) => {
    setRoomTypes((current) =>
      current.map((roomType) =>
        roomType.id === id ? { ...roomType, [field]: value } : roomType,
      ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const hasIncompleteService = services.some(
      (service) =>
        !service.name.trim() ||
        !service.unit.trim() ||
        !/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(service.price.trim()),
    );
    const hasIncompleteRoomType = roomTypes.some(
      (roomType) => !roomType.name.trim() && roomType.description?.trim(),
    );

    if (hasIncompleteService) {
      setError("Vui lòng điền đầy đủ tên, đơn vị và đơn giá hợp lệ cho từng dịch vụ.");
      return;
    }

    if (hasIncompleteRoomType) {
      setError("Loại phòng có mô tả cần có tên loại phòng.");
      return;
    }

    const submittedRoomTypes = roomTypes
      .filter((roomType) => roomType.name.trim())
      .map((roomType) => ({
        name: roomType.name.trim(),
        description: roomType.description?.trim() || undefined,
      }));

    setIsSubmitting(true);
    try {
      const boardingHouse = await createBoardingHouse({
        name: profile.name.trim(),
        description: profile.description.trim() || undefined,
        country: profile.country.trim(),
        province: profile.province.trim(),
        city: profile.city.trim(),
        district: profile.district.trim(),
        ward: profile.ward.trim(),
        street: profile.street.trim(),
        houseNumber: profile.houseNumber.trim(),
        totalFloor: profile.totalFloor ? Number(profile.totalFloor) : undefined,
        builtAt: profile.builtAt,
        services: services.map((service) => ({
          name: service.name.trim(),
          unit: service.unit.trim(),
          price: service.price.trim(),
          isMetered: service.isMetered,
        })),
        roomTypes: submittedRoomTypes,
      });
      router.push(`/landlord/boarding-houses?created=${boardingHouse.id}`);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Đã xảy ra lỗi không xác định.";
      setError(`Không thể tạo hồ sơ nhà trọ. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div>
        <p className="text-sm font-semibold text-[#2AC1BC]">Thiết lập ban đầu</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
          Tạo hồ sơ nhà trọ
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Nhập thông tin cơ sở, dịch vụ và loại phòng để bắt đầu quản lý.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#2AC1BC]" />
            <h2 className="font-bold text-zinc-900">Thông tin nhà trọ</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên nhà trọ" required>
              <input required value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} className="form-input" placeholder="Ví dụ: Nhà trọ Ánh Dương" />
            </Field>
            <Field label="Số tầng">
              <input type="number" min="1" value={profile.totalFloor} onChange={(event) => updateProfile("totalFloor", event.target.value)} className="form-input" placeholder="Ví dụ: 5" />
            </Field>
            <Field label="Năm/Ngày xây dựng" required>
              <input required type="date" value={profile.builtAt} onChange={(event) => updateProfile("builtAt", event.target.value)} className="form-input" />
            </Field>
            <Field label="Quốc gia" required>
              <input required value={profile.country} onChange={(event) => updateProfile("country", event.target.value)} className="form-input" />
            </Field>
            <Field label="Tỉnh/Thành phố trực thuộc TW" required>
              <input required value={profile.province} onChange={(event) => updateProfile("province", event.target.value)} className="form-input" placeholder="Ví dụ: TP. Hồ Chí Minh" />
            </Field>
            <Field label="Thành phố/Thị xã" required>
              <input required value={profile.city} onChange={(event) => updateProfile("city", event.target.value)} className="form-input" placeholder="Ví dụ: TP. Thủ Đức" />
            </Field>
            <Field label="Quận/Huyện" required>
              <input required value={profile.district} onChange={(event) => updateProfile("district", event.target.value)} className="form-input" placeholder="Ví dụ: Quận 9" />
            </Field>
            <Field label="Phường/Xã" required>
              <input required value={profile.ward} onChange={(event) => updateProfile("ward", event.target.value)} className="form-input" placeholder="Ví dụ: Phường Long Thạnh Mỹ" />
            </Field>
            <Field label="Đường" required>
              <input required value={profile.street} onChange={(event) => updateProfile("street", event.target.value)} className="form-input" placeholder="Ví dụ: Nguyễn Văn Tăng" />
            </Field>
            <Field label="Số nhà" required>
              <input required value={profile.houseNumber} onChange={(event) => updateProfile("houseNumber", event.target.value)} className="form-input" placeholder="Ví dụ: 12/4" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Mô tả">
                <textarea value={profile.description} onChange={(event) => updateProfile("description", event.target.value)} className="form-input min-h-24 resize-y" placeholder="Mô tả ngắn về nhà trọ, tiện ích và vị trí..." />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#2AC1BC]" />
              <div>
                <h2 className="font-bold text-zinc-900">Dịch vụ ban đầu</h2>
                <p className="text-xs text-zinc-500">Đơn giá chỉ nhận tối đa hai chữ số thập phân.</p>
              </div>
            </div>
            <button type="button" onClick={() => setServices((current) => [...current, emptyService()])} className="secondary-button">
              <Plus className="h-4 w-4" /> Thêm dịch vụ
            </button>
          </div>

          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 p-4 md:grid-cols-[1fr_0.7fr_0.7fr_auto_auto] md:items-end">
                <Field label="Tên dịch vụ">
                  <input value={service.name} onChange={(event) => updateService(service.id, "name", event.target.value)} className="form-input" placeholder="Điện" />
                </Field>
                <Field label="Đơn vị">
                  <input value={service.unit} onChange={(event) => updateService(service.id, "unit", event.target.value)} className="form-input" placeholder="kWh" />
                </Field>
                <Field label="Đơn giá (₫)">
                  <input type="number" min="0" step="0.01" value={service.price} onChange={(event) => updateService(service.id, "price", event.target.value)} className="form-input" placeholder="3500" />
                </Field>
                <label className="flex h-10 items-center gap-2 text-sm font-medium text-zinc-700">
                  <input type="checkbox" checked={service.isMetered} onChange={(event) => updateService(service.id, "isMetered", event.target.checked)} className="h-4 w-4 accent-[#2AC1BC]" />
                  Theo đồng hồ
                </label>
                <button type="button" onClick={() => setServices((current) => current.filter((item) => item.id !== service.id))} className="icon-button" aria-label="Xóa dịch vụ">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-zinc-900">Loại phòng ban đầu</h2>
              <p className="text-xs text-zinc-500">Bạn có thể bổ sung hoặc chỉnh sửa sau.</p>
            </div>
            <button type="button" onClick={() => setRoomTypes((current) => [...current, emptyRoomType()])} className="secondary-button">
              <Plus className="h-4 w-4" /> Thêm loại phòng
            </button>
          </div>

          <div className="space-y-3">
            {roomTypes.map((roomType) => (
              <div key={roomType.id} className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 p-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
                <Field label="Tên loại phòng">
                  <input value={roomType.name} onChange={(event) => updateRoomType(roomType.id, "name", event.target.value)} className="form-input" placeholder="Ví dụ: Studio" />
                </Field>
                <Field label="Mô tả">
                  <input value={roomType.description ?? ""} onChange={(event) => updateRoomType(roomType.id, "description", event.target.value)} className="form-input" placeholder="Ví dụ: Có bếp và nhà vệ sinh riêng" />
                </Field>
                <button type="button" onClick={() => setRoomTypes((current) => current.filter((item) => item.id !== roomType.id))} className="icon-button" aria-label="Xóa loại phòng">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="secondary-button">Hủy bỏ</button>
          <button type="submit" disabled={isSubmitting} className="primary-button disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            {isSubmitting ? "Đang tạo..." : "Tạo hồ sơ nhà trọ"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-zinc-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>
      {children}
    </label>
  );
}
