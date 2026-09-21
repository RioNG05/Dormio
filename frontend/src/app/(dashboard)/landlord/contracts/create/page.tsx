"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Check,
    ChevronRight,
    ChevronLeft,
    FileSignature,
    User,
    DollarSign,
    Home,
    AlertCircle,
    Sparkles,
    Search,
    ShieldCheck,
    IdCard,
    Building2,
    Calendar,
    Info,
    Loader2,
    X,
    AlertTriangle,
    Lock,
    Unlock,
    ExternalLink,
    UploadCloud,
    Trash2,
    Eye,
    RefreshCw,
    Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { getRooms, RoomItem } from "@/services/room.service";
import {
    getPendingPlatformDeposit,
    searchTenantByPhone,
    createPlatformContract,
    createDirectContract,
    PendingDepositResponse,
} from "@/services/contract.service";
import {
    TextInput,
    DateInput,
    NumberInput,
    SelectInput,
    TextareaInput,
} from "@/components/ui";
import { uploadImageToBackend } from "@/services/upload.service";

/**
 * Formats JSON address or string to readable text
 */
function formatAddress(val: any): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
        if (val.address) return String(val.address);
        return Object.values(val)
            .filter((v) => typeof v === "string" && v.trim())
            .join(", ");
    }
    return String(val);
}

export default function CreateContractPageWrapper() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC]" />
                </div>
            }
        >
            <CreateContractPage />
        </Suspense>
    );
}

function CreateContractPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRoomId = searchParams.get("roomId") || "";
    const { activeBuilding } = useAuth();
    const t = useTranslations("landlord");
    const { locale } = useLanguage();
    const isEn = locale === "en";

    // Wizard Step
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();

    // Rooms list & loading
    const [rooms, setRooms] = useState<RoomItem[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    // Form State
    const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
    const [flowType, setFlowType] = useState<"platform" | "direct">("direct");
    const [pendingDeposit, setPendingDeposit] = useState<PendingDepositResponse | null>(null);
    const [isCheckingDeposit, setIsCheckingDeposit] = useState(false);

    // Tenant Fields
    const [tenantPhone, setTenantPhone] = useState("");
    const [tenantFullName, setTenantFullName] = useState("");
    const [tenantEmail, setTenantEmail] = useState("");
    const [isSearchingPhone, setIsSearchingPhone] = useState(false);
    const [tenantFound, setTenantFound] = useState<boolean | null>(null);
    const [hasIdentification, setHasIdentification] = useState(false);

    // Identification (CCCD) Fields (from UserIdentification schema)
    const [showIdForm, setShowIdForm] = useState(false);
    const [identityNumber, setIdentityNumber] = useState("");
    const [idFullName, setIdFullName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("2000-01-01");
    const [gender, setGender] = useState<"male" | "female">("male");
    const [nationality, setNationality] = useState("Việt Nam");
    const [placeOfOrigin, setPlaceOfOrigin] = useState("");
    const [placeOfResidence, setPlaceOfResidence] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [idNote, setIdNote] = useState("");
    const [cardFrontUrl, setCardFrontUrl] = useState("");
    const [cardBackUrl, setCardBackUrl] = useState("");
    const [uploadingFront, setUploadingFront] = useState(false);
    const [uploadingBack, setUploadingBack] = useState(false);
    const [isDraggingFront, setIsDraggingFront] = useState(false);
    const [isDraggingBack, setIsDraggingBack] = useState(false);
    const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string } | null>(null);

    // Landlord can ONLY edit tenant info if Flow B AND user does NOT exist in system
    const canEditTenantInfo = flowType !== "platform" && tenantFound === false;

    // Terms & Financials
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [endDate, setEndDate] = useState(
        new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    );
    const [rentPrice, setRentPrice] = useState<number>(3500000);
    const [depositAmount, setDepositAmount] = useState<number>(3500000);
    const [monthlyPaymentDate, setMonthlyPaymentDate] = useState<number>(5);
    const [rentPaymentCycle, setRentPaymentCycle] = useState<number>(1);
    const [note, setNote] = useState("");

    // UI status
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    // UUID regex to ensure we only send real UUIDs to the backend
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Load rooms for the active building
    useEffect(() => {
        async function loadRooms() {
            if (!activeBuilding?.id || !UUID_REGEX.test(activeBuilding.id)) {
                setRooms([]);
                return;
            }

            setIsLoadingRooms(true);
            try {
                const res = await getRooms(activeBuilding.id, { limit: 100 });
                if (res?.data && res.data.length > 0) {
                    setRooms(res.data);
                } else {
                    setRooms([]);
                }
            } catch (err) {
                console.warn("Failed to load rooms from API:", err);
                setRooms([]);
            } finally {
                setIsLoadingRooms(false);
            }
        }
        loadRooms();
    }, [activeBuilding?.id]);

    // Check deposit whenever room selection changes
    useEffect(() => {
        async function checkDeposit() {
            if (!selectedRoomId || !activeBuilding?.id) {
                setPendingDeposit(null);
                setFlowType("direct");
                return;
            }

            // Skip API if building or room is not a UUID
            if (!UUID_REGEX.test(activeBuilding.id) || !UUID_REGEX.test(selectedRoomId)) {
                setPendingDeposit(null);
                setFlowType("direct");
                return;
            }

            setIsCheckingDeposit(true);
            try {
                const res = await getPendingPlatformDeposit(activeBuilding.id, selectedRoomId);
                if (res?.data) {
                    // Flow A detected!
                    setPendingDeposit(res.data);
                    setFlowType("platform");
                    setDepositAmount(res.data.amount);
                    if (res.data.tenant) {
                        setTenantPhone(res.data.tenant.phoneNumber || "");
                        setTenantFullName(res.data.tenant.fullName || "");
                        setTenantEmail(res.data.tenant.email || "");
                        setTenantFound(true);
                        setHasIdentification(!!res.data.tenant.userIdentification);
                        if (res.data.tenant.userIdentification) {
                            const id = res.data.tenant.userIdentification;
                            setIdentityNumber(id.identityNumber || "");
                            setIdFullName(id.fullName || res.data.tenant.fullName || "");
                            if (id.dateOfBirth) {
                                try {
                                    setDateOfBirth(new Date(id.dateOfBirth).toISOString().split("T")[0]);
                                } catch {
                                    setDateOfBirth("2000-01-01");
                                }
                            }
                            if (id.gender) {
                                setGender(id.gender === "female" ? "female" : "male");
                            }
                            setNationality(id.nationnality || id.nationality || "Việt Nam");
                            setPlaceOfOrigin(formatAddress(id.placeOfOrigin));
                            setPlaceOfResidence(formatAddress(id.placeOfResidence));
                            if (id.issueDate) {
                                try {
                                    setIssueDate(new Date(id.issueDate).toISOString().split("T")[0]);
                                } catch {
                                    setIssueDate("");
                                }
                            }
                            if (id.expiryDate) {
                                try {
                                    setExpiryDate(new Date(id.expiryDate).toISOString().split("T")[0]);
                                } catch {
                                    setExpiryDate("");
                                }
                            }
                            setIdNote(id.note || "");
                            setCardFrontUrl(id.cardFrontUrl || "");
                            setCardBackUrl(id.cardBackUrl || "");
                            setShowIdForm(true);
                        }
                    }
                } else {
                    // Flow B
                    setPendingDeposit(null);
                    setFlowType("direct");
                }
            } catch (err) {
                console.warn("Check deposit failed or none present, defaulting to direct flow:", err);
                setPendingDeposit(null);
                setFlowType("direct");
            } finally {
                setIsCheckingDeposit(false);
            }
        }
        checkDeposit();
    }, [selectedRoomId, activeBuilding?.id]);

    // Handle phone change & auto-reset
    const handlePhoneChange = (val: string) => {
        const cleanVal = val.replace(/\D/g, "").slice(0, 10);
        setTenantPhone(cleanVal);
        setIsDirty(true);

        // Reset tenant search status & fields if phone changed
        if (tenantFound !== null) {
            setTenantFound(null);
            setTenantFullName("");
            setTenantEmail("");
            setHasIdentification(false);
            setIdentityNumber("");
            setIdFullName("");
            setDateOfBirth("2000-01-01");
            setGender("male");
            setNationality("Việt Nam");
            setPlaceOfOrigin("");
            setPlaceOfResidence("");
            setIssueDate("");
            setExpiryDate("");
            setIdNote("");
            setCardFrontUrl("");
            setCardBackUrl("");
        }

        if (cleanVal.length === 10) {
            handleSearchPhone(cleanVal);
        }
    };

    // Handle phone search debounce / action
    const handleSearchPhone = async (phoneToSearch: string) => {
        const cleanPhone = phoneToSearch.replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length !== 10) return;
        setIsSearchingPhone(true);
        setErrorMessage(null);
        try {
            const res = await searchTenantByPhone(cleanPhone);
            if (res?.data?.exists && res.data.user) {
                setTenantFound(true);
                setTenantFullName(res.data.user.fullName || "");
                setTenantEmail(res.data.user.email || "");
                setHasIdentification(res.data.user.hasIdentification);
                if (res.data.user.identification) {
                    const id = res.data.user.identification;
                    setIdentityNumber(id.identityNumber || "");
                    setIdFullName(id.fullName || res.data.user.fullName || "");
                    if (id.dateOfBirth) {
                        try {
                            setDateOfBirth(new Date(id.dateOfBirth).toISOString().split("T")[0]);
                        } catch {
                            setDateOfBirth("2000-01-01");
                        }
                    }
                    if (id.gender) {
                        setGender(id.gender === "female" ? "female" : "male");
                    }
                    setNationality(id.nationnality || id.nationality || "Việt Nam");
                    setPlaceOfOrigin(formatAddress(id.placeOfOrigin));
                    setPlaceOfResidence(formatAddress(id.placeOfResidence));
                    if (id.issueDate) {
                        try {
                            setIssueDate(new Date(id.issueDate).toISOString().split("T")[0]);
                        } catch {
                            setIssueDate("");
                        }
                    }
                    if (id.expiryDate) {
                        try {
                            setExpiryDate(new Date(id.expiryDate).toISOString().split("T")[0]);
                        } catch {
                            setExpiryDate("");
                        }
                    }
                    setIdNote(id.note || "");
                    setCardFrontUrl(id.cardFrontUrl || "");
                    setCardBackUrl(id.cardBackUrl || "");
                    setShowIdForm(true);
                } else {
                    setIdentityNumber("");
                    setIdFullName("");
                    setPlaceOfOrigin("");
                    setPlaceOfResidence("");
                    setIssueDate("");
                    setExpiryDate("");
                    setIdNote("");
                    setCardFrontUrl("");
                    setCardBackUrl("");
                    setShowIdForm(false);
                }
            } else {
                setTenantFound(false);
                setHasIdentification(false);
                setTenantFullName("");
                setTenantEmail("");
                setIdentityNumber("");
                setIdFullName("");
                setDateOfBirth("2000-01-01");
                setGender("male");
                setNationality("Việt Nam");
                setPlaceOfOrigin("");
                setPlaceOfResidence("");
                setIssueDate("");
                setExpiryDate("");
                setIdNote("");
                setCardFrontUrl("");
                setCardBackUrl("");
                setShowIdForm(true);
            }
        } catch (err) {
            console.error("Search tenant failed:", err);
            setTenantFound(false);
            setHasIdentification(false);
            setShowIdForm(true);
        } finally {
            setIsSearchingPhone(false);
        }
    };

    // Helper to compress citizen ID photos before saving
    const compressImageFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new window.Image();
                img.onload = () => {
                    const maxDim = 1600;
                    let { width, height } = img;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.85));
                    } else {
                        resolve((readerEvent.target?.result as string) || "");
                    }
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        side: "front" | "back"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset the file input so user can re-select the same file if needed
        e.target.value = "";

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage("Kích thước tệp vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.");
            return;
        }

        const setUploading = side === "front" ? setUploadingFront : setUploadingBack;
        const setUrl = side === "front" ? setCardFrontUrl : setCardBackUrl;

        setUploading(true);
        try {
            const compressedDataUrl = await compressImageFile(file);
            setUrl(compressedDataUrl);
            setIsDirty(true);

            // Delegate upload to backend! Backend handles Cloudinary storage
            try {
                const res = await uploadImageToBackend(compressedDataUrl, "dormio/identifications");
                if (res?.url) {
                    setUrl(res.url);
                }
            } catch (cloudErr) {
                console.warn("Backend upload deferred to form submission:", cloudErr);
            }
        } catch (err: any) {
            console.error("Error processing image:", err);
            setErrorMessage("Không thể xử lý ảnh. Vui lòng thử lại.");
        } finally {
            setUploading(false);
        }
    };

    const handleDropFile = (e: React.DragEvent, side: "front" | "back") => {
        e.preventDefault();
        e.stopPropagation();
        if (side === "front") setIsDraggingFront(false);
        else setIsDraggingBack(false);

        if (!canEditTenantInfo) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const fakeEvent = {
                target: {
                    files: e.dataTransfer.files,
                    value: "",
                },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handlePhotoUpload(fakeEvent, side);
        }
    };

    // Rule 10: Modal / Form Close Handling with custom Confirmation Modal
    const handleAttemptClose = () => {
        if (isDirty) {
            setShowConfirmClose(true);
        } else {
            router.push("/landlord/contracts");
        }
    };

    const handleConfirmClose = () => {
        setShowConfirmClose(false);
        router.push("/landlord/contracts");
    };

    // Form Submission
    const handleSubmitContract = async () => {
        if (!selectedRoomId) {
            setErrorMessage(t("landlordContractsCreateErrSelectRoom"));
            setStep(1);
            return;
        }

        if (!activeBuilding?.id) {
            setErrorMessage(t("landlordContractsCreateErrNoBuilding"));
            return;
        }

        setErrorMessage(null);

        startTransition(async () => {
            try {
                const isRealApi =
                    UUID_REGEX.test(activeBuilding.id) && UUID_REGEX.test(selectedRoomId);

                if (isRealApi) {
                    if (flowType === "platform") {
                        // Flow A submission
                        await createPlatformContract(activeBuilding.id, {
                            roomId: selectedRoomId,
                            startDate: new Date(startDate).toISOString(),
                            endDate: new Date(endDate).toISOString(),
                            rentPrice: Number(rentPrice),
                            monthlyPaymentDate: Number(monthlyPaymentDate),
                            rentPaymentCycle: Number(rentPaymentCycle),
                            note: note || undefined,
                        });
                    } else {
                        // Flow B submission
                        if (!tenantPhone || tenantPhone.length !== 10) {
                            setErrorMessage(t("landlordContractsCreateTenantPhoneLockedHint") || "Vui lòng nhập đúng 10 số điện thoại khách thuê.");
                            setStep(1);
                            return;
                        }

                        if (tenantFound === null) {
                            setErrorMessage("Vui lòng đợi hoặc bấm kiểm tra số điện thoại khách thuê trước khi tiếp tục.");
                            setStep(1);
                            return;
                        }

                        if (tenantFound === false && !tenantFullName.trim()) {
                            setErrorMessage(t("landlordContractsCreateErrTenantInfo"));
                            setStep(1);
                            return;
                        }

                        const payload: any = {
                            roomId: selectedRoomId,
                            startDate: new Date(startDate).toISOString(),
                            endDate: new Date(endDate).toISOString(),
                            rentPrice: Number(rentPrice),
                            depositAmount: Number(depositAmount),
                            monthlyPaymentDate: Number(monthlyPaymentDate),
                            rentPaymentCycle: Number(rentPaymentCycle),
                            note: note || undefined,
                            tenantPhoneNumber: tenantPhone,
                            tenantFullName: tenantFullName.trim(),
                            tenantEmail: tenantEmail?.trim() || undefined,
                        };

                        if (showIdForm && identityNumber.trim()) {
                            payload.identification = {
                                identityNumber: identityNumber.trim(),
                                fullName: (idFullName || tenantFullName).trim(),
                                dateOfBirth: new Date(dateOfBirth).toISOString(),
                                gender,
                                nationality: nationality?.trim() || "Việt Nam",
                                placeOfOrigin: placeOfOrigin?.trim() ? { address: placeOfOrigin.trim() } : undefined,
                                placeOfResidence: placeOfResidence?.trim() ? { address: placeOfResidence.trim() } : undefined,
                                issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
                                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
                                note: idNote?.trim() || undefined,
                                cardFrontUrl: cardFrontUrl?.trim() || undefined,
                                cardBackUrl: cardBackUrl?.trim() || undefined,
                            };
                        }

                        await createDirectContract(activeBuilding.id, payload);
                    }
                }

                router.push("/landlord/contracts?created=true");
            } catch (err: any) {
                console.error("Submit contract failed:", err);
                setErrorMessage(
                    err?.message ||
                    t("landlordContractsCreateErrGeneric"),
                );
            }
        });
    };

    const selectedRoomObj = rooms.find((r) => r.id === selectedRoomId);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        <Building2 className="w-3.5 h-3.5 text-[#2AC1BC]" />
                        <span>{activeBuilding?.name || (isEn ? "Property" : "Khu trọ")}</span>
                        <span>&bull;</span>
                        <span></span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                        {t("landlordContractsCreateTitle")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                        {t("landlordContractsCreateSubtitle")}
                    </p>
                </div>
            </div>

            {/* Progress Wizard */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${step === 1
                        ? "bg-[#2AC1BC] text-white shadow-sm shadow-[#2AC1BC]/30"
                        : step > 1
                            ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                >
                    {step > 1 ? <Check className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                    {t("landlordContractsCreateStep1Btn")}
                </button>

                <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />

                <button
                    type="button"
                    onClick={() => step > 1 && setStep(2)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${step === 2
                        ? "bg-[#2AC1BC] text-white shadow-sm shadow-[#2AC1BC]/30"
                        : step > 2
                            ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                >
                    {step > 2 ? <Check className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                    {t("landlordContractsCreateStep2Btn")}
                </button>

                <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />

                <button
                    type="button"
                    onClick={() => step > 2 && setStep(3)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${step === 3
                        ? "bg-[#2AC1BC] text-white shadow-sm shadow-[#2AC1BC]/30"
                        : "bg-zinc-100 text-zinc-400"
                        }`}
                >
                    <FileSignature className="w-3.5 h-3.5" />
                    {t("landlordContractsCreateStep3Header")}
                </button>
            </div>

            {/* STEP 1: Phòng & Khách thuê */}
            {step === 1 && (
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
                    {/* Room Selection */}
                    <div className="space-y-3 border-b border-zinc-100 pb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                                <Home className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordContractsCreateRoomSelectLabel")}
                            </h2>
                            {isCheckingDeposit && (
                                <span className="flex items-center gap-1.5 text-xs text-[#2AC1BC] font-bold">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("landlordContractsCreateTenantSearching")}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SelectInput
                                label={t("landlordContractsCreateRoomSelectLabel")}
                                required
                                value={selectedRoomId}
                                onChange={(e) => {
                                    setSelectedRoomId(e.target.value);
                                    setIsDirty(true);
                                }}
                            >
                                <option value="">{t("landlordContractsCreateRoomPlaceholder")}</option>
                                {rooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {t("landlordContractDetailRoomPrefix")} {r.roomNumber} ({t("landlordRoomDetailFloor")} {r.floor} - {r.roomType?.name || "Standard"} - {r.status})
                                    </option>
                                ))}
                            </SelectInput>

                            {selectedRoomObj && (
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs font-bold">
                                    <div>
                                        <span className="text-zinc-500 block text-[11px]">{t("landlordContractDetailRoomPrefix")}:</span>
                                        <span className="text-zinc-900 font-extrabold text-sm">
                                            {t("landlordContractDetailRoomPrefix")} {selectedRoomObj.roomNumber}
                                        </span>
                                        <span className="text-zinc-500 ml-1 text-xs">
                                            ({t("landlordRoomDetailFloor")} {selectedRoomObj.floor}, {selectedRoomObj.area || 20}m²)
                                        </span>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${selectedRoomObj.status === "deposited"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-emerald-100 text-emerald-700"
                                            }`}
                                    >
                                        {selectedRoomObj.status}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* FLOW A BANNER IF PENDING PLATFORM DEPOSIT DETECTED */}
                        {flowType === "platform" && pendingDeposit && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 mt-4 animate-in zoom-in-95">
                                <div className="flex items-center gap-2 text-purple-700 font-black text-xs uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span>{t("landlordContractsCreateFlowPlatformBadge")}</span>
                                </div>
                                <p className="text-xs text-purple-900 font-medium leading-relaxed">
                                    {t("landlordContractsCreateFlowPlatformDesc")}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-purple-800">
                                    <span>{t("landlordContractsCreateTenantNameLabel")}: <strong>{pendingDeposit.tenant?.fullName || (isEn ? "Platform Guest" : "Khách nền tảng")}</strong></span>
                                    <span>&bull;</span>
                                    <span>{t("landlordContractDetailMemberPhoneLabel")} <strong>{pendingDeposit.tenant?.phoneNumber}</strong></span>
                                    <span>&bull;</span>
                                    <span>{t("landlordContractDetailDeposit")} <strong>{pendingDeposit.amount.toLocaleString("vi-VN")} ₫</strong> (Fixed)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tenant Information Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordContractsCreateStep1Header")}
                            </h2>
                            {!canEditTenantInfo && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                    <Lock className="w-3 h-3 text-zinc-400" />
                                    {flowType === "platform"
                                        ? "Khách nền tảng (Đã khóa)"
                                        : tenantFound === true
                                            ? "Tài khoản có sẵn (Đã khóa)"
                                            : "Chưa kiểm tra SĐT (Đã khóa)"}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Phone Input with search lookup */}
                            <div className="sm:col-span-2">
                                <div className="relative max-w-md">
                                    <TextInput
                                        label={t("landlordContractsCreateTenantPhoneLabel")}
                                        required
                                        type="tel"
                                        placeholder={t("landlordContractsCreateTenantPhonePlaceholder")}
                                        disabled={flowType === "platform"}
                                        value={tenantPhone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        className="pr-24"
                                    />
                                    {flowType === "direct" && (
                                        <button
                                            type="button"
                                            disabled={isSearchingPhone || tenantPhone.length !== 10}
                                            onClick={() => handleSearchPhone(tenantPhone)}
                                            className="absolute right-1.5 bottom-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#2AC1BC] text-white hover:bg-[#25ad87] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                        >
                                            {isSearchingPhone ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>{t("landlordContractsCreateTenantSearching")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="w-3 h-3" />
                                                    <span>{t("landlordContractsCreateTenantSearchBtn") || "Kiểm tra"}</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Status hints under phone input */}
                                {flowType === "direct" && tenantPhone.length < 10 && tenantFound === null && (
                                    <p className="text-[11px] text-zinc-500 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>{t("landlordContractsCreateTenantPhoneLockedHint")}</span>
                                    </p>
                                )}

                                {tenantFound === true && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 mt-2.5 animate-in fade-in">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-black text-emerald-950 block">
                                                {t("landlordContractsCreateTenantFound")}: {tenantFullName}
                                            </span>
                                            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                                                {t("landlordContractsCreateTenantLockedAccountDesc")}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {tenantFound === false && flowType === "direct" && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 mt-2.5 animate-in fade-in">
                                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-black text-amber-950 block">
                                                {t("landlordContractsCreateTenantNotFound")}
                                            </span>
                                            <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
                                                {t("landlordContractsCreateTenantNewAccountDesc")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Full Name */}
                            <TextInput
                                label={t("landlordContractsCreateTenantNameLabel")}
                                required={flowType !== "platform"}
                                placeholder={!canEditTenantInfo && tenantPhone.length < 10 ? "Vui lòng nhập xong số điện thoại..." : t("landlordContractsCreateTenantNamePlaceholder")}
                                disabled={!canEditTenantInfo}
                                value={tenantFullName}
                                onChange={(e) => {
                                    setTenantFullName(e.target.value);
                                    setIsDirty(true);
                                }}
                            />

                            {/* Email */}
                            <TextInput
                                label={t("landlordContractsCreateTenantEmailLabel")}
                                type="email"
                                placeholder={!canEditTenantInfo && tenantPhone.length < 10 ? "Vui lòng nhập xong số điện thoại..." : (t("landlordContractsCreateTenantEmailPlaceholder") || "khachthue@gmail.com")}
                                disabled={!canEditTenantInfo}
                                value={tenantEmail}
                                onChange={(e) => {
                                    setTenantEmail(e.target.value);
                                    setIsDirty(true);
                                }}
                            />
                        </div>

                        {/* Notice when existing user has NO identification on file */}
                        {tenantFound === true && !hasIdentification && (
                            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-xs text-sky-900 animate-in fade-in">
                                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-black text-sky-950 block">
                                        {t("landlordContractsCreateTenantFound")}: {tenantFullName}
                                    </span>
                                    <p className="text-[11px] text-sky-800 font-medium mt-0.5">
                                        {t("landlordContractsCreateTenantNoIdNotice")}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Citizen Identification (CCCD) Section Toggle */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        hasIdentification
                                            ? "bg-emerald-100 text-emerald-700"
                                            : canEditTenantInfo
                                                ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
                                                : "bg-zinc-200 text-zinc-500"
                                    }`}>
                                        <IdCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-zinc-900 flex items-center gap-2">
                                            <span>{t("landlordContractsCreateStep2Header")}</span>
                                            {hasIdentification && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">
                                                    {t("landlordContractsCreateTenantHasIdBadge")}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-[11px] text-zinc-500 font-medium">
                                            {hasIdentification
                                                ? (isEn ? "Citizen ID verified on system (Read-only)" : "Định danh công dân đã có trên hệ thống (Chỉ đọc)")
                                                : canEditTenantInfo
                                                    ? (isEn ? "Fill citizen ID details for new tenant profile" : "Nhập thông tin CCCD để tạo hồ sơ khách thuê mới")
                                                    : (isEn ? "Citizen ID section locked until phone is verified" : "Mục CCCD bị khóa cho đến khi xác minh SĐT")}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowIdForm(!showIdForm)}
                                    className="px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                >
                                    <span>{showIdForm ? (isEn ? "Collapse" : "Thu gọn") : (isEn ? "View / Edit" : "Xem / Nhập")}</span>
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showIdForm ? "rotate-90" : ""}`} />
                                </button>
                            </div>

                            {/* Full UserIdentification Form from Schema */}
                            {showIdForm && (
                                <div className="mt-3 p-5 bg-zinc-50/80 border border-zinc-200 rounded-2xl space-y-4 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2.5">
                                        <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                                            <IdCard className="w-3.5 h-3.5 text-[#2AC1BC]" />
                                            {t("landlordContractsCreateStep2Header")}
                                        </h4>
                                        {!canEditTenantInfo ? (
                                            <span className="text-[11px] text-zinc-500 font-bold flex items-center gap-1">
                                                <Lock className="w-3 h-3 text-zinc-400" />
                                                {isEn ? "Read-only" : "Chỉ đọc (Đã khóa)"}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                                <Unlock className="w-3 h-3 text-emerald-500" />
                                                {isEn ? "Editable" : "Được phép chỉnh sửa"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Row 1: Số CCCD, Họ tên trên CCCD, Ngày sinh */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <TextInput
                                            label={t("landlordContractsCreateCccdNumberLabel")}
                                            required={canEditTenantInfo}
                                            placeholder={t("landlordContractsCreateCccdNumberPlaceholder") || "001201012345"}
                                            disabled={!canEditTenantInfo}
                                            value={identityNumber}
                                            onChange={(e) => {
                                                setIdentityNumber(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />

                                        <TextInput
                                            label={t("landlordContractsCreateCccdNameLabel")}
                                            required={canEditTenantInfo}
                                            placeholder={tenantFullName || (t("landlordContractsCreateCccdNamePlaceholder") || "NGUYEN VAN AN")}
                                            disabled={!canEditTenantInfo}
                                            value={idFullName}
                                            onChange={(e) => {
                                                setIdFullName(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />

                                        <DateInput
                                            label={t("landlordContractsCreateCccdDobLabel")}
                                            required={canEditTenantInfo}
                                            disabled={!canEditTenantInfo}
                                            value={dateOfBirth}
                                            onChange={(e) => {
                                                setDateOfBirth(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>

                                    {/* Row 2: Giới tính, Quốc tịch, Quê quán */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <SelectInput
                                            label={t("landlordContractsCreateCccdGenderLabel")}
                                            required={canEditTenantInfo}
                                            disabled={!canEditTenantInfo}
                                            value={gender}
                                            onChange={(e) => {
                                                setGender(e.target.value as "male" | "female");
                                                setIsDirty(true);
                                            }}
                                        >
                                            <option value="male">{t("landlordContractsCreateCccdGenderMale")}</option>
                                            <option value="female">{t("landlordContractsCreateCccdGenderFemale")}</option>
                                        </SelectInput>

                                        <TextInput
                                            label={t("landlordContractsCreateCccdNationalityLabel")}
                                            disabled={!canEditTenantInfo}
                                            value={nationality}
                                            onChange={(e) => {
                                                setNationality(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />

                                        <TextInput
                                            label={t("landlordContractsCreateCccdOriginLabel")}
                                            required={canEditTenantInfo}
                                            placeholder={t("landlordContractsCreateCccdOriginPlaceholder")}
                                            disabled={!canEditTenantInfo}
                                            value={placeOfOrigin}
                                            onChange={(e) => {
                                                setPlaceOfOrigin(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>

                                    {/* Row 3: Nơi thường trú, Ngày cấp, Ngày hết hạn */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                        <TextInput
                                            label={t("landlordContractsCreateCccdResidenceLabel")}
                                            required={canEditTenantInfo}
                                            placeholder={t("landlordContractsCreateCccdResidencePlaceholder")}
                                            disabled={!canEditTenantInfo}
                                            value={placeOfResidence}
                                            onChange={(e) => {
                                                setPlaceOfResidence(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />

                                        <DateInput
                                            label={t("landlordContractsCreateCccdIssueDateLabel")}
                                            disabled={!canEditTenantInfo}
                                            value={issueDate}
                                            onChange={(e) => {
                                                setIssueDate(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />

                                        <DateInput
                                            label={t("landlordContractsCreateCccdExpiryDateLabel")}
                                            disabled={!canEditTenantInfo}
                                            value={expiryDate}
                                            onChange={(e) => {
                                                setExpiryDate(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>

                                    {/* Row 4: Đặc điểm nhận dạng / Ghi chú */}
                                    <TextInput
                                        label={t("landlordContractsCreateCccdNoteLabel")}
                                        placeholder={t("landlordContractsCreateCccdNotePlaceholder")}
                                        disabled={!canEditTenantInfo}
                                        value={idNote}
                                        onChange={(e) => {
                                            setIdNote(e.target.value);
                                            setIsDirty(true);
                                        }}
                                    />

                                    {/* Row 5: Ảnh mặt trước & mặt sau CCCD (Tải ảnh trực tiếp) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                        {/* Mặt trước CCCD */}
                                        <div>
                                            <input
                                                id="cccd-front-file"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                disabled={!canEditTenantInfo}
                                                onChange={(e) => handlePhotoUpload(e, "front")}
                                            />
                                            <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <IdCard className="w-3.5 h-3.5 text-[#2AC1BC]" />
                                                    {t("landlordContractsCreateCccdFrontUrlLabel")}
                                                </span>
                                                {cardFrontUrl && (
                                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        Đã có ảnh
                                                    </span>
                                                )}
                                            </label>

                                            {cardFrontUrl ? (
                                                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 space-y-2">
                                                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-zinc-900/5 flex items-center justify-center border border-zinc-200/60">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={cardFrontUrl}
                                                            alt={t("landlordContractsCreateCccdFrontUrlLabel")}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {uploadingFront && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                                                                <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                                                                <span className="text-[11px] font-bold mt-1.5">Đang xử lý ảnh...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewModalImg({
                                                                    url: cardFrontUrl,
                                                                    title: t("landlordContractsCreateCccdFrontUrlLabel"),
                                                                })
                                                            }
                                                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                                        >
                                                            <Eye className="w-3 h-3 text-[#2AC1BC]" />
                                                            {t("landlordContractsCreateCccdViewPhoto")}
                                                        </button>

                                                        {canEditTenantInfo ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    disabled={uploadingFront}
                                                                    onClick={() => document.getElementById("cccd-front-file")?.click()}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                                                >
                                                                    <RefreshCw className="w-3 h-3" />
                                                                    {t("landlordContractsCreateCccdChangePhoto")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={uploadingFront}
                                                                    onClick={() => {
                                                                        setCardFrontUrl("");
                                                                        setIsDirty(true);
                                                                    }}
                                                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                                                                    title={t("landlordContractsCreateCccdRemovePhoto")}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                                                                <Lock className="w-3 h-3" />
                                                                <span>Đã khóa</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : !canEditTenantInfo ? (
                                                <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-100/70 p-4 text-center cursor-not-allowed select-none">
                                                    <Lock className="w-6 h-6 text-zinc-400 mb-1.5" />
                                                    <span className="text-xs font-bold text-zinc-500">
                                                        {tenantPhone.trim().length < 10
                                                            ? "Nhập số điện thoại để mở khóa"
                                                            : "Khách thuê chưa cập nhật ảnh mặt trước"}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 mt-0.5">
                                                        {tenantPhone.trim().length < 10
                                                            ? "Cần xác thực số điện thoại trước"
                                                            : "Tài khoản đã có trên hệ thống"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => document.getElementById("cccd-front-file")?.click()}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsDraggingFront(true);
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsDraggingFront(false);
                                                    }}
                                                    onDrop={(e) => handleDropFile(e, "front")}
                                                    className={`h-36 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                                                        isDraggingFront
                                                            ? "border-[#2AC1BC] bg-[#2AC1BC]/10 scale-[0.99]"
                                                            : "border-zinc-200 bg-zinc-50/70 hover:border-[#2AC1BC]/70 hover:bg-zinc-50"
                                                    }`}
                                                >
                                                    {uploadingFront ? (
                                                        <div className="flex flex-col items-center justify-center text-[#2AC1BC]">
                                                            <Loader2 className="w-7 h-7 animate-spin mb-1.5" />
                                                            <span className="text-xs font-bold">Đang tải ảnh lên...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mb-1.5 shadow-2xs">
                                                                <UploadCloud className="w-5 h-5" />
                                                            </div>
                                                            <p className="text-xs font-bold text-zinc-800">
                                                                {t("landlordContractsCreateCccdUploadPrompt")}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-400 mt-0.5">
                                                                {t("landlordContractsCreateCccdUploadHint")}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Mặt sau CCCD */}
                                        <div>
                                            <input
                                                id="cccd-back-file"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                disabled={!canEditTenantInfo}
                                                onChange={(e) => handlePhotoUpload(e, "back")}
                                            />
                                            <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <IdCard className="w-3.5 h-3.5 text-[#2AC1BC]" />
                                                    {t("landlordContractsCreateCccdBackUrlLabel")}
                                                </span>
                                                {cardBackUrl && (
                                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        Đã có ảnh
                                                    </span>
                                                )}
                                            </label>

                                            {cardBackUrl ? (
                                                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 space-y-2">
                                                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-zinc-900/5 flex items-center justify-center border border-zinc-200/60">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={cardBackUrl}
                                                            alt={t("landlordContractsCreateCccdBackUrlLabel")}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {uploadingBack && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                                                                <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                                                                <span className="text-[11px] font-bold mt-1.5">Đang xử lý ảnh...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewModalImg({
                                                                    url: cardBackUrl,
                                                                    title: t("landlordContractsCreateCccdBackUrlLabel"),
                                                                })
                                                            }
                                                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                                        >
                                                            <Eye className="w-3 h-3 text-[#2AC1BC]" />
                                                            {t("landlordContractsCreateCccdViewPhoto")}
                                                        </button>

                                                        {canEditTenantInfo ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    disabled={uploadingBack}
                                                                    onClick={() => document.getElementById("cccd-back-file")?.click()}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                                                >
                                                                    <RefreshCw className="w-3 h-3" />
                                                                    {t("landlordContractsCreateCccdChangePhoto")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={uploadingBack}
                                                                    onClick={() => {
                                                                        setCardBackUrl("");
                                                                        setIsDirty(true);
                                                                    }}
                                                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                                                                    title={t("landlordContractsCreateCccdRemovePhoto")}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                                                                <Lock className="w-3 h-3" />
                                                                <span>Đã khóa</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : !canEditTenantInfo ? (
                                                <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-100/70 p-4 text-center cursor-not-allowed select-none">
                                                    <Lock className="w-6 h-6 text-zinc-400 mb-1.5" />
                                                    <span className="text-xs font-bold text-zinc-500">
                                                        {tenantPhone.trim().length < 10
                                                            ? "Nhập số điện thoại để mở khóa"
                                                            : "Khách thuê chưa cập nhật ảnh mặt sau"}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 mt-0.5">
                                                        {tenantPhone.trim().length < 10
                                                            ? "Cần xác thực số điện thoại trước"
                                                            : "Tài khoản đã có trên hệ thống"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => document.getElementById("cccd-back-file")?.click()}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsDraggingBack(true);
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsDraggingBack(false);
                                                    }}
                                                    onDrop={(e) => handleDropFile(e, "back")}
                                                    className={`h-36 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                                                        isDraggingBack
                                                            ? "border-[#2AC1BC] bg-[#2AC1BC]/10 scale-[0.99]"
                                                            : "border-zinc-200 bg-zinc-50/70 hover:border-[#2AC1BC]/70 hover:bg-zinc-50"
                                                    }`}
                                                >
                                                    {uploadingBack ? (
                                                        <div className="flex flex-col items-center justify-center text-[#2AC1BC]">
                                                            <Loader2 className="w-7 h-7 animate-spin mb-1.5" />
                                                            <span className="text-xs font-bold">Đang tải ảnh lên...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mb-1.5 shadow-2xs">
                                                                <UploadCloud className="w-5 h-5" />
                                                            </div>
                                                            <p className="text-xs font-bold text-zinc-800">
                                                                {t("landlordContractsCreateCccdUploadBackPrompt")}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-400 mt-0.5">
                                                                {t("landlordContractsCreateCccdUploadHint")}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Alert if any */}
                    {errorMessage && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold animate-in fade-in">
                            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                            <span>{errorMessage}</span>
                            <button
                                type="button"
                                onClick={() => setErrorMessage(null)}
                                className="ml-auto text-rose-400 hover:text-rose-700 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                            {t("landlordContractsCreateCancelBtn")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!selectedRoomId) {
                                    setErrorMessage(t("landlordContractsCreateErrSelectRoom"));
                                    return;
                                }
                                if (flowType === "direct") {
                                    if (!tenantPhone || tenantPhone.length !== 10) {
                                        setErrorMessage(t("landlordContractsCreateTenantPhoneLockedHint") || "Vui lòng nhập đúng 10 số điện thoại khách thuê.");
                                        return;
                                    }
                                    if (tenantFound === null) {
                                        setErrorMessage("Vui lòng bấm kiểm tra số điện thoại khách thuê trước khi tiếp tục.");
                                        return;
                                    }
                                    if (tenantFound === false && !tenantFullName.trim()) {
                                        setErrorMessage(t("landlordContractsCreateErrTenantInfo"));
                                        return;
                                    }
                                }
                                setErrorMessage(null);
                                setStep(2);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
                        >
                            {t("landlordContractsCreateNextStep")} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Điều khoản & Tài chính */}
            {step === 2 && (
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
                    <div className="border-b border-zinc-100 pb-3">
                        <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordContractsCreateStep2Btn")}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Rent Price */}
                        <NumberInput
                            label={t("landlordContractsCreateRentPriceLabel")}
                            required
                            min={0}
                            step={50000}
                            suffixText="VNĐ/tháng"
                            helperText={`${Number(rentPrice || 0).toLocaleString(isEn ? "en-US" : "vi-VN")} ₫`}
                            value={rentPrice}
                            onChange={(e) => {
                                setRentPrice(Number(e.target.value));
                                setIsDirty(true);
                            }}
                        />

                        {/* Deposit Amount */}
                        <NumberInput
                            label={t("landlordContractsCreateDepositLabel")}
                            required
                            min={0}
                            disabled={flowType === "platform"}
                            suffixText="VNĐ"
                            helperText={
                                flowType === "platform"
                                    ? t("landlordContractsCreateDepositInheritedNote")
                                    : `${Number(depositAmount || 0).toLocaleString(isEn ? "en-US" : "vi-VN")} ₫`
                            }
                            value={depositAmount}
                            onChange={(e) => {
                                setDepositAmount(Number(e.target.value));
                                setIsDirty(true);
                            }}
                        />

                        {/* Monthly Payment Date */}
                        <NumberInput
                            label={t("landlordContractsCreatePaymentDateLabel")}
                            required
                            min={1}
                            max={31}
                            suffixText={t("landlordContractsCreatePaymentDateSuffix")}
                            helperText={t("landlordContractDetailPaymentDayValue", { day: monthlyPaymentDate })}
                            value={monthlyPaymentDate}
                            onChange={(e) => {
                                setMonthlyPaymentDate(Number(e.target.value));
                                setIsDirty(true);
                            }}
                        />

                        {/* Payment Cycle */}
                        <SelectInput
                            label={t("landlordContractsCreatePaymentCycleLabel")}
                            required
                            value={rentPaymentCycle}
                            onChange={(e) => {
                                setRentPaymentCycle(Number(e.target.value));
                                setIsDirty(true);
                            }}
                        >
                            <option value={1}>{t("landlordContractsCreateCycle1M")}</option>
                            <option value={3}>{t("landlordContractsCreateCycle3M")}</option>
                            <option value={6}>{t("landlordContractsCreateCycle6M")}</option>
                            <option value={12}>{t("landlordContractsCreateCycle12M")}</option>
                        </SelectInput>
                    </div>

                    <div className="border-b border-zinc-100 pb-3 pt-2">
                        <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#2AC1BC]" /> {t("landlordContractDetailTimelineSection")}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DateInput
                            label={t("landlordContractsCreateStartDateLabel")}
                            required
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setIsDirty(true);
                            }}
                        />

                        <DateInput
                            label={t("landlordContractsCreateEndDateLabel")}
                            required
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setIsDirty(true);
                            }}
                        />

                        <div className="col-span-full">
                            <TextareaInput
                                label={t("landlordContractsCreateNoteLabel")}
                                placeholder={t("landlordContractsCreateNotePlaceholder")}
                                rows={3}
                                value={note}
                                onChange={(e) => {
                                    setNote(e.target.value);
                                    setIsDirty(true);
                                }}
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" /> {t("landlordContractsCreatePrevStep")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!startDate || !endDate) {
                                    setErrorMessage(t("landlordContractsCreateStartDateLabel"));
                                    return;
                                }
                                if (new Date(endDate) <= new Date(startDate)) {
                                    setErrorMessage(t("landlordContractsCreateEndDateLabel"));
                                    return;
                                }
                                setErrorMessage(null);
                                setStep(3);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer"
                        >
                            {t("landlordContractsCreateNextStep")} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Xác nhận & Ký kết */}
            {step === 3 && (
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
                    <div className="text-center max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto mb-2">
                            <FileSignature className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-black text-zinc-900">
                            {t("landlordContractsCreateStep3Header")}
                        </h2>
                        <p className="text-xs text-zinc-500">
                            {t("landlordContractsCreateStep3Desc")}
                        </p>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                            <span className="font-bold text-zinc-500">{t("landlordContractDetailStatus")}:</span>
                            <span
                                className={`px-3 py-1 rounded-full font-black text-[11px] ${flowType === "platform"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-emerald-100 text-emerald-700"
                                    }`}
                            >
                                {flowType === "platform"
                                    ? t("landlordContractsCreateFlowPlatformBadge")
                                    : t("landlordContractsCreateFlowDirectBadge")}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractDetailRoom")}:</span>
                                <span className="font-black text-zinc-900 text-sm">
                                    {t("landlordContractDetailRoomPrefix")} {selectedRoomObj?.roomNumber} ({t("landlordRoomDetailFloor")} {selectedRoomObj?.floor})
                                </span>
                            </div>

                            <div>
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractDetailTenant")}:</span>
                                <span className="font-black text-zinc-900 text-sm block">
                                    {tenantFullName} ({tenantPhone})
                                </span>
                                {identityNumber && (
                                    <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                                        CCCD: {identityNumber}
                                    </span>
                                )}
                            </div>

                            <div>
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractDetailDuration")}:</span>
                                <span className="font-bold text-zinc-800">
                                    {startDate} &rarr; {endDate}
                                </span>
                            </div>

                            <div>
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractsCreatePaymentCycleLabel")}:</span>
                                <span className="font-bold text-zinc-800">
                                    {t("landlordContractDetailPaymentDayValue", { day: monthlyPaymentDate })} &bull; {rentPaymentCycle} {t("landlordContractsPaymentCycleLabel")}
                                </span>
                            </div>

                            <div>
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractDetailRentPrice")}:</span>
                                <span className="font-black text-[#2AC1BC] text-sm">
                                    {Number(rentPrice).toLocaleString(isEn ? "en-US" : "vi-VN")} ₫ {t("landlordContractsPerMonth")}
                                </span>
                            </div>

                            <div>
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractDetailDeposit")}:</span>
                                <span className="font-black text-purple-700 text-sm">
                                    {Number(depositAmount).toLocaleString(isEn ? "en-US" : "vi-VN")} ₫
                                </span>
                            </div>
                        </div>

                        {note && (
                            <div className="pt-2 border-t border-zinc-200">
                                <span className="text-zinc-400 block text-[11px] font-semibold">{t("landlordContractsCreateNoteLabel")}:</span>
                                <p className="text-zinc-700 italic">{note}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setStep(2)}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" /> {t("landlordContractsCreatePrevStep")}
                        </button>

                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleSubmitContract}
                            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-[#2AC1BC] hover:bg-[#25ad87] rounded-xl shadow-sm shadow-[#2AC1BC]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> {t("landlordContractsCreateSubmitting")}
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> {t("landlordContractsCreateSubmitBtn")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* RULE 10: Custom Pop-up Confirmation Modal for Unsaved Changes */}
            {showConfirmClose && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setShowConfirmClose(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-zinc-900">
                                {t("landlordContractsCreateConfirmCloseTitle")}
                            </h3>
                            <p className="text-xs text-zinc-500 font-medium">
                                {t("landlordContractsCreateConfirmCloseDesc")}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmClose(false)}
                                className="flex-1 py-2.5 px-4 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
                            >
                                {t("landlordContractsCreateConfirmCloseKeep")}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmClose}
                                className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer shadow-sm shadow-rose-500/20"
                            >
                                {t("landlordContractsCreateConfirmCloseDiscard")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Image Preview Modal */}
            {previewModalImg && (
                <div
                    className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setPreviewModalImg(null)}
                >
                    <div
                        className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-800 animate-in zoom-in-95 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-white">
                            <div className="flex items-center gap-2">
                                <IdCard className="w-5 h-5 text-[#2AC1BC]" />
                                <span className="text-sm font-bold">{previewModalImg.title}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewModalImg(null)}
                                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center justify-center bg-zinc-950 rounded-2xl overflow-hidden min-h-[260px] max-h-[70vh]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewModalImg.url}
                                alt={previewModalImg.title}
                                className="w-full h-full object-contain max-h-[68vh]"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
