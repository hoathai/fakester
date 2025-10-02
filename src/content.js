let detectedFields = {
  name: [],
  email: [],
  phone: [],
  address: []
};

function isVisible(element) {
  return element.offsetWidth > 0 && element.offsetHeight > 0 &&
         window.getComputedStyle(element).visibility !== 'hidden' &&
         window.getComputedStyle(element).display !== 'none';
}

function detectInputType(input) {
  const id = (input.id || '').toLowerCase();
  const name = (input.name || '').toLowerCase();
  const placeholder = (input.placeholder || '').toLowerCase();
  const label = getFieldLabel(input);
  const type = (input.type || '').toLowerCase();
  const combinedText = `${id} ${name} ${placeholder} ${label}`.toLowerCase();

  if (type === 'email' || combinedText.includes('email') || combinedText.includes('e-mail')) {
    return 'email';
  }

  if (type === 'tel' || combinedText.includes('phone') || combinedText.includes('mobile') ||
      combinedText.includes('telephone') || combinedText.includes('cel')) {
    return 'phone';
  }

  if (combinedText.includes('address') || combinedText.includes('street') ||
      combinedText.includes('city') || combinedText.includes('zip') ||
      combinedText.includes('postal')) {
    return 'address';
  }

  if (combinedText.includes('name') && !combinedText.includes('user') &&
      !combinedText.includes('login')) {
    return 'name';
  }

  return null;
}

function getFieldLabel(input) {
  if (input.labels && input.labels.length > 0) {
    return input.labels[0].textContent;
  }

  const parent = input.parentElement;
  if (parent) {
    const label = parent.querySelector('label');
    if (label) {
      return label.textContent;
    }
  }

  const previousSibling = input.previousElementSibling;
  if (previousSibling && previousSibling.tagName === 'LABEL') {
    return previousSibling.textContent;
  }

  return '';
}

function detectFormFields() {
  detectedFields = {
    name: [],
    email: [],
    phone: [],
    address: []
  };

  const inputs = document.querySelectorAll('input, textarea');

  inputs.forEach(input => {
    if (!isVisible(input) || input.disabled || input.readOnly) {
      return;
    }

    const fieldType = detectInputType(input);
    if (fieldType && detectedFields[fieldType]) {
      detectedFields[fieldType].push(input);
    }
  });

  console.log('Detected fields:', {
    name: detectedFields.name.length,
    email: detectedFields.email.length,
    phone: detectedFields.phone.length,
    address: detectedFields.address.length
  });
}

function fillField(input, value) {
  if (!input || !value) return;

  input.value = value;

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  nativeInputValueSetter.call(input, value);

  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function autofillForm(user) {
  detectFormFields();

  if (detectedFields.name.length > 0) {
    fillField(detectedFields.name[0], user.name);
  }

  if (detectedFields.email.length > 0) {
    fillField(detectedFields.email[0], user.email);
  }

  if (detectedFields.phone.length > 0 && user.phone) {
    fillField(detectedFields.phone[0], user.phone);
  }

  if (detectedFields.address.length > 0 && user.address) {
    fillField(detectedFields.address[0], user.address);
  }

  showNotification('Form filled successfully!');
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 3000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill') {
    autofillForm(request.user);
    sendResponse({ success: true });
  }
  return true;
});

detectFormFields();

const observer = new MutationObserver((mutations) => {
  let shouldRedetect = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldRedetect = true;
      break;
    }
  }
  if (shouldRedetect) {
    detectFormFields();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
