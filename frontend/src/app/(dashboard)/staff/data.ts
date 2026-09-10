export interface JobPosition {
  id: string;
  name: string;
  description: string;
  fixedDuties?: DutyTaskItem[];
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "07:00"
  endTime: string;   // "15:00"
  durationHours: number;
}

export interface CoWorker {
  id: string;
  name: string;
  phone: string;
  positionName: string;
  avatar: string;
}

export interface DutyTaskItem {
  id: string;
  title: string;
  requiresPhoto: boolean; // Landlord yêu cầu ảnh đối chiếu
  photoProof?: string;    // Data URL or image link
  photoProofTime?: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

export interface WorkScheduleItem {
  id: string;
  workDate: string; // "YYYY-MM-DD"
  boardingHouseId: string;
  boardingHouseName: string;
  shift: Shift;
  position: JobPosition;
  status: "scheduled" | "completed" | "absent";
  isRecurring: boolean;
  coWorkers: CoWorker[];
  duties?: DutyTaskItem[];
}

export interface AttendanceWatermark {
  time: string;
  place: string;
  staffName: string;
  coordinates?: string;
}

export interface AttendanceRecord {
  id: string;
  workScheduleId: string;
  workDate: string;
  boardingHouseName: string;
  shiftName: string;
  shiftTime: string;
  checkIn: string | null;  // "06:55"
  checkOut: string | null; // "15:05"
  status: "on_time" | "late" | "absent" | "not_yet";
  totalHours: number;
  editedByLandlord: boolean;
  note?: string;
  checkInPhoto?: string;
  checkInWatermark?: AttendanceWatermark;
  checkInExplanation?: string;
  checkOutPhoto?: string;
  checkOutWatermark?: AttendanceWatermark;
  checkOutExplanation?: string;
  isEarlyCheckOut?: boolean;
}

// =======================================================================================
// DYNAMIC REAL-TIME DATE HELPERS
// =======================================================================================
export function formatToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayISODate(): string {
  return formatToYYYYMMDD(new Date());
}

export function getRelativeISODate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return formatToYYYYMMDD(d);
}

export function getCurrentWeekDays(refDate: Date = new Date()): { label: string; date: string; dayNum: string; isToday: boolean }[] {
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + mondayOffset);

  const labelsVi = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  const todayStr = formatToYYYYMMDD(refDate);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dateStr = formatToYYYYMMDD(cur);
    days.push({
      label: labelsVi[i],
      date: dateStr,
      dayNum: String(cur.getDate()).padStart(2, "0"),
      isToday: dateStr === todayStr
    });
  }
  return days;
}

// System shifts
export const SYSTEM_SHIFTS: Record<string, Shift> = {
  morning: {
    id: "shift-morning",
    name: "Ca Sáng",
    startTime: "07:00",
    endTime: "15:00",
    durationHours: 8,
  },
  afternoon: {
    id: "shift-afternoon",
    name: "Ca Chiều",
    startTime: "15:00",
    endTime: "23:00",
    durationHours: 8,
  },
  night: {
    id: "shift-night",
    name: "Ca Đêm",
    startTime: "23:00",
    endTime: "07:00",
    durationHours: 8,
  },
};

// =======================================================================================
// FIXED DAILY TASKS PER JOB POSITION (Nhiệm vụ cố định hàng ngày của từng vị trí)
// =======================================================================================

// 1. Bảo vệ & Vận hành sảnh
export const DEFAULT_SECURITY_DUTIES: DutyTaskItem[] = [
  {
    id: "duty-sec-1",
    title: "Kiểm soát an ninh cổng chính và sắp xếp khu vực để xe sinh viên ngăn nắp",
    requiresPhoto: true, // Landlord yêu cầu ảnh đối chiếu
    photoProof: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
    photoProofTime: "07:15",
    completed: true,
    note: "Đã kiểm tra 45 xe, xếp gọn lối đi thoát hiểm"
  },
  {
    id: "duty-sec-2",
    title: "Kiểm tra mở cổng sáng (06:00) và kiểm tra hoạt động của chốt khóa cổng tự động",
    requiresPhoto: true, // Landlord yêu cầu ảnh đối chiếu
    photoProof: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
    photoProofTime: "06:55",
    completed: true,
    note: "Cổng mở đúng giờ, khóa chốt hoạt động tốt"
  },
  {
    id: "duty-sec-3",
    title: "Giám sát camera an ninh hành lang các tầng 1, 2, 3 và ghi nhận nhật ký trực",
    requiresPhoto: false,
    completed: false,
    note: "Đang theo dõi trong ca trực"
  },
  {
    id: "duty-sec-4",
    title: "Tuần tra chống ồn, bảo đảm an ninh trật tự và khóa an toàn cổng ban đêm (23:00)",
    requiresPhoto: true,
    completed: false
  }
];

