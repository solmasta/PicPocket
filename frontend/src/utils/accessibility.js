// Accessibility utilities for PicPocket

// ARIA label generators
export const generatePhotoAriaLabel = (photo) => {
  const parts = [];
  
  parts.push('Photo');
  
  if (photo.name) {
    parts.push(photo.name);
  }
  
  if (photo.caption) {
    parts.push(photo.caption);
  }
  
  if (photo.takenAt) {
    const date = new Date(photo.takenAt).toLocaleDateString();
    parts.push(`Taken on ${date}`);
  }
  
  if (photo.location?.name) {
    parts.push(`Location: ${photo.location.name}`);
  }
  
  if (photo.tags && photo.tags.length > 0) {
    parts.push(`Tags: ${photo.tags.join(', ')}`);
  }
  
  if (photo.isFavorite) {
    parts.push('Favorite');
  }
  
  return parts.join('. ');
};

// Keyboard navigation utilities
export const createKeyboardHandlers = (handlers = {}) => {
  const defaultHandlers = {
    onKeyDown: (event) => {
      const { key, target } = event;
      
      // Handle escape key
      if (key === 'Escape') {
        if (handlers.onEscape) {
          handlers.onEscape(event);
        }
      }
      
      // Handle enter key
      if (key === 'Enter') {
        if (handlers.onEnter) {
          handlers.onEnter(event);
        }
      }
      
      // Handle space key (but not on inputs)
      if (key === ' ' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        if (handlers.onSpace) {
          handlers.onSpace(event);
        }
      }
      
      // Handle arrow keys
      if (key.startsWith('Arrow')) {
        if (handlers.onArrow) {
          handlers.onArrow(event);
        }
      }
      
      // Handle tab navigation hints
      if (key === 'Tab') {
        if (handlers.onTab) {
          handlers.onTab(event);
        }
      }
    },
  };
  
  return { ...defaultHandlers, ...handlers };
};

// Focus management utilities
export class FocusManager {
  constructor(container) {
    this.container = container;
    this.previousFocus = null;
    this.focusableElements = [];
    this.firstFocusable = null;
    this.lastFocusable = null;
  }
  
  // Get all focusable elements within container
  getFocusableElements() {
    const selector = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ).filter(el => {
      // Filter out disabled or hidden elements
      return !el.disabled && 
             !el.getAttribute('aria-hidden') &&
             getComputedStyle(el).display !== 'none' &&
             getComputedStyle(el).visibility !== 'hidden';
    });
    
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    
    return this.focusableElements;
  }
  
  // Trap focus within container
  trapFocus() {
    this.getFocusableElements();
    this.previousFocus = document.activeElement;
    
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (this.focusableElements.length === 0) {
          event.preventDefault();
          return;
        }
        
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === this.firstFocusable) {
            event.preventDefault();
            this.lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === this.lastFocusable) {
            event.preventDefault();
            this.firstFocusable?.focus();
          }
        }
      }
    };
    
    this.container.addEventListener('keydown', handleKeyDown);
    this.keydownHandler = handleKeyDown;
    
    // Focus first element
    this.firstFocusable?.focus();
  }
  
  // Release focus trap
  releaseFocus() {
    if (this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    
    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus();
    }
  }
  
  // Focus specific element
  focusElement(indexOrElement) {
    this.getFocusableElements();
    
    let element;
    if (typeof indexOrElement === 'number') {
      element = this.focusableElements[indexOrElement];
    } else {
      element = indexOrElement;
    }
    
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }
  
  // Focus next element
  focusNext() {
    this.getFocusableElements();
    const currentIndex = this.focusableElements.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % this.focusableElements.length;
    this.focusElement(nextIndex);
  }
  
  // Focus previous element
  focusPrevious() {
    this.getFocusableElements();
    const currentIndex = this.focusableElements.indexOf(document.activeElement);
    const prevIndex = currentIndex === 0 ? this.focusableElements.length - 1 : currentIndex - 1;
    this.focusElement(prevIndex);
  }
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
  constructor() {
    this.announcer = this.createAnnouncer();
  }
  
  createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    return announcer;
  }
  
  announce(message, priority = 'polite') {
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = '';
    
    // Use setTimeout to ensure screen readers pick up the change
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 100);
  }
  
  announcePhotoAction(action, photoName) {
    const messages = {
      favorite: `${photoName} added to favorites`,
      unfavorite: `${photoName} removed from favorites`,
      delete: `${photoName} deleted`,
      archive: `${photoName} archived`,
      unarchive: `${photoName} unarchived`,
      share: `${photoName} sharing options opened`,
      edit: `${photoName} editing options opened`
    };
    
    this.announce(messages[action] || `${action} action performed on ${photoName}`);
  }
  
  announceUpload(count, success = true) {
    const message = success 
      ? `Successfully uploaded ${count} photo${count !== 1 ? 's' : ''}`
      : `Failed to upload photos`;
    this.announce(message);
  }
  
  announceSearch(results, query) {
    const message = `Found ${results} photo${results !== 1 ? 's' : ''} for ${query}`;
    this.announce(message);
  }
  
  destroy() {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
  }
}

// High contrast mode detection
export const detectHighContrastMode = () => {
  // Check for forced colors mode
  if (window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }
  
  // Check for high contrast preference
  if (window.matchMedia('(prefers-contrast: high)').matches) {
    return true;
  }
  
  // Check for Windows high contrast mode
  const testElement = document.createElement('div');
  testElement.style.color = 'window';
  testElement.style.position = 'absolute';
  testElement.style.left = '-9999px';
  document.body.appendChild(testElement);
  
  const isHighContrast = getComputedStyle(testElement).color === 'window';
  document.body.removeChild(testElement);
  
  return isHighContrast;
};

// Reduced motion detection
export const detectReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Color contrast utilities
export const getContrastRatio = (color1, color2) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate relative luminance
  const getLuminance = (color) => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// Check if color combination meets WCAG standards
export const meetsWCAGStandards = (foregroundColor, backgroundColor, level = 'AA') => {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  
  switch (level) {
    case 'AA':
      return ratio >= 4.5;
    case 'AA-large':
      return ratio >= 3.0;
    case 'AAA':
      return ratio >= 7.0;
    case 'AAA-large':
      return ratio >= 4.5;
    default:
      return ratio >= 4.5;
  }
};

// Skip link utilities
export const createSkipLinks = () => {
  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#search', text: 'Skip to search' }
  ];
  
  const container = document.createElement('div');
  container.className = 'skip-links';
  
  skipLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.className = 'skip-link';
    container.appendChild(a);
  });
  
  document.body.insertBefore(container, document.body.firstChild);
};

// Image alt text utilities
export const generateAltText = (photo, fallback = 'Photo') => {
  if (photo.caption) {
    return photo.caption;
  }
  
  if (photo.name && photo.name !== 'Untitled') {
    return photo.name;
  }
  
  if (photo.tags && photo.tags.length > 0) {
    return `Photo with tags: ${photo.tags.join(', ')}`;
  }
  
  if (photo.location?.name) {
    return `Photo taken at ${photo.location.name}`;
  }
  
  if (photo.takenAt) {
    const date = new Date(photo.takenAt).toLocaleDateString();
    return `Photo taken on ${date}`;
  }
  
  return fallback;
};

// Accessibility testing utilities
export const runAccessibilityAudit = () => {
  const issues = [];
  
  // Check for missing alt text
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      type: 'missing-alt',
      count: imagesWithoutAlt.length,
      message: `${imagesWithoutAlt.length} images missing alt text`
    });
  }
  
  // Check for missing labels
  const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
  const inputsWithoutLabelElement = Array.from(inputsWithoutLabel).filter(input => {
    return !input.closest('label') && !document.querySelector(`label[for="${input.id}"]`);
  });
  
  if (inputsWithoutLabelElement.length > 0) {
    issues.push({
      type: 'missing-label',
      count: inputsWithoutLabelElement.length,
      message: `${inputsWithoutLabelElement.length} inputs missing labels`
    });
  }
  
  // Check for improper heading structure
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const headingLevels = headings.map(h => parseInt(h.tagName.substring(1)));
  const hasImproperStructure = headingLevels.some((level, index) => {
    return index > 0 && level > headingLevels[index - 1] + 1;
  });
  
  if (hasImproperStructure) {
    issues.push({
      type: 'improper-headings',
      message: 'Heading levels skip numbers (e.g., H1 to H3)'
    });
  }
  
  // Check for focus management
  const modalElements = document.querySelectorAll('[role="dialog"], .modal');
  modalElements.forEach(modal => {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0 && modal.style.display !== 'none') {
      issues.push({
        type: 'no-focusable-elements',
        element: modal,
        message: 'Modal has no focusable elements'
      });
    }
  });
  
  return issues;
};

// Create singleton announcer
export const announcer = new ScreenReaderAnnouncer();

// Export focus manager as default
export default FocusManager;