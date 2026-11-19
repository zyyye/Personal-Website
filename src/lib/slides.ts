/** The five home-page slides (plan section 3). Order here is order on the page and in the taskbar. */
export const SLIDES = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'learning', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SlideId = (typeof SLIDES)[number]['id'];
