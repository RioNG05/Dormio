/**
 * Feature Flags Configuration for Dormio.
 *
 * Strategic Decision:
 * Currently, Dormio focuses exclusively on BHMS (Boarding House Management System).
 * All BHRP (Boarding House Rental Platform) marketplace features—including viewing rooms,
 * searching rooms, online reservation/deposit, landlord rental post creation, and post package purchases—
 * are temporarily hidden on the frontend.
 *
 * Re-enabling these features will take place when the system reaches a sufficient threshold
 * of active landlords, boarding houses, and total rooms in the platform.
 * All backend logic, databases, models, and endpoints remain completely intact.
 */
export const FEATURE_FLAGS = {
  /**
   * Boarding House Rental Platform (Marketplace)
   * Set to true to re-enable public room search, listings, booking, and post packs.
   */
  ENABLE_BHRP: false,
};

