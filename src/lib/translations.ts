import { create } from 'zustand';

type Language = 'en' | 'km';

interface TranslationStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useTranslationStore = create<TranslationStore>((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    documents: 'Documents',
    newDocument: 'New Document',
    users: 'Users',
    settings: 'Settings',
    general: 'General',
    signOut: 'Sign out',
    comingSoon: 'More settings coming soon...',

    // Dashboard
    overview: 'Overview of your document management system',
    totalDocuments: 'Total Documents',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    recentDocuments: 'Recent Documents',
    quickLinks: 'Quick Links',
    uploadNewDocument: 'Upload New Document',
    pendingDocuments: 'Pending Documents',
    manageUsers: 'Manage Users',
    systemStats: 'System Stats',
    totalUsers: 'Total Users',
    noDocumentsFound: 'No documents found',
    createFirstDocument: 'Create your first document',

    // Documents
    documentTitle: 'Document Title',
    description: 'Description',
    status: 'Status',
    createdBy: 'Created by',
    createdOn: 'Created on',
    lastUpdated: 'Last updated',
    documentFiles: 'Document Files',
    noFilesAttached: 'No files attached to this document',
    documentInformation: 'Document Information',
    deleteDocument: 'Delete Document',
    searchDocuments: 'Search documents...',

    // Users
    manageSystemUsers: 'Manage system users and permissions',
    addUser: 'Add User',
    email: 'Email',
    fullName: 'Full Name',
    role: 'Role',
    department: 'Department',
    password: 'Password',
    administrator: 'Administrator',
    user: 'User',
    memberSince: 'Member since',
    remove: 'Remove',
    searchUsers: 'Search users...',
    noUsersFound: 'No users found',
    adminOnly: 'Only administrators can manage users in the system.',
    noPermission: 'You do not have permission to create new users. Only administrators can perform this action.',
    requiredFields: 'Email, full name, and password are required',
    departmentOptional: 'Department (Optional)',
    cancel: 'Cancel',
    noMatchingUsers: 'No users matching "{query}"',
    getStartedAddUser: 'Get started by adding a new user',
    confirmDelete: 'Are you sure you want to delete user {name}?',
    loadingUsers: 'Loading users...',

    // Auth
    signIn: 'Sign in',
    demoCredentials: 'Demo credentials',
  },
  km: {
    // Navigation
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    documents: 'ឯកសារ',
    newDocument: 'ឯកសារថ្មី',
    users: 'អ្នកប្រើប្រាស់',
    settings: 'ការកំណត់',
    general: 'ទូទៅ',
    signOut: 'ចាកចេញ',
    comingSoon: 'ការកំណត់បន្ថែមនឹងមកដល់ឆាប់ៗនេះ...',

    // Dashboard
    overview: 'ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធគ្រប់គ្រងឯកសាររបស់អ្នក',
    totalDocuments: 'ឯកសារសរុប',
    pending: 'កំពុងរង់ចាំ',
    approved: 'បានអនុម័ត',
    rejected: 'បានបដិសេធ',
    recentDocuments: 'ឯកសារថ្មីៗ',
    quickLinks: 'តំណភ្ជាប់រហ័ស',
    uploadNewDocument: 'បង្ហោះឯកសារថ្មី',
    pendingDocuments: 'ឯកសារកំពុងរង់ចាំ',
    manageUsers: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    systemStats: 'ស្ថិតិប្រព័ន្ធ',
    totalUsers: 'អ្នកប្រើប្រាស់សរុប',
    noDocumentsFound: 'រកមិនឃើញឯកសារ',
    createFirstDocument: 'បង្កើតឯកសារដំបូងរបស់អ្នក',

    // Documents
    documentTitle: 'ចំណងជើងឯកសារ',
    description: 'ការពិពណ៌នា',
    status: 'ស្ថានភាព',
    createdBy: 'បង្កើតដោយ',
    createdOn: 'បង្កើតនៅ',
    lastUpdated: 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ',
    documentFiles: 'ឯកសារភ្ជាប់',
    noFilesAttached: 'គ្មានឯកសារភ្ជាប់',
    documentInformation: 'ព័ត៌មានឯកសារ',
    deleteDocument: 'លុបឯកសារ',
    searchDocuments: 'ស្វែងរកឯកសារ...',

    // Users
    manageSystemUsers: 'គ្រប់គ្រងអ្នកប្រើប្រាស់និងសិទ្ធិ',
    addUser: 'បន្ថែមអ្នកប្រើប្រាស់',
    email: 'អ៊ីមែល',
    fullName: 'ឈ្មោះពេញ',
    role: 'តួនាទី',
    department: 'នាយកដ្ឋាន',
    password: 'ពាក្យសម្ងាត់',
    administrator: 'អ្នកគ្រប់គ្រង',
    user: 'អ្នកប្រើប្រាស់',
    memberSince: 'សមាជិកចាប់តាំងពី',
    remove: 'លុប',
    searchUsers: 'ស្វែងរកអ្នកប្រើប្រាស់...',
    noUsersFound: 'រកមិនឃើញអ្នកប្រើប្រាស់',
    adminOnly: 'មានតែអ្នកគ្រប់គ្រងទេដែលអាចគ្រប់គ្រងអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ។',
    noPermission: 'អ្នកមិនមានសិទ្ធិបង្កើតអ្នកប្រើប្រាស់ថ្មីទេ។ មានតែអ្នកគ្រប់គ្រងទេដែលអាចធ្វើសកម្មភាពនេះបាន។',
    requiredFields: 'អ៊ីមែល ឈ្មោះពេញ និងពាក្យសម្ងាត់ត្រូវបានទាមទារ',
    departmentOptional: 'នាយកដ្ឋាន (ជាជម្រើស)',
    cancel: 'បោះបង់',
    noMatchingUsers: 'មិនមានអ្នកប្រើប្រាស់ដែលត្រូវនឹង "{query}" ទេ',
    getStartedAddUser: 'ចាប់ផ្តើមដោយបន្ថែមអ្នកប្រើប្រាស់ថ្មី',
    confirmDelete: 'តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់ {name} ឬ?',
    loadingUsers: 'កំពុងផ្ទុកអ្នកប្រើប្រាស់...',

    // Auth
    signIn: 'ចូល',
    demoCredentials: 'ព័ត៌មានគណនីសាកល្បង',
  },
};

export const useTranslation = () => {
  const { language } = useTranslationStore();
  return (key: keyof typeof translations.en) => translations[language][key];
};