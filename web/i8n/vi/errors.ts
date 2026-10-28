
export const viErrors: Record<string, string> = {
  // --- Auth & Access Control ---
  AUTH_INVALID_CREDENTIALS: 'Số điện thoại hoặc mật khẩu không chính xác.',
  AUTH_PHONE_ALREADY_EXISTS: 'Số điện thoại này đã được đăng ký trên hệ thống.',
  AUTH_EMAIL_ALREADY_EXISTS: 'Địa chỉ email này đã được sử dụng.',
  AUTH_CURRENT_PASSWORD_INCORRECT: 'Mật khẩu hiện tại không chính xác.',
  AUTH_NEW_PASSWORD_MUST_DIFFER: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
  AUTH_MUST_CHANGE_PASSWORD: 'Tài khoản cần đổi mật khẩu trước khi tiếp tục truy cập.',
  AUTH_ACCOUNT_LOCKED: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.',
  AUTH_UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  AUTH_FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  AUTH_IDENTITY_VERIFICATION_REQUIRED: 'Vui lòng hoàn tất xác thực CCCD để tiếp tục thao tác.',

  // --- Subscriptions & Quota ---
  TIER_SUBSCRIPTION_REQUIRED: 'Tính năng này yêu cầu gói đăng ký trả phí. Vui lòng nâng cấp gói.',
  TIER_BOARDING_HOUSE_LIMIT_REACHED: 'Bạn đã đạt giới hạn số lượng nhà trọ được tạo cho gói dịch vụ hiện tại.',
  TIER_ROOM_LIMIT_REACHED: 'Bạn đã đạt giới hạn số phòng tối đa ({maxAllowed} phòng) của gói dịch vụ hiện tại. Vui lòng nâng cấp gói để thêm phòng mới.',
  TIER_POST_QUOTA_EXCEEDED: 'Bạn đã hết lượt đăng tin cho thuê trong ngày. Vui lòng mua thêm lượt hoặc quay lại vào ngày mai.',

  // --- Boarding Houses ---
  HOUSE_NOT_FOUND: 'Không tìm thấy thông tin nhà trọ yêu cầu.',
  HOUSE_ACCESS_DENIED: 'Bạn không có quyền quản lý nhà trọ này.',

  // --- Rooms ---
  ROOM_NOT_FOUND: 'Không tìm thấy thông tin phòng trọ.',
  ROOM_ALREADY_OCCUPIED: 'Phòng này hiện đã có người thuê đang ở.',
  ROOM_HAS_ACTIVE_CONTRACT: 'Phòng này đang có hợp đồng thuê có hiệu lực.',
  ROOM_TYPE_NOT_FOUND: 'Không tìm thấy thông tin loại phòng.',

  // --- Contracts ---
  CONTRACT_NOT_FOUND: 'Không tìm thấy thông tin hợp đồng thuê.',
  CONTRACT_INVALID_STATUS: 'Trạng thái hợp đồng không hợp lệ để thực hiện thao tác này.',
  CONTRACT_ALREADY_CONFIRMED: 'Hợp đồng này đã được xác nhận trước đó.',
  CONTRACT_ALREADY_REJECTED: 'Hợp đồng này đã bị từ chối.',
  CONTRACT_ACCESS_DENIED: 'Bạn không có quyền can thiệp vào hợp đồng này.',
  CONTRACT_CANNOT_CANCEL: 'Hợp đồng đang hoạt động không thể hủy trực tiếp.',
  CONTRACT_MISSING_TENANT: 'Hợp đồng thiếu thông tin đại diện người thuê chính.',

  // --- Invoices & Billing ---
  INVOICE_NOT_FOUND: 'Không tìm thấy hóa đơn tiền phòng yêu cầu.',
  INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán hoàn tất.',
  INVOICE_PERIOD_CONFLICT: 'Hóa đơn cho chu kỳ tính tiền này đã tồn tại.',
  INVOICE_ITEMS_EMPTY: 'Hóa đơn phải có ít nhất một khoản thu dịch vụ.',

  // --- Payments ---
  PAYMENT_SESSION_EXPIRED: 'Phiên thanh toán đã hết hạn. Vui lòng tạo giao dịch mới.',
  PAYMENT_ALREADY_PROCESSED: 'Giao dịch thanh toán này đã được ghi nhận trước đó.',
  PAYMENT_ORDER_NOT_FOUND: 'Không tìm thấy lệnh thanh toán trên cổng PayOS.',
  PAYMENT_INVALID_AMOUNT: 'Số tiền thanh toán không khớp với giá trị hóa đơn.',

  // --- Meter Readings & OCR ---
  METER_READING_INVALID: 'Chỉ số đồng hồ không hợp lệ.',
  METER_VALUE_LESS_THAN_PREVIOUS: 'Chỉ số mới không được nhỏ hơn chỉ số của kỳ trước đó.',
  METER_OCR_FAILED: 'Không thể nhận diện chỉ số từ ảnh chụp. Vui lòng nhập tay.',
  METER_ALREADY_SUBMITTED: 'Chỉ số đồng hồ cho kỳ này đã được ghi nhận.',

  // --- Staff & Attendance ---
  ATTEND_OUTSIDE_WINDOW: 'Bạn đang điểm danh ngoài khung giờ quy định của ca làm.',
  ATTEND_ALREADY_CHECKED_IN: 'Bạn đã thực hiện check-in cho ca làm việc này rồi.',
  ATTEND_NOT_CHECKED_IN: 'Chưa có thông tin check-in, không thể thực hiện check-out.',
  ATTEND_ALREADY_CHECKED_OUT: 'Ca làm việc này đã được check-out hoàn tất.',
  ATTEND_SCHEDULE_NOT_FOUND: 'Không tìm thấy lịch phân ca làm việc yêu cầu.',
  ATTEND_STAFF_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ nhân viên trong hệ thống.',

  // --- Assets ---
  ASSET_NOT_FOUND: 'Không tìm thấy thông tin tài sản / trang thiết bị.',
  ASSET_ROOM_MISMATCH: 'Phòng được chọn không thuộc nhà trọ đang quản lý.',

  // --- Tenants & Occupants ---
  TENANT_NOT_FOUND: 'Không tìm thấy thông tin khách thuê.',
  TENANT_ALREADY_IN_HOUSE: 'Khách thuê với số điện thoại này đã có mặt trong nhà trọ.',
  TENANT_PROFILE_LOCKED: 'Khách thuê đã kích hoạt và đổi mật khẩu tài khoản. Bạn không thể chỉnh sửa thông tin định danh cá nhân của họ.',
  TENANT_NOT_IN_ROOM: 'Người thuê được chọn hiện không cư trú trong phòng này.',
    ROOM_MAX_OCCUPANTS_REACHED: 'Phòng đã đạt giới hạn số lượng người ở tối đa.',
  ROOM_HAS_NO_OCCUPANTS: 'Phòng trọ chưa có người thuê. Vui lòng thêm người thuê vào phòng để tạo hợp đồng.',

  // --- Common Infrastructure & Fallbacks ---
  COMMON_VALIDATION_ERROR: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
  COMMON_RESOURCE_NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu trên hệ thống.',
  COMMON_FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
  COMMON_INTERNAL_ERROR: 'Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau giây lát.',
}

export default viErrors