// 2. Nhân viên Vệ sinh & Môi trường
export const DEFAULT_CLEANING_DUTIES: DutyTaskItem[] = [
  {
    id: "duty-clean-1",
    title: "Quét dọn, lau sàn hành lang tất cả các tầng từ 1 đến 4 và cầu thang bộ",
    requiresPhoto: true,
    photoProof: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    photoProofTime: "08:45",
    completed: true,
    note: "Đã lau sạch hành lang các tầng, sàn khô ráo không trơn trượt"
  },
  {
    id: "duty-clean-2",
    title: "Thu gom rác thải tập kết tại từng tầng và vận chuyển ra điểm gom rác đô thị",
    requiresPhoto: true,
    photoProofTime: "09:15",
    completed: true,
    note: "Toàn bộ túi rác đã chuyển xuống thùng gom rác trước sảnh"
  },
  {
    id: "duty-clean-3",
    title: "Vệ sinh khu vực giặt phơi chung và kiểm tra máy giặt hoạt động bình thường",
    requiresPhoto: false,
    completed: false,
    note: "Khu vực sân phơi thông thoáng, máy giặt hoạt động tốt"
  },
  {
    id: "duty-clean-4",
    title: "Bổ sung nước rửa tay, xà phòng tại khu vực vệ sinh chung tầng trệt",
    requiresPhoto: true,
    completed: false
  }
];

// 3. Kỹ thuật bảo trì & Tiện ích
export const DEFAULT_MAINTENANCE_DUTIES: DutyTaskItem[] = [
  {
    id: "duty-maint-1",
    title: "Kiểm tra chỉ số công tơ điện, đồng hồ nước các phòng định kỳ",
    requiresPhoto: true,
    completed: false,
    note: "Ghi nhận chỉ số định kỳ theo ca"
  },
  {
    id: "duty-maint-2",
    title: "Kiểm tra áp lực nước máy bơm tầng thượng và bình nóng lạnh năng lượng mặt trời",
    requiresPhoto: true,
    completed: false
  },
  {
    id: "duty-maint-3",
    title: "Rà soát kiểm tra đèn chiếu sáng hành lang và chốt niêm phong bình chữa cháy PCCC",
    requiresPhoto: true,
    completed: false
  },
  {
    id: "duty-maint-4",
    title: "Tiếp nhận và xử lý nhanh các sự cố điện nước phát sinh từ cư dân trong ca trực",
    requiresPhoto: false,
    completed: false
  }
];

// Mapping fixed duties by position id
export const POSITION_FIXED_DUTIES: Record<string, DutyTaskItem[]> = {
  "pos-1": DEFAULT_SECURITY_DUTIES,
  "pos-2": DEFAULT_CLEANING_DUTIES,
  "pos-3": DEFAULT_MAINTENANCE_DUTIES,
};

export function getDailyDutiesForPosition(positionId: string): DutyTaskItem[] {
  const duties = POSITION_FIXED_DUTIES[positionId] || DEFAULT_SECURITY_DUTIES;
  return duties.map(d => ({ ...d }));
}

// Job Positions with duty lists (per UC-L-20 & UC-S-01)
export const JOB_POSITIONS: JobPosition[] = [
  {
    id: "pos-1",
    name: "Bảo vệ & Vận hành sảnh",
    description: "• Kiểm soát an ninh cổng ra vào và khu vực để xe sinh viên.\n• Kiểm tra mở cổng lúc 06:00 sáng và khóa cổng an toàn lúc 23:00 đêm.\n• Giám sát camera an ninh các tầng hành lang 1, 2, 3.\n• Hướng dẫn khách thuê mới gửi xe và hỗ trợ vận chuyển hành lý khi nhận phòng.",
    fixedDuties: DEFAULT_SECURITY_DUTIES
  },
  {
    id: "pos-2",
    name: "Nhân viên Vệ sinh & Môi trường",
    description: "• Quét dọn, lau sàn hành lang tất cả các tầng từ 1 đến 4.\n• Thu gom rác thải tập kết tại từng tầng và vận chuyển ra điểm gom rác đô thị.\n• Vệ sinh khu vực giặt phơi chung và kiểm tra máy giặt hoạt động bình thường.\n• Bổ sung nước rửa tay, xà phòng tại khu vực vệ sinh chung tầng trệt.",
    fixedDuties: DEFAULT_CLEANING_DUTIES
  },
  {
    id: "pos-3",
    name: "Kỹ thuật bảo trì & Tiện ích",
    description: "• Kiểm tra chỉ số công tơ điện, đồng hồ nước các phòng định kỳ.\n• Xử lý sự cố rò rỉ nước, thay thế bóng đèn hành lang bị hỏng.\n• Kiểm tra áp lực nước máy bơm tầng thượng và bình nóng lạnh năng lượng mặt trời.\n• Báo cáo chủ trọ nếu có thiết bị hư hỏng vượt mức xử lý nhanh.",
    fixedDuties: DEFAULT_MAINTENANCE_DUTIES
  }
];

