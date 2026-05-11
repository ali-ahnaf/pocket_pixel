import { icons, HelpCircle } from 'lucide-react';

export const iconMapper = (name: string) => {
  const IconComponent = icons[name as keyof typeof icons];
  
  if (!IconComponent) {
    console.warn(`Icon ${name} not found in lucide-react`);
    return HelpCircle; // Fallback icon
  }
  
  return IconComponent;
};
