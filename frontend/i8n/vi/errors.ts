export const viErrors = {
  // --- Auth & Access Control ---
  AUTH_INVALID_CREDENTIALS: 'Số điện thoại hoặc mật khẩu không chính xác.',
  AUTH_PHONE_ALREADY_EXISTS: 'Số điện thoại này đã được đăng ký tài khoản trong hệ thống.',
  AUTH_EMAIL_ALREADY_EXISTS: 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.',
  AUTH_CURRENT_PASSWORD_INCORRECT: 'Mật khẩu hiện tại không chính xác.',
  AUTH_NEW_PASSWORD_MUST_DIFFER: 'Mật khẩu mới phải khác với mật khẩu hiện tại.',
  AUTH_MUST_CHANGE_PASSWORD: 'Bạn cần đổi mật khẩu mới trong lần đăng nhập đầu tiên.',
  AUTH_ACCOUNT_LOCKED: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị.',
  AUTH_UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
  AUTH_FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  AUTH_IDENTITY_VERIFICATION_REQUIRED: 'Vui lòng hoàn thành xác minh danh tính (CCCD) trước khi thực hiện thao tác này.',

  // --- Subscriptions & Quota ---
  TIER_SUBSCRIPTION_REQUIRED: 'Tính năng này yêu cầu gói dịch vụ {requiredTier} trở lên. Vui lòng nâng cấp gói.',
  TIER_BOARDING_HOUSE_LIMIT_REACHED: 'Gói {currentTier} chỉ cho phép tối đa {maxAllowed} nhà trọ. Bạn đã đạt giới hạn ({currentCount} nhà trọ).',
  TIER_ROOM_LIMIT_REACHED: 'Bạn đã đạt giới hạn tối đa {maxAllowed} phòng của gói dịch vụ hiện tại. Vui lòng nâng cấp gói để thêm phòng.',
  TIER_POST_QUOTA_EXCEEDED: 'Bạn đã hết lượt đăng tin miễn phí trong chu kỳ này. Vui lòng mua thêm gói tin đăng.',

  // --- Aliases for backward compatibility ---
  SUBSCRIPTION_TIER_REQUIRED: 'Tính năng này yêu cầu gói dịch vụ {requiredTier} trở lên. Vui lòng nâng cấp gói.',
  BOARDING_HOUSE_LIMIT_REACHED: 'Gói {currentTier} chỉ cho phép tối đa {maxAllowed} nhà trọ. Bạn đã đạt giới hạn ({currentCount} nhà trọ).',
  IDENTITY_VERIFICATION_REQUIRED: 'Vui lòng hoàn thành xác minh danh tính (CCCD) trước khi thực hiện thao tác này.',

  // --- Boarding Houses ---
  HOUSE_NOT_FOUND: 'Không tìm thấy thông tin nhà trọ yêu cầu.',
  HOUSE_ACCESS_DENIED: 'Bạn không có quyền quản lý nhà trọ này.',

  // --- Rooms ---
  ROOM_NOT_FOUND: 'Không tìm thấy thông tin phòng trọ.',
  ROOM_ALREADY_OCCUPIED: 'Phòng này hiện đã có người thuê, không thể tạo hợp đồng mới.',
  ROOM_HAS_ACTIVE_CONTRACT: 'Phòng này đang có hợp đồng thuê có hiệu lực.',
  ROOM_TYPE_NOT_FOUND: 'Loại phòng được chọn không tồn tại hoặc đã bị xóa.',

  // --- Contracts ---
  CONTRACT_NOT_FOUND: 'Hợp đồng không tồn tại hoặc không thuộc quyền quản lý của bạn.',
  CONTRACT_INVALID_STATUS: 'Trạng thái hợp đồng hiện tại không cho phép thực hiện thao tác này.',
  CONTRACT_ALREADY_CONFIRMED: 'Hợp đồng này đã được người thuê xác nhận trước đó.',
  CONTRACT_ALREADY_REJECTED: 'Hợp đồng này đã bị từ chối.',
  CONTRACT_ACCESS_DENIED: 'Bạn không có quyền truy cập hoặc chỉnh sửa hợp đồng này.',
  CONTRACT_CANNOT_CANCEL: 'Không thể hủy hợp đồng khi đang ở trạng thái hiện tại.',
  CONTRACT_MISSING_TENANT: 'Hợp đồng thiếu thông tin đại diện người thuê chính.',

  // --- Invoices & Billing ---
  INVOICE_NOT_FOUND: 'Không tìm thấy hóa đơn tiền phòng yêu cầu.',
  INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán hoàn tất.',
  INVOICE_PERIOD_CONFLICT: 'Hóa đơn cho chu kỳ tính tiền này đã tồn tại.',
  INVOICE_ITEMS_EMPTY: 'Hóa đơn phải có ít nhất một khoản thu dịch vụ hoặc tiền phòng.',

  // --- Payments ---
  PAYMENT_SESSION_EXPIRED: 'Phiên thanh toán đã hết hạn. Vui lòng tạo lại yêu cầu thanh toán mới.',
  PAYMENT_ALREADY_PROCESSED: 'Giao dịch thanh toán này đã được xử lý thành công trước đó.',
  PAYMENT_ORDER_NOT_FOUND: 'Không tìm thấy thông tin phiên thanh toán PayOS.',
  PAYMENT_INVALID_AMOUNT: 'Số tiền thanh toán không hợp lệ.',

  // --- Meter Readings & OCR ---
  METER_READING_INVALID: 'Dữ liệu chỉ số điện/nước nhập vào không hợp lệ.',
  METER_VALUE_LESS_THAN_PREVIOUS: 'Chỉ số mới không được nhỏ hơn chỉ số chốt của kỳ trước.',
  METER_OCR_FAILED: 'Không thể nhận diện chỉ số từ ảnh công tơ. Vui lòng chụp rõ nét hơn hoặc nhập tay.',
  METER_ALREADY_SUBMITTED: 'Chỉ số điện/nước cho kỳ này đã được ghi nhận trước đó.',

  // --- Staff & Attendance ---
  ATTEND_OUTSIDE_WINDOW: 'Thời gian hiện tại nằm ngoài khung giờ cho phép check-in/check-out của ca làm việc.',
  ATTEND_ALREADY_CHECKED_IN: 'Bạn đã thực hiện check-in cho ca làm việc này rồi.',
  ATTEND_NOT_CHECKED_IN: 'Bạn cần thực hiện check-in trước khi check-out.',
  ATTEND_ALREADY_CHECKED_OUT: 'Bạn đã hoàn thành ca làm việc và check-out trước đó.',
  ATTEND_SCHEDULE_NOT_FOUND: 'Không tìm thấy lịch phân ca hoặc ca làm việc không thuộc về bạn.',
  ATTEND_STAFF_PROFILE_NOT_FOUND: 'Không tìm thấy thông tin hồ sơ nhân viên của tài khoản này.',

  // --- Assets ---
  ASSET_NOT_FOUND: 'Không tìm thấy thông tin tài sản / trang thiết bị.',
  ASSET_ROOM_MISMATCH: 'Phòng được chọn không thuộc nhà trọ đang quản lý.',

  // --- Common Infrastructure & Fallbacks ---
  COMMON_VALIDATION_ERROR: 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
  COMMON_RESOURCE_NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu trên hệ thống.',
  COMMON_FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
  COMMON_INTERNAL_ERROR: 'Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau giây lát.',
}

export default viErrors