// Helper to build initial mock work schedules anchored to real dates
export function generateMockWorkSchedules(): WorkScheduleItem[] {
  const today = getTodayISODate();
  return [
    {
      id: "ws-today",
      workDate: today,
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "scheduled",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: [
        {
          id: "cw-1",
          name: "Lê Thị Mai Lan",
          phone: "0988112233",
          positionName: "Nhân viên Vệ sinh",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
        },
        {
          id: "cw-2",
          name: "Trần Minh Quang",
          phone: "0977223344",
          positionName: "Bảo trì kỹ thuật",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
        }
      ]
    },
    {
      id: "ws-2",
      workDate: getRelativeISODate(1),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "scheduled",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: [
        {
          id: "cw-1",
          name: "Lê Thị Mai Lan",
          phone: "0988112233",
          positionName: "Nhân viên Vệ sinh",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
        }
      ]
    },
    {
      id: "ws-3",
      workDate: getRelativeISODate(2),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.afternoon,
      position: JOB_POSITIONS[0],
      status: "scheduled",
      isRecurring: false,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: [
        {
          id: "cw-3",
          name: "Hoàng Văn Đức",
          phone: "0966334455",
          positionName: "Bảo vệ ca tối",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
        }
      ]
    },
    {
      id: "ws-4",
      workDate: getRelativeISODate(3),
      boardingHouseId: "b2",
      boardingHouseName: "Dormio Campus Cầu Giấy",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "scheduled",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: [
        {
          id: "cw-4",
          name: "Phạm Hải Đăng",
          phone: "0911556677",
          positionName: "Bảo vệ trưởng",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
        }
      ]
    },
    {
      id: "ws-5",
      workDate: getRelativeISODate(4),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "scheduled",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: []
    },
    // Past schedules
    {
      id: "ws-past-1",
      workDate: getRelativeISODate(-1),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "completed",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: []
    },
    {
      id: "ws-past-2",
      workDate: getRelativeISODate(-2),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "completed",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: []
    },
    {
      id: "ws-past-3",
      workDate: getRelativeISODate(-3),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "completed",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: []
    },
    {
      id: "ws-past-4",
      workDate: getRelativeISODate(-4),
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      shift: SYSTEM_SHIFTS.morning,
      position: JOB_POSITIONS[0],
      status: "completed",
      isRecurring: true,
      duties: DEFAULT_SECURITY_DUTIES,
      coWorkers: []
    }
  ];
}

export const MOCK_WORK_SCHEDULES: WorkScheduleItem[] = generateMockWorkSchedules();

// Helper to build initial mock attendances anchored to real dates
export function generateMockAttendances(): AttendanceRecord[] {
  const today = getTodayISODate();
  return [
    {
      id: "att-today",
      workScheduleId: "ws-today",
      workDate: today,
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: null,
      checkOut: null,
      status: "not_yet",
      totalHours: 0,
      editedByLandlord: false
    },
    {
      id: "att-past-1",
      workScheduleId: "ws-past-1",
      workDate: getRelativeISODate(-1),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: "06:54",
      checkOut: "15:02",
      status: "on_time",
      totalHours: 8,
      editedByLandlord: false,
      checkInPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      checkInWatermark: {
        time: `${getRelativeISODate(-1)} 06:54:15`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      },
      checkOutPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      checkOutWatermark: {
        time: `${getRelativeISODate(-1)} 15:02:40`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      }
    },
    {
      id: "att-past-2",
      workScheduleId: "ws-past-2",
      workDate: getRelativeISODate(-2),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: "07:08",
      checkOut: "15:05",
      status: "late",
      totalHours: 7.9,
      editedByLandlord: false,
      note: "Đến muộn 8 phút do kẹt xe cầu vượt",
      checkInExplanation: "Tuyến đường QL21 kẹt xe nghiêm trọng do va quẹt giao thông, tôi có chụp ảnh đường gửi trước trong nhóm Zalo ca trực.",
      checkInPhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
      checkInWatermark: {
        time: `${getRelativeISODate(-2)} 07:08:22`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      },
      checkOutPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
      checkOutWatermark: {
        time: `${getRelativeISODate(-2)} 15:05:11`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      }
    },
    {
      id: "att-past-3",
      workScheduleId: "ws-past-3",
      workDate: getRelativeISODate(-3),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: "06:58",
      checkOut: "15:10",
      status: "on_time",
      totalHours: 8.2,
      editedByLandlord: false,
      checkInPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
      checkInWatermark: {
        time: `${getRelativeISODate(-3)} 06:58:30`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      }
    },
    {
      id: "att-past-4",
      workScheduleId: "ws-past-4",
      workDate: getRelativeISODate(-4),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: "06:52",
      checkOut: "14:30",
      status: "on_time",
      totalHours: 7.5,
      editedByLandlord: false,
      isEarlyCheckOut: true,
      checkOutExplanation: "Đã bàn giao ca sớm 30 phút cho đồng nghiệp Hoàng Văn Đức trực thay do gia đình có việc khẩn tại quê.",
      checkInPhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
      checkInWatermark: {
        time: `${getRelativeISODate(-4)} 06:52:19`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      },
      checkOutPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      checkOutWatermark: {
        time: `${getRelativeISODate(-4)} 14:30:05`,
        place: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội",
        staffName: "Nguyễn Văn Tuấn (NV01)",
        coordinates: "21.0132° N, 105.5258° E"
      }
    },
    {
      id: "att-past-5",
      workScheduleId: "ws-past-5",
      workDate: getRelativeISODate(-5),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Chiều",
      shiftTime: "15:00 - 23:00",
      checkIn: "14:55",
      checkOut: "23:08",
      status: "on_time",
      totalHours: 8.1,
      editedByLandlord: false
    },
    {
      id: "att-past-6",
      workScheduleId: "ws-past-6",
      workDate: getRelativeISODate(-6),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: null,
      checkOut: null,
      status: "absent",
      totalHours: 0,
      editedByLandlord: false,
      note: "Nghỉ lễ không đăng ký trực"
    },
    {
      id: "att-past-7",
      workScheduleId: "ws-past-7",
      workDate: getRelativeISODate(-7),
      boardingHouseName: "KTX HOLA (Khu A)",
      shiftName: "Ca Sáng",
      shiftTime: "07:00 - 15:00",
      checkIn: "06:50",
      checkOut: "15:00",
      status: "on_time",
      totalHours: 8,
      editedByLandlord: true,
      note: "Chủ trọ xác nhận công bù do lỗi quét vân tay"
    }
  ];
}

