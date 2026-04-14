function fillForms(rules) {
  const currentUrl = window.location.href;
  
  rules.forEach(rule => {
    try {
      const regex = new RegExp(rule.urlPattern);
      if (regex.test(currentUrl)) {
        const elements = document.querySelectorAll(rule.selector);
        elements.forEach(el => {
          if (el.value !== undefined) {
            el.value = rule.value;
            // Dispatch events to trigger React/Vue/Angular bindings
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (el.type === 'checkbox' || el.type === 'radio') {
            // Handle checkboxes and radios
            if (rule.value.toLowerCase() === 'true' || rule.value === '1' || rule.value.toLowerCase() === 'checked') {
              el.checked = true;
            } else {
              el.checked = false;
            }
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    } catch (e) {
      console.error("Autofill rule error:", e);
    }
  });
}

// Load rules and apply
chrome.storage.local.get(['autofill_rules'], (result) => {
  const rules = result.autofill_rules || [];
  if (rules.length > 0) {
    // Small delay to ensure dynamic forms are rendered
    setTimeout(() => fillForms(rules), 500);
    setTimeout(() => fillForms(rules), 2000);
  }
});

// Listen for messages from popup to apply immediately or generate rules
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "apply_rules") {
    chrome.storage.local.get(['autofill_rules'], (result) => {
      const rules = result.autofill_rules || [];
      fillForms(rules);
      sendResponse({success: true});
    });
    return true;
  } else if (request.action === "generate_rules") {
    const rules = [];
    // Select all inputs, textareas, and selects, excluding hidden, submit, and button types
    const elements = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    
    // Create a safe regex pattern for the current URL (ignoring query parameters for broader matching)
    const baseUrl = window.location.href.split('?')[0];
    const urlPattern = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*';

    elements.forEach(el => {
      let selector = '';
      if (el.id) {
        selector = `#${el.id}`;
      } else if (el.name) {
        selector = `${el.tagName.toLowerCase()}[name='${el.name}']`;
      } else {
        return; // Skip elements without id or name as they are hard to target reliably
      }

      let value = el.value;
      if (el.type === 'checkbox' || el.type === 'radio') {
        value = el.checked ? 'true' : 'false';
        if (value === 'false') return; // Only save checked state to avoid cluttering rules
      }

      // Only generate rules for fields that actually have a value filled in
      if (value !== undefined && value !== '') {
        rules.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: `Auto: ${el.name || el.id}`,
          urlPattern: urlPattern,
          selector: selector,
          value: value
        });
      }
    });
    
    sendResponse({rules: rules});
    return true;
  }
});
