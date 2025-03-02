// i18n.ts
// Language support utility for Qualia Assistant

// Translation strings for the application
export type LocaleType = "en" | "el";

interface Translations {
  [key: string]: {
    en: string;
    el: string;
  };
}

// Main UI translations
export const translations: Translations = {
  // Navigation
  navChat: {
    en: "Chat",
    el: "Συνομιλία",
  },
  navKnowledgeBase: {
    en: "Knowledge Base",
    el: "Βάση Γνώσεων",
  },
  navInvoiceAutomation: {
    en: "Invoice Automation",
    el: "Αυτοματισμός Τιμολογίων",
  },
  navLeadGeneration: {
    en: "Lead Generation",
    el: "Δημιουργία Οδηγών",
  },
  
  // Chat interface
  chatPlaceholder: {
    en: "Type your message...",
    el: "Γράψε το μήνυμά σου...",
  },
  chatWelcome: {
    en: "Hello! I'm Qualia, your AI assistant for Tzironis. How can I help you today?",
    el: "Γεια! Είμαι η Qualia, ο βοηθός AI για την Tzironis. Πώς μπορώ να σας βοηθήσω σήμερα;",
  },
  startChatting: {
    en: "Start Chatting with Qualia",
    el: "Ξεκινήστε τη συνομιλία με την Qualia",
  },
  
  // Home page
  homeTitle: {
    en: "Qualia AI Assistant",
    el: "Βοηθός AI Qualia",
  },
  homeSubtitle: {
    en: "Your intelligent business assistant for Tzironis",
    el: "Ο έξυπνος επιχειρηματικός βοηθός σας για την Tzironis",
  },
  featureWebsiteKnowledge: {
    en: "Website Knowledge",
    el: "Γνώση Ιστοσελίδας",
  },
  featureWebsiteDesc: {
    en: "Access comprehensive information about Tzironis products, services, and company details.",
    el: "Αποκτήστε πρόσβαση σε ολοκληρωμένες πληροφορίες σχετικά με τα προϊόντα, τις υπηρεσίες και τις λεπτομέρειες της εταιρείας Tzironis.",
  },
  featureInvoice: {
    en: "Invoice Automation",
    el: "Αυτοματισμός Τιμολογίων",
  },
  featureInvoiceDesc: {
    en: "Automate invoice creation on union.gr with simple natural language commands.",
    el: "Αυτοματοποιήστε τη δημιουργία τιμολογίων στο union.gr με απλές εντολές φυσικής γλώσσας.",
  },
  featureLeads: {
    en: "Lead Generation",
    el: "Δημιουργία Οδηγών",
  },
  featureLeadsDesc: {
    en: "Generate and manage business leads from various sources with intelligent filtering.",
    el: "Δημιουργήστε και διαχειριστείτε επιχειρηματικούς οδηγούς από διάφορες πηγές με έξυπνο φιλτράρισμα.",
  },
  
  // Footer
  footerRights: {
    en: "All rights reserved.",
    el: "Με επιφύλαξη παντός δικαιώματος.",
  },
  footerPrivacy: {
    en: "Privacy Policy",
    el: "Πολιτική Απορρήτου",
  },
  footerTerms: {
    en: "Terms of Service",
    el: "Όροι Χρήσης",
  },
  
  // Voice controls
  microphoneOn: {
    en: "Listening...",
    el: "Ακούω...",
  },
  microphoneOff: {
    en: "Click to speak",
    el: "Κάντε κλικ για να μιλήσετε",
  },
  playResponse: {
    en: "Listen",
    el: "Ακούστε",
  },
  stopPlayback: {
    en: "Stop",
    el: "Διακοπή",
  },
};

// Function to get translation
export const getTranslation = (key: string, locale: LocaleType): string => {
  if (!translations[key]) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  
  return translations[key][locale] || translations[key].en;
}; 