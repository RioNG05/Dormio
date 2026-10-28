
export const enErrors: Record<string, string> = {
  // --- Auth & Access Control ---
  AUTH_INVALID_CREDENTIALS: 'Incorrect phone number or password.',
  AUTH_PHONE_ALREADY_EXISTS: 'This phone number is already registered.',
  AUTH_EMAIL_ALREADY_EXISTS: 'This email address is already in use.',
  AUTH_CURRENT_PASSWORD_INCORRECT: 'The current password you entered is incorrect.',
  AUTH_NEW_PASSWORD_MUST_DIFFER: 'The new password must be different from your current password.',
  AUTH_MUST_CHANGE_PASSWORD: 'You must change your temporary password before accessing the system.',
  AUTH_ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  AUTH_UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  AUTH_FORBIDDEN: 'You do not have permission to perform this action.',
  AUTH_IDENTITY_VERIFICATION_REQUIRED: 'Please complete citizen identity verification (CCCD) to proceed.',

  // --- Subscriptions & Quota ---
  TIER_SUBSCRIPTION_REQUIRED: 'This feature requires an active paid subscription plan.',
  TIER_BOARDING_HOUSE_LIMIT_REACHED: 'You have reached the maximum number of boarding houses allowed by your plan.',
  TIER_ROOM_LIMIT_REACHED: 'You have reached the maximum room limit ({maxAllowed} rooms) for your current plan. Please upgrade to add more rooms.',
  TIER_POST_QUOTA_EXCEEDED: 'You have exhausted your rental post quota for today. Please buy additional posts or try again tomorrow.',

  // --- Boarding Houses ---
  HOUSE_NOT_FOUND: 'The requested boarding house could not be found.',
  HOUSE_ACCESS_DENIED: 'You do not have permission to manage this boarding house.',

  // --- Rooms ---
  ROOM_NOT_FOUND: 'The requested room could not be found.',
  ROOM_ALREADY_OCCUPIED: 'This room is already occupied by active tenants.',
  ROOM_HAS_ACTIVE_CONTRACT: 'This room has an active lease contract in effect.',
  ROOM_TYPE_NOT_FOUND: 'The requested room type could not be found.',

  // --- Contracts ---
  CONTRACT_NOT_FOUND: 'The requested lease contract could not be found.',
  CONTRACT_INVALID_STATUS: 'The contract is not in a valid state for this operation.',
  CONTRACT_ALREADY_CONFIRMED: 'This contract has already been confirmed.',
  CONTRACT_ALREADY_REJECTED: 'This contract has already been rejected.',
  CONTRACT_ACCESS_DENIED: 'You do not have authorization to modify this contract.',
  CONTRACT_CANNOT_CANCEL: 'Active contracts cannot be cancelled directly.',
  CONTRACT_MISSING_TENANT: 'The contract is missing a primary tenant assignment.',

  // --- Invoices & Billing ---
  INVOICE_NOT_FOUND: 'The requested room invoice was not found.',
  INVOICE_ALREADY_PAID: 'This invoice has already been paid in full.',
  INVOICE_PERIOD_CONFLICT: 'An invoice for this billing period already exists.',
  INVOICE_ITEMS_EMPTY: 'The invoice must contain at least one charge item.',

  // --- Payments ---
  PAYMENT_SESSION_EXPIRED: 'The payment session has expired. Please initiate a new payment.',
  PAYMENT_ALREADY_PROCESSED: 'This payment transaction has already been processed.',
  PAYMENT_ORDER_NOT_FOUND: 'Payment order could not be located on the PayOS gateway.',
  PAYMENT_INVALID_AMOUNT: 'The transaction amount does not match the invoice balance.',

  // --- Meter Readings & OCR ---
  METER_READING_INVALID: 'The submitted meter reading value is invalid.',
  METER_VALUE_LESS_THAN_PREVIOUS: 'New reading cannot be lower than the previous period reading.',
  METER_OCR_FAILED: 'Could not detect numeric digits from the photo. Please enter reading manually.',
  METER_ALREADY_SUBMITTED: 'Meter readings have already been recorded for this cycle.',

  // --- Staff & Attendance ---
  ATTEND_OUTSIDE_WINDOW: 'You are attempting to clock in outside the permitted shift window.',
  ATTEND_ALREADY_CHECKED_IN: 'You have already clocked in for this shift.',
  ATTEND_NOT_CHECKED_IN: 'Clock out is not possible without a valid clock-in record.',
  ATTEND_ALREADY_CHECKED_OUT: 'This shift has already been clocked out.',
  ATTEND_SCHEDULE_NOT_FOUND: 'The specified shift schedule was not found.',
  ATTEND_STAFF_PROFILE_NOT_FOUND: 'Employee staff profile was not found in the system.',

  // --- Assets ---
  ASSET_NOT_FOUND: 'The requested asset/equipment could not be found.',
  ASSET_ROOM_MISMATCH: 'The selected room does not belong to the active boarding house.',

  // --- Tenants & Occupants ---
  TENANT_NOT_FOUND: 'Tenant record not found.',
  TENANT_ALREADY_IN_HOUSE: 'A tenant with this phone number is already residing in this property.',
  TENANT_PROFILE_LOCKED: 'Tenant has already activated their account and changed password. Personal identification cannot be modified by the landlord.',
  TENANT_NOT_IN_ROOM: 'The selected tenant does not currently reside in this room.',
    ROOM_MAX_OCCUPANTS_REACHED: 'Room capacity has reached its maximum occupants limit.',
  ROOM_HAS_NO_OCCUPANTS: 'Room has no active occupants. Please add tenants to the room before creating a contract.',

  // --- Common Infrastructure & Fallbacks ---
  COMMON_VALIDATION_ERROR: 'The submitted data is invalid. Please check the input fields.',
  COMMON_RESOURCE_NOT_FOUND: 'The requested resource was not found on the server.',
  COMMON_FORBIDDEN: 'You are not authorized to perform this operation.',
  COMMON_INTERNAL_ERROR: 'An unexpected system error occurred. Please try again later.',
}

export default enErrors