export const MOCK_ATTENDANCES: AttendanceRecord[] = generateMockAttendances();

// =======================================================================================
// PERSISTENT ATTENDANCE STATE & REAL-TIME EVENT BUS
// =======================================================================================
export const ATTENDANCE_STORAGE_KEY = "dormio_staff_attendances_list";
export const TODAY_ATTENDANCE_STORAGE_KEY = "dormio_staff_today_attendance";

export function getStoredAttendances(): AttendanceRecord[] {
  if (typeof window === "undefined") return MOCK_ATTENDANCES;
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    const today = getTodayISODate();
    if (raw) {
      const list: AttendanceRecord[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        // Ensure today's record matches saved single record if exists
        const todayRaw = localStorage.getItem(TODAY_ATTENDANCE_STORAGE_KEY);
        if (todayRaw) {
          const todayRecord: AttendanceRecord = JSON.parse(todayRaw);
          const todayIdx = list.findIndex(a => a.workDate === today || a.id === "att-today");
          if (todayIdx >= 0) {
            list[todayIdx] = todayRecord;
          } else {
            list.unshift(todayRecord);
          }
        }
        return list;
      }
    }
    // First time: initialize storage with MOCK_ATTENDANCES
    const initialList = generateMockAttendances();
    const todayRaw = localStorage.getItem(TODAY_ATTENDANCE_STORAGE_KEY);
    if (todayRaw) {
      const todayRecord: AttendanceRecord = JSON.parse(todayRaw);
      const todayIdx = initialList.findIndex(a => a.workDate === today || a.id === "att-today");
      if (todayIdx >= 0) {
        initialList[todayIdx] = todayRecord;
      }
    }
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(initialList));
    return initialList;
  } catch (e) {
    console.error("Failed to parse attendances from storage", e);
  }
  return MOCK_ATTENDANCES;
}

export function saveAttendanceRecord(record: AttendanceRecord): void {
  if (typeof window === "undefined") return;
  try {
    // 1. Save single today record
    localStorage.setItem(TODAY_ATTENDANCE_STORAGE_KEY, JSON.stringify(record));

    // 2. Update in full list
    const currentList = getStoredAttendances();
    const existingIdx = currentList.findIndex(a => a.id === record.id || a.workDate === record.workDate);
    let updatedList: AttendanceRecord[];
    if (existingIdx >= 0) {
      updatedList = [...currentList];
      updatedList[existingIdx] = record;
    } else {
      updatedList = [record, ...currentList];
    }
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedList));

    // 3. Dispatch custom window event for instant real-time sync across components/tabs
    window.dispatchEvent(new CustomEvent("dormio_attendance_updated", { detail: record }));
  } catch (e) {
    console.error("Failed to save attendance record", e);
  }
}

