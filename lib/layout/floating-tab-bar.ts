/**
 * Shared spacing values for the custom floating tab bar.
 * Keep these aligned with `app/(app)/(tabs)/_layout.tsx`.
 */
export const FLOATING_TAB_BAR_HEIGHT = 72;
export const FLOATING_TAB_BAR_BOTTOM_OFFSET = 8;
export const FLOATING_TAB_BAR_EXTRA_CLEARANCE = 24;

export function getFloatingTabBarScrollPadding(
  bottomInset: number,
  extraClearance: number = FLOATING_TAB_BAR_EXTRA_CLEARANCE
): number {
  return bottomInset + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET + extraClearance;
}
