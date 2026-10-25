export const enErrors = {
  // --- Auth & Access Control ---
  AUTH_INVALID_CREDENTIALS: 'The phone number or password provided is incorrect.',
  AUTH_PHONE_ALREADY_EXISTS: 'This phone number is already registered in the system.',
  AUTH_EMAIL_ALREADY_EXISTS: 'This email address is already in use by another account.',
  AUTH_CURRENT_PASSWORD_INCORRECT: 'The current password provided is incorrect.',
  AUTH_NEW_PASSWORD_MUST_DIFFER: 'The new password must be different from the current password.',
  AUTH_MUST_CHANGE_PASSWORD: 'You must set a new password on your first login.',
  AUTH_ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  AUTH_UNAUTHORIZED: 'Your session has expired or is invalid. Please log in again.',
  AUTH_FORBIDDEN: 'You do not have permission to perform this action.',
  AUTH_IDENTITY_VERIFICATION_REQUIRED: 'Please complete national ID (CCCD) verification before performing this action.',

  // --- Subscriptions & Quota ---
  TIER_SUBSCRIPTION_REQUIRED: 'This feature requires the {requiredTier} plan or higher. Please upgrade your plan.',
  TIER_BOARDING_HOUSE_LIMIT_REACHED: 'Your {currentTier} plan allows up to {maxAllowed} property(ies). You have reached the limit ({currentCount}).',
  TIER_ROOM_LIMIT_REACHED: 'You have reached the maximum room quota ({maxAllowed}) for your current plan. Please upgrade to add more rooms.',
  TIER_POST_QUOTA_EXCEEDED: 'You have reached your free post quota for this cycle. Please purchase additional post quota.',

  // --- Aliases for backward compatibility ---
  SUBSCRIPTION_TIER_REQUIRED: 'This feature requires the {requiredTier} plan or higher. Please upgrade your plan.',
  BOARDING_HOUSE_LIMIT_REACHED: 'Your {currentTier} plan allows up to {maxAllowed} property(ies). You have reached the limit ({currentCount}).',
  IDENTITY_VERIFICATION_REQUIRED: 'Please complete national ID (CCCD) verification before performing this action.',

  // --- Boarding Houses ---
  HOUSE_NOT_FOUND: 'The requested boarding house could not be found.',
  HOUSE_ACCESS_DENIED: 'You do not have permission to manage this boarding house.',

  // --- Rooms ---
  ROOM_NOT_FOUND: 'The requested room could not be found.',
  ROOM_ALREADY_OCCUPIED: 'This room is currently occupied; a new contract cannot be created.',
  ROOM_HAS_ACTIVE_CONTRACT: 'This room already has an active tenancy contract.',
  ROOM_TYPE_NOT_FOUND: 'The selected room type does not exist or has been deleted.',

  // --- Contracts ---
  CONTRACT_NOT_FOUND: 'The contract could not be found or does not belong to you.',
  CONTRACT_INVALID_STATUS: 'The current contract status does not allow this operation.',
  CONTRACT_ALREADY_CONFIRMED: 'This contract has already been confirmed by the tenant.',
  CONTRACT_ALREADY_REJECTED: 'This contract has already been rejected.',
  CONTRACT_ACCESS_DENIED: 'You do not have access to view or edit this contract.',
  CONTRACT_CANNOT_CANCEL: 'The contract cannot be canceled in its current state.',
  CONTRACT_MISSING_TENANT: 'Contract is missing primary tenant representative information.',

  // --- Invoices & Billing ---
  INVOICE_NOT_FOUND: 'The requested room invoice could not be found.',
  INVOICE_ALREADY_PAID: 'This invoice has already been paid in full.',
  INVOICE_PERIOD_CONFLICT: 'An invoice for this billing cycle already exists.',
  INVOICE_ITEMS_EMPTY: 'An invoice must have at least one billable line item.',

  // --- Payments ---
  PAYMENT_SESSION_EXPIRED: 'The payment session has expired. Please initiate a new payment.',
  PAYMENT_ALREADY_PROCESSED: 'This payment transaction has already been processed successfully.',
  PAYMENT_ORDER_NOT_FOUND: 'PayOS payment session could not be found.',
  PAYMENT_INVALID_AMOUNT: 'The payment amount is invalid.',

  // --- Meter Readings & OCR ---
  METER_READING_INVALID: 'The meter reading values provided are invalid.',
  METER_VALUE_LESS_THAN_PREVIOUS: 'The new meter reading cannot be lower than the previous recorded reading.',
  METER_OCR_FAILED: 'Could not detect meter digits from the photo. Please take a clearer photo or enter manually.',
  METER_ALREADY_SUBMITTED: 'Meter readings for this billing period have already been recorded.',

  // --- Staff & Attendance ---
  ATTEND_OUTSIDE_WINDOW: 'Current time is outside the allowed check-in/check-out time window for this shift.',
  ATTEND_ALREADY_CHECKED_IN: 'You have already checked in for this shift.',
  ATTEND_NOT_CHECKED_IN: 'You must check in before performing check-out.',
  ATTEND_ALREADY_CHECKED_OUT: 'You have already checked out and completed this shift.',
  ATTEND_SCHEDULE_NOT_FOUND: 'Work shift schedule not found or does not belong to you.',
  ATTEND_STAFF_PROFILE_NOT_FOUND: 'Staff profile could not be found for this account.',

  // --- Assets ---
  ASSET_NOT_FOUND: 'The requested asset/equipment could not be found.',
  ASSET_ROOM_MISMATCH: 'The selected room does not belong to the active boarding house.',

  // --- Tenants & Occupants ---
  TENANT_NOT_FOUND: 'Tenant record not found.',
  TENANT_ALREADY_IN_HOUSE: 'A tenant with this phone number is already residing in this property.',
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