// Helper: Check-in window validation (UC-S-02)
// Allowed window: [startTime - 10 minutes, startTime]
// Returns: 'too_early' | 'can_checkin_ontime' | 'can_checkin_late' | 'too_late' | 'already_checked_in'
export function evaluateCheckInWindow(
  shift: Shift,
  currentTimeStr: string, // "HH:mm"
  hasCheckedIn: boolean
): {
  allowed: boolean;
  statusText: string;
  reason: string;
  isLate: boolean;
} {
  if (hasCheckedIn) {
    return {
      allowed: false,
      statusText: "Đã Check-in",
      reason: "Bạn đã hoàn thành check-in ca trực này.",
      isLate: false
    };
  }

  const [startH, startM] = shift.startTime.split(":").map(Number);
  const [currH, currM] = currentTimeStr.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const currentMinutes = currH * 60 + currM;
  const windowOpenMinutes = startMinutes - 10;

  if (currentMinutes < windowOpenMinutes) {
    const diff = windowOpenMinutes - currentMinutes;
    return {
      allowed: false,
      statusText: `Mở sau ${diff} phút`,
      reason: `Cổng check-in chỉ mở trước ca làm 10 phút (từ ${formatMinutesToHHMM(windowOpenMinutes)}).`,
      isLate: false
    };
  }

  if (currentMinutes <= startMinutes) {
    return {
      allowed: true,
      statusText: "Sẵn sàng Check-in",
      reason: "Đang trong khung giờ check-in hợp lệ (Đúng giờ).",
      isLate: false
    };
  }

  // After start time: allowed with 'late' flag
  const [endH, endM] = shift.endTime.split(":").map(Number);
  const endMinutes = endH * 60 + endM;

  if (currentMinutes < endMinutes) {
    const lateMinutes = currentMinutes - startMinutes;
    return {
      allowed: true,
      statusText: `Check-in (Muộn ${lateMinutes}p)`,
      reason: `Bạn đang check-in muộn ${lateMinutes} phút so với giờ bắt đầu ca.`,
      isLate: true
    };
  }

  return {
    allowed: false,
    statusText: "Đã hết ca",
    reason: "Ca trực đã kết thúc. Bạn không thể check-in bổ sung.",
    isLate: true
  };
}

// Helper: Check-out window validation (UC-S-02)
// Allowed window: [endTime, endTime + 12 hours], or early checkout with mandatory explanation
export function evaluateCheckOutWindow(
  shift: Shift,
  currentTimeStr: string,
  hasCheckedIn: boolean,
  hasCheckedOut: boolean
): {
  allowed: boolean;
  statusText: string;
  reason: string;
  isEarly: boolean;
  earlyMinutes?: number;
} {
  if (!hasCheckedIn) {
    return {
      allowed: false,
      statusText: "Chưa Check-in",
      reason: "Bạn phải check-in vào ca trước khi thực hiện check-out.",
      isEarly: false
    };
  }

  if (hasCheckedOut) {
    return {
      allowed: false,
      statusText: "Đã hoàn thành ca",
      reason: "Bạn đã check-out thành công ca làm việc này.",
      isEarly: false
    };
  }

  const [endH, endM] = shift.endTime.split(":").map(Number);
  const [currH, currM] = currentTimeStr.split(":").map(Number);

  const endMinutes = endH * 60 + endM;
  const currentMinutes = currH * 60 + currM;

  if (currentMinutes < endMinutes) {
    const diff = endMinutes - currentMinutes;
    return {
      allowed: true, // Cho phép check-out sớm có giải trình
      statusText: `Check-out Sớm (${diff}p)`,
      reason: `Chưa đến giờ kết thúc ca (${shift.endTime}). Bạn cần giải trình lý do về sớm để Chủ trọ phê duyệt.`,
      isEarly: true,
      earlyMinutes: diff
    };
  }

  // Allowed for 12 hours after shift
  const maxMinutes = endMinutes + 12 * 60;
  if (currentMinutes <= maxMinutes) {
    return {
      allowed: true,
      statusText: "Sẵn sàng Check-out",
      reason: "Ca trực đã hoàn thành. Hãy chụp ảnh xác thực để chốt ca làm việc.",
      isEarly: false
    };
  }

  return {
    allowed: false,
    statusText: "Quá hạn Check-out",
    reason: "Đã quá 12 tiếng kể từ khi ca kết thúc. Vui lòng liên hệ Chủ trọ để cập nhật thủ công.",
    isEarly: false
  };
}

function formatMinutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getLocalizedPlace(place?: string, isEn = false): string {
  if (!place) return "";
  if (!isEn) return place;
  if (place.includes("Hòa Lạc") || place.includes("Hoa Lac")) {
    return "Hoa Lac Hi-Tech Park, Thach That, Hanoi";
  }
  if (place.includes("Cầu Giấy") || place.includes("Cau Giay")) {
    return "Dormio Campus Cau Giay, Hanoi";
  }
  if (place.includes("KTX HOLA")) {
    return "HOLA Dormitory (Block A)";
  }
  if (place.includes("Tọa độ GPS")) {
    return place.replace("Tọa độ GPS", "GPS Coordinates");
  }
  return place
    .replace(/Hà Nội/gi, "Hanoi")
    .replace(/Thạch Thất/gi, "Thach That")
    .replace(/Khu Công Nghệ Cao/gi, "Hi-Tech Park")
    .replace(/Cầu Giấy/gi, "Cau Giay")
    .replace(/Quận/gi, "District")
    .replace(/Huyện/gi, "District")
    .replace(/Phường/gi, "Ward")
    .replace(/Xã/gi, "Commune")
    .replace(/Đường/gi, "Street")
    .replace(/Phố/gi, "Street")
    .replace(/Ngõ/gi, "Alley")
    .replace(/Số/gi, "No.")
    .replace(/Tòa nhà/gi, "Building")
    .replace(/Việt Nam/gi, "Vietnam");
}

