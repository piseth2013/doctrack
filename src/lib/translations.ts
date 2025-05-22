import { create } from 'zustand';

type Language = 'en' | 'km';

type TranslationStore = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const translations = {
  en: {
    dropFilesHere: 'Drop files here',
    dragAndDrop: 'Drag and drop files here, or click to select files',
    maxFiles: 'Maximum {count} files',
    maxSize: 'Maximum size per file: {size}',
    acceptedFileTypes: 'Accepted file types',
    selectedFiles: 'Selected Files',
    removeFile: 'Remove file'
  },
  km: {
    dropFilesHere: 'ទម្លាក់ឯកសារនៅទីនេះ',
    dragAndDrop: 'អូសនិងទម្លាក់ឯកសារនៅទីនេះ ឬចុចដើម្បីជ្រើសរើសឯកសារ',
    maxFiles: 'អតិបរមា {count} ឯកសារ',
    maxSize: 'ទំហំអតិបរមាក្នុងមួយឯកសារ៖ {size}',
    acceptedFileTypes: 'ប្រភេទឯកសារដែលទទួលយក',
    selectedFiles: 'ឯកសារដែលបានជ្រើសរើស',
    removeFile: 'លុបឯកសារ'
  }
};

export const useTranslationStore = create<TranslationStore>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language })
}));

export const useTranslation = () => {
  const { language } = useTranslationStore();

  const t = (key: keyof typeof translations['en'], params?: Record<string, string | number>) => {
    let translation = translations[language][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(`{${key}}`, String(value));
      });
    }
    
    return translation;
  };

  return t;
};