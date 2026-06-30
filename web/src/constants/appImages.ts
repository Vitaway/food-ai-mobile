/** MiraFood app screenshots in /public/app-images */
export const APP_IMAGES = {
  profile: '/app-images/1.png',
  home: '/app-images/2.png',
  logMeal: '/app-images/3.png',
  insights: '/app-images/4.png',
} as const;

export type AppImageKey = keyof typeof APP_IMAGES;

export const APP_IMAGE_ALTS: Record<AppImageKey, string> = {
  profile: 'MiraFood profile screen with account and privacy settings',
  home: 'MiraFood home screen with daily nutrition plan and macros',
  logMeal: 'MiraFood log meal screen with meal type selection',
  insights: 'MiraFood insights screen with calories and macro trends',
};

export function appImage(key: AppImageKey) {
  return { src: APP_IMAGES[key], alt: APP_IMAGE_ALTS[key] };
}