export function getLocalizedStaffName(name?: string, isEn = false): string {
  if (!name) return "";
  if (!isEn) return name;
  if (name.includes("Nguyễn Văn Tuấn")) {
    return name.replace("Nguyễn Văn Tuấn", "Nguyen Van Tuan").replace("NV01", "Staff #01");
  }
  if (name.includes("Lê Thị Mai Lan")) {
    return name.replace("Lê Thị Mai Lan", "Le Thi Mai Lan");
  }
  if (name.includes("Trần Minh Quang")) {
    return name.replace("Trần Minh Quang", "Tran Minh Quang");
  }
  if (name.includes("Hoàng Văn Đức")) {
    return name.replace("Hoàng Văn Đức", "Hoang Van Duc");
  }
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getLocalizedExplanation(text?: string, isEn = false): string {
  if (!text) return "";
  if (!isEn) return text;
  if (text.includes("QL21") || text.includes("va quẹt") || text.includes("kẹt xe nghiêm trọng")) {
    return "Severe traffic congestion on Route 21 due to a collision, I took roadway photos and sent them to the shift team group beforehand.";
  }
  if (text.includes("Hoàng Văn Đức") || text.includes("việc khẩn tại quê") || text.includes("bàn giao ca sớm")) {
    return "Handed over shift 30 minutes early to colleague Hoang Van Duc due to an urgent family matter in hometown.";
  }
  if (text.includes("kẹt xe cầu vượt") || text.includes("Đến muộn 8 phút")) {
    return "Arrived 8 minutes late due to overpass traffic congestion.";
  }
  if (text.includes("hỏng xích") || text.includes("thủng xăm") || text.includes("xe máy")) {
    return "Motorbike breakdown with flat tire en route, reported to shift manager.";
  }
  if (text.includes("mưa ngập") || text.includes("mưa lớn")) {
    return "Localized flooding caused severe roadway traffic congestion.";
  }
  if (text.includes("sự cố đột xuất") || text.includes("khách thuê khẩn cấp")) {
    return "Assisted tenant with an unexpected emergency issue, leading to delayed check-in.";
  }
  if (text.includes("rời ca sớm 15 phút") || text.includes("phê duyệt rời ca")) {
    return "Landlord approved leaving 15 minutes early as all handovers were finalized.";
  }
  if (text.includes("việc gấp khẩn cấp") || text.includes("việc hiếu hỉ")) {
    return "Urgent family emergency, fully handed over to incoming shift.";
  }
  if (text.includes("theo checklist") || text.includes("nhiệm vụ")) {
    return "Completed all assigned tasks per duty checklist.";
  }
  if (text.includes("khóa cổng, camera") || text.includes("camera an ninh")) {
    return "Inspected gate lock, security cameras & lobby assets.";
  }
  if (text.includes("hoàn thành an toàn") || text.includes("không có sự cố")) {
    return "Shift completed safely with zero incidents.";
  }
  if (text.includes("sự đồng ý của Chủ trọ")) {
    return "Notified and received explicit landlord approval.";
  }
  if (text.includes("Check-in đúng giờ")) {
    return text.replace("Check-in đúng giờ lúc", "Checked in on-time at").replace("tại", "at");
  }
  if (text.includes("Check-in muộn")) {
    return text.replace("Check-in muộn lúc", "Checked in late at").replace("tại", "at").replace("Giải trình:", "Explanation:");
  }
  if (text.includes("Check-out đúng giờ")) {
    return text.replace("Check-out đúng giờ lúc", "Checked out on-time at").replace("tại", "at");
  }
  if (text.includes("Check-out sớm")) {
    return text.replace("Check-out sớm lúc", "Checked out early at").replace("tại", "at").replace("Giải trình:", "Explanation:");
  }
  return text;
}

// =======================================================================================
// STAFF TASKS INTERFACE & MOCK DATA (DEDICATED TASKS MANAGEMENT)
// =======================================================================================
export type TaskCategory = "security" | "cleaning" | "maintenance" | "incident" | "handover";
export type TaskPriority = "urgent" | "high" | "normal";
export type TaskStatus = "pending" | "in_progress" | "completed" | "approved";

export interface StaffTask {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  requirements: string[];
  deadline: string; // ISO or "YYYY-MM-DD HH:mm"
  priority: TaskPriority;
  status: TaskStatus;
  boardingHouseId: string;
  boardingHouseName: string;
  assignedShiftId?: string;
  assignedShiftName?: string;
  isCustomTask?: boolean; // Nhiệm vụ phát sinh / bổ sung riêng từ Chủ trọ
  requiresPhoto: boolean;
  photoProof?: string;
  photoProofTime?: string;
  completionNote?: string;
  completedAt?: string;
  landlordNote?: string;
}

export function generateMockStaffTasks(): StaffTask[] {
  const today = getTodayISODate();
  const tomorrow = getRelativeISODate(1);
  const inTwoDays = getRelativeISODate(2);
  const yesterday = getRelativeISODate(-1);

  return [
    {
      id: "task-1",
      title: "Kiểm soát an ninh cổng chính & sắp xếp bãi xe tầng hầm",
      category: "security",
      description: "Kiểm tra toàn bộ thẻ từ xe máy của sinh viên ra vào sáng sớm. Sắp xếp lại dãy xe tầng hầm khu A đảm bảo lối thoát nạn rộng tối thiểu 1.5m theo quy định PCCC.",
      requirements: [
        "Quét thẻ từ và đối chiếu biển số xe của cư dân",
        "Sắp xếp xe máy thẳng hàng, chừa lối đi thông thoáng cho cửa thoát hiểm",
        "Chụp ảnh nghiệm thu hiện trường gửi lên hệ thống"
      ],
      deadline: `${today} 08:30`,
      priority: "high",
      status: "completed",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      assignedShiftId: "ws-today",
      assignedShiftName: "Ca Sáng (07:00 - 15:00)",
      isCustomTask: false,
      requiresPhoto: true,
      photoProof: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
      photoProofTime: `07:15 - ${today}`,
      completionNote: "Đã kiểm tra 45 xe, xếp gọn lối đi thoát hiểm, khóa chốt an toàn.",
      completedAt: `07:15 - ${today}`
    },
    {
      id: "task-2",
      title: "Kiểm tra hệ thống PCCC và bình chữa cháy các tầng 1-3",
      category: "maintenance",
      description: "Chủ trọ yêu cầu rà soát áp suất đồng hồ kim tại các bình cứu hỏa MFZ4/MT3 hành lang các tầng 1, 2, 3 và kiểm tra chốt niêm phong chì trước đợt kiểm tra định kỳ.",
      requirements: [
        "Kiểm tra kim áp suất ở vùng màu xanh (đạt chuẩn)",
        "Kiểm tra dây loa vòi và kẹp chì niêm phong còn nguyên vẹn",
        "Lập biên bản danh sách bình cần nạp lại khí nếu có kim tụt áp",
        "Chụp ảnh bình chữa cháy kèm tem kiểm định"
      ],
      deadline: `${today} 11:00`,
      priority: "urgent",
      status: "in_progress",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      assignedShiftId: "ws-today",
      assignedShiftName: "Ca Sáng (07:00 - 15:00)",
      isCustomTask: true, // Nhắc nhở / bổ sung riêng từ Chủ trọ
      requiresPhoto: true,
      landlordNote: "Yêu cầu hoàn thành trước 11:00 để chủ trọ tiếp đoàn kiểm tra an toàn PCCC địa phương."
    },
    {
      id: "task-3",
      title: "Vệ sinh hành lang & thu gom rác tập kết tầng 2 và 3",
      category: "cleaning",
      description: "Quét dọn, lau sạch sàn hành lang các phòng, lau tay vịn cầu thang bộ và thu gom túi rác từ các hộc chứa rác đưa xuống khu vực tập kết rác đô thị.",
      requirements: [
        "Quét và lau sàn khô ráo, không để đọng nước trơn trượt",
        "Vận chuyển toàn bộ túi rác ra thùng gom rác trước sảnh trước 09:30",
        "Xịt dung dịch khử khuẩn tại các hộc gom rác tầng"
      ],
      deadline: `${today} 09:30`,
      priority: "normal",
      status: "completed",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      assignedShiftId: "ws-today",
      assignedShiftName: "Ca Sáng (07:00 - 15:00)",
      isCustomTask: false,
      requiresPhoto: true,
      photoProof: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
      photoProofTime: `09:10 - ${today}`,
      completionNote: "Hành lang sạch sẽ, rác đã đưa xuống thùng rác lớn phía cổng phụ.",
      completedAt: `09:10 - ${today}`
    },
    {
      id: "task-4",
      title: "Ghi nhận chỉ số công tơ điện nước phòng 204 & 305",
      category: "maintenance",
      description: "Khách thuê phòng 204 và 305 trả phòng trong tuần này. Cần chốt chỉ số đồng hồ điện và nước thực tế trên mặt đồng hồ để gửi kế toán chốt hóa đơn thanh lý hợp đồng.",
      requirements: [
        "Chụp ảnh rõ nét chỉ số điện (kWh) và nước (m3) tại hộp kỹ thuật",
        "Ghi chỉ số bằng số vào phiếu bàn giao",
        "Kiểm tra niêm phong công tơ không có dấu hiệu cạy phá"
      ],
      deadline: `${today} 14:00`,
      priority: "high",
      status: "pending",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      assignedShiftId: "ws-today",
      assignedShiftName: "Ca Sáng (07:00 - 15:00)",
      isCustomTask: true, // Nhắc nhở / bổ sung riêng từ Chủ trọ
      requiresPhoto: true,
      landlordNote: "Khách hẹn 15:00 làm thủ tục trả cọc, cần chỉ số trước 14:00."
    },
    {
      id: "task-5",
      title: "Hỗ trợ khách mới nhận phòng 102 & kiểm tra bàn giao nội thất",
      category: "handover",
      description: "Chào đón tân sinh viên nhận phòng 102 theo lịch hẹn trên hệ thống. Hướng dẫn sử dụng khóa vân tay, kiểm tra điều hòa, bình nóng lạnh và bàn giao chìa khóa dự phòng.",
      requirements: [
        "Cài đặt mã vân tay cho khách thuê chính và người ở cùng",
        "Bật thử điều hòa và bình nóng lạnh đảm bảo hoạt động tốt",
        "Cho khách ký xác nhận vào biên bản kiểm kê tài sản phòng 102"
      ],
      deadline: `${today} 10:00`,
      priority: "normal",
      status: "in_progress",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      assignedShiftId: "ws-today",
      assignedShiftName: "Ca Sáng (07:00 - 15:00)",
      isCustomTask: false,
      requiresPhoto: false
    },
    {
      id: "task-6",
      title: "Sửa chữa bóng đèn chiếu sáng hành lang tầng 4 bị chập chờn",
      category: "incident",
      description: "Sinh viên phòng 403 phản ánh bóng đèn LED tuýp hành lang trước cửa phòng bị nhấp nháy vào buổi tối. Cần thay bóng LED 18W mới từ kho vật tư.",
      requirements: [
        "Ngắt aptomat nhánh trước khi thao tác sửa chữa điện",
        "Thay bóng LED 18W mới và kiểm tra tiếp xúc đui đèn",
        "Bật lại aptomat và kiểm tra chiếu sáng ổn định"
      ],
      deadline: `${today} 16:30`,
      priority: "normal",
      status: "pending",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      isCustomTask: true, // Nhắc nhở / bổ sung riêng từ Chủ trọ
      requiresPhoto: true
    },
    {
      id: "task-7",
      title: "Kiểm tra áp lực máy bơm tăng áp tầng mái cơ sở Cầu Giấy",
      category: "maintenance",
      description: "Kiểm tra rơ-le áp lực máy bơm nước sinh hoạt tầng mái tòa Cầu Giấy sau trận mưa lớn đêm qua, đảm bảo nguồn nước cấp cho các tầng 3, 4, 5 không bị yếu.",
      requirements: [
        "Kiểm tra tiếp điểm rơ-le tự ngắt",
        "Xả thử vòi nước tầng 5 kiểm tra áp lực dòng chảy",
        "Chụp ảnh đồng hồ đo áp lực nước trên bồn chứa"
      ],
      deadline: `${tomorrow} 11:00`,
      priority: "high",
      status: "pending",
      boardingHouseId: "b2",
      boardingHouseName: "Dormio Campus Cầu Giấy",
      isCustomTask: true, // Nhắc nhở / bổ sung riêng từ Chủ trọ
      requiresPhoto: true,
      landlordNote: "Nhiệm vụ được bàn giao cho ca trực ngày mai."
    },
    {
      id: "task-8",
      title: "Kiểm tra khóa cổng vân tay & cổng phụ thoát hiểm ban đêm",
      category: "security",
      description: "Chốt khóa cổng tự động lúc 23:00, kiểm tra hệ thống camera góc khuất và lập danh sách các phòng về muộn sau 23:30.",
      requirements: [
        "Kích hoạt chốt khóa điện từ tự động cổng chính",
        "Kiểm tra chốt cơ khí cổng phụ thoát hiểm khóa an toàn",
        "Lưu nhật ký giám sát an ninh ban đêm"
      ],
      deadline: `${yesterday} 23:30`,
      priority: "urgent",
      status: "approved",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      assignedShiftName: "Ca Đêm (23:00 - 07:00)",
      isCustomTask: false,
      requiresPhoto: true,
      photoProof: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
      photoProofTime: `23:15 - ${yesterday}`,
      completionNote: "Cổng đã khóa an toàn, camera hoạt động bình thường.",
      completedAt: `23:15 - ${yesterday}`,
      landlordNote: "Chủ trọ đã kiểm tra qua camera và phê duyệt hoàn thành."
    },
    {
      id: "task-9",
      title: "Rà soát ban công & khơi thông phễu thoát sàn trước đợt mưa lớn",
      category: "maintenance",
      description: "Chủ trọ yêu cầu kiểm tra thoát sàn ban công hành lang và nhắc nhở sinh viên thu dọn đồ đạc trước bão.",
      requirements: [
        "Kiểm tra phễu thu nước ban công các tầng 2, 3, 4",
        "Dọn rác, lá cây ứ đọng tại máng xối tầng thượng",
        "Chụp ảnh báo cáo hoàn tất"
      ],
      deadline: `${inTwoDays} 15:00`,
      priority: "urgent",
      status: "pending",
      boardingHouseId: "b1",
      boardingHouseName: "KTX HOLA (Khu A)",
      isCustomTask: true, // Nhắc nhở / bổ sung riêng từ Chủ trọ
      requiresPhoto: true,
      landlordNote: "Chủ trọ yêu cầu kiểm tra thoát sàn ban công tất cả các phòng trước khi mưa bão."
    }
  ];
}

export const MOCK_STAFF_TASKS: StaffTask[] = generateMockStaffTasks();


