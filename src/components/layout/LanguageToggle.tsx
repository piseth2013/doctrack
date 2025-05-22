import React from 'react';
import { Languages } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslationStore } from '../../lib/translations';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslationStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'km' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-primary-100 hover:text-white"
    >
      <Languages size={16} />
      <span>{language === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
    </Button>
  );
};

export default LanguageToggle;