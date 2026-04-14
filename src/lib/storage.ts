export interface Rule {
  id: string;
  urlPattern: string;
  selector: string;
  value: string;
  name: string;
}

export const getRules = async (): Promise<Rule[]> => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['autofill_rules'], (result) => {
        resolve(result.autofill_rules || []);
      });
    });
  } else {
    const rules = localStorage.getItem('autofill_rules');
    return rules ? JSON.parse(rules) : [];
  }
};

export const saveRules = async (rules: Rule[]): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ autofill_rules: rules }, () => {
        resolve();
      });
    });
  } else {
    localStorage.setItem('autofill_rules', JSON.stringify(rules));
  }
};
