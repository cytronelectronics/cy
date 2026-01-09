/**
 * Premium Navigation Bar JavaScript
 * 
 * Features:
 * - Mobile menu toggle with smooth animations
 * - Dropdown menu management with keyboard navigation
 * - Scroll behavior for sticky navigation
 * - Accessibility support (ARIA, keyboard navigation)
 * - Progressive enhancement (works without JS)
 * - Performance optimized with requestAnimationFrame
 */

class PremiumNavigation {
  constructor() {
    // DOM elements
    this.navbar = document.querySelector('.navbar');
    this.navToggle = document.querySelector('.nav-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.navOverlay = document.querySelector('.nav-overlay');
    this.navLinks = document.querySelectorAll('.nav-link:not(.nav-dropdown-toggle)');
    this.dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    this.dropdownItems = document.querySelectorAll('.nav-item--dropdown');
    
    // State management
    this.isMenuOpen = false;
    this.activeDropdown = null;
    this.lastScrollY = window.scrollY;
    this.ticking = false;
    this.sections = [];
    this.currentActiveSection = '';
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the navigation component
   */
  init() {
    this.bindEvents();
    this.setupKeyboardNavigation();
    this.setupScrollSpy();
    this.handleInitialScroll();
    
    // Mark as enhanced for CSS
    document.documentElement.classList.add('js-enabled');
    
    console.log('Premium Navigation initialized');
  }
  
  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Mobile menu toggle
    this.navToggle?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });
    
    // Overlay click to close menu
    this.navOverlay?.addEventListener('click', () => {
      this.closeMobileMenu();
    });
    
    // Dropdown toggles
    this.dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleDropdown(toggle);
      });
      
      // Handle mouse enter/leave for desktop
      const dropdownItem = toggle.closest('.nav-item--dropdown');
      if (dropdownItem) {
        dropdownItem.addEventListener('mouseenter', () => {
          if (window.innerWidth > 640) {
            this.openDropdown(toggle);
          }
        });
        
        dropdownItem.addEventListener('mouseleave', () => {
          if (window.innerWidth > 640) {
            this.closeDropdown(toggle);
          }
        });
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item--dropdown')) {
        this.closeAllDropdowns();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // Handle scroll for sticky behavior
    window.addEventListener('scroll', () => {
      this.handleScroll();
    }, { passive: true });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
    
    // Prevent scroll when mobile menu is open
    this.preventBodyScroll();
  }
    /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Focus management for nav links
    this.navLinks.forEach((link, index) => {
      link.addEventListener('keydown', (e) => {
        this.handleNavKeydown(e, index);
      });
    });
    
    // Tab trap for mobile menu
    this.navMenu?.addEventListener('keydown', (e) => {
      if (this.isMenuOpen && e.key === 'Tab') {
        this.handleTabTrap(e);
      }
    });
  }
  
  /**
   * Setup scroll spy for active navigation highlighting
   */
  setupScrollSpy() {
    // Get all sections that have corresponding nav links
    this.sections = Array.from(this.navLinks).map(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const section = document.querySelector(href);
        return {
          id: href.substring(1),
          element: section,
          link: link
        };
      }
      return null;
    }).filter(Boolean);

    // Add click event listeners to nav links for smooth scrolling
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          this.scrollToSection(href.substring(1));
          
          // Close mobile menu if open
          if (this.isMenuOpen) {
            this.closeMobileMenu();
          }
        }
      });
    });

    // Initial active state update
    this.updateActiveNavigation();
  }
  
  /**
   * Handle keyboard navigation in nav menu
   */
  handleNavKeydown(e, currentIndex) {
    const { key } = e;
    
    switch (key) {
      case 'ArrowRight':
      case 'ArrowLeft':
        e.preventDefault();
        this.focusNextNavItem(currentIndex, key === 'ArrowRight' ? 1 : -1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const dropdown = e.target.closest('.nav-item--dropdown');
        if (dropdown) {
          this.openDropdown(e.target);
          this.focusFirstSubmenuItem(dropdown);
        }
        break;
        
      case 'Enter':
      case ' ':
        if (e.target.classList.contains('nav-dropdown-toggle')) {
          e.preventDefault();
          this.toggleDropdown(e.target);
        }
        break;
    }
  }
  
  /**
   * Focus next/previous navigation item
   */
  focusNextNavItem(currentIndex, direction) {
    const focusableNavLinks = Array.from(this.navLinks).filter(link => 
      !link.closest('.nav-submenu')
    );
    
    const nextIndex = (currentIndex + direction + focusableNavLinks.length) % focusableNavLinks.length;
    focusableNavLinks[nextIndex]?.focus();
  }
  
  /**
   * Focus first item in submenu
   */
  focusFirstSubmenuItem(dropdown) {
    const firstSubmenuLink = dropdown.querySelector('.submenu-link');
    firstSubmenuLink?.focus();
  }
  
  /**
   * Handle tab trapping in mobile menu
   */
  handleTabTrap(e) {
    const focusableElements = this.navMenu.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }
  
  /**
   * Open mobile menu
   */
  openMobileMenu() {
    this.isMenuOpen = true;
    
    // Update ARIA attributes
    this.navToggle?.setAttribute('aria-expanded', 'true');
    this.navMenu?.setAttribute('aria-hidden', 'false');
    
    // Add active classes with slight delay for smooth animation
    requestAnimationFrame(() => {
      this.navMenu?.classList.add('active');
      this.navOverlay?.classList.add('active');
    });
    
    // Focus first nav link
    setTimeout(() => {
      const firstNavLink = this.navMenu?.querySelector('.nav-link');
      firstNavLink?.focus();
    }, 150);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('Mobile menu opened');
  }
  
  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.isMenuOpen = false;
    
    // Update ARIA attributes
    this.navToggle?.setAttribute('aria-expanded', 'false');
    this.navMenu?.setAttribute('aria-hidden', 'true');
    
    // Remove active classes
    this.navMenu?.classList.remove('active');
    this.navOverlay?.classList.remove('active');
    
    // Close any open dropdowns
    this.closeAllDropdowns();
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Return focus to toggle button
    this.navToggle?.focus();
    
    console.log('Mobile menu closed');
  }
  
  /**
   * Toggle dropdown menu
   */
  toggleDropdown(toggle) {
    const dropdownItem = toggle.closest('.nav-item--dropdown');
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      this.closeDropdown(toggle);
    } else {
      this.closeAllDropdowns();
      this.openDropdown(toggle);
    }
  }
  
  /**
   * Open dropdown menu
   */
  openDropdown(toggle) {
    const dropdownItem = toggle.closest('.nav-item--dropdown');
    
    if (dropdownItem) {
      toggle.setAttribute('aria-expanded', 'true');
      dropdownItem.setAttribute('aria-expanded', 'true');
      this.activeDropdown = dropdownItem;
      
      console.log('Dropdown opened');
    }
  }
  
  /**
   * Close dropdown menu
   */
  closeDropdown(toggle) {
    const dropdownItem = toggle.closest('.nav-item--dropdown');
    
    if (dropdownItem) {
      toggle.setAttribute('aria-expanded', 'false');
      dropdownItem.setAttribute('aria-expanded', 'false');
      
      if (this.activeDropdown === dropdownItem) {
        this.activeDropdown = null;
      }
      
      console.log('Dropdown closed');
    }
  }
  
  /**
   * Close all dropdown menus
   */
  closeAllDropdowns() {
    this.dropdownToggles.forEach(toggle => {
      this.closeDropdown(toggle);
    });
  }
  
  /**
   * Handle escape key press
   */
  handleEscape() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else if (this.activeDropdown) {
      this.closeAllDropdowns();
      // Return focus to the dropdown toggle
      const toggle = this.activeDropdown.querySelector('.nav-dropdown-toggle');
      toggle?.focus();
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Close mobile menu on resize to larger screen
    if (window.innerWidth > 640 && this.isMenuOpen) {
      this.closeMobileMenu();
    }
    
    // Close dropdowns on resize to smaller screen
    if (window.innerWidth <= 640) {
      this.closeAllDropdowns();
    }
  }
  
  /**
   * Handle scroll events with performance optimization
   */
  handleScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateScrollState();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
    /**
   * Update navigation state based on scroll position
   */
  updateScrollState() {
    const currentScrollY = window.scrollY;
    
    // Add scrolled class for styling
    if (currentScrollY > 10) {
      this.navbar?.classList.add('scrolled');
    } else {
      this.navbar?.classList.remove('scrolled');
    }
    
    // Close dropdowns on scroll (except mobile)
    if (window.innerWidth > 640 && Math.abs(currentScrollY - this.lastScrollY) > 5) {
      this.closeAllDropdowns();
    }
    
    // Update active navigation
    this.updateActiveNavigation();
    
    this.lastScrollY = currentScrollY;
  }
    /**
   * Handle initial scroll state
   */
  handleInitialScroll() {
    this.updateScrollState();
  }
  
  /**
   * Smooth scroll to section
   */
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const navbarHeight = this.navbar ? this.navbar.offsetHeight : 0;
      const targetPosition = section.offsetTop - navbarHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Update active navigation based on scroll position
   */
  updateActiveNavigation() {
    if (this.sections.length === 0) return;

    const scrollY = window.scrollY;
    const navbarHeight = this.navbar ? this.navbar.offsetHeight : 0;
    
    // Find the current section
    let currentSection = '';
    
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      if (section.element) {
        const sectionTop = section.element.offsetTop - navbarHeight - 100;
        if (scrollY >= sectionTop) {
          currentSection = section.id;
          break;
        }
      }
    }

    // If no section is found and we're near the top, default to first section
    if (!currentSection && scrollY < 200 && this.sections[0]) {
      currentSection = this.sections[0].id;
    }

    // Update active state if changed
    if (currentSection !== this.currentActiveSection) {
      this.setActiveNavItemById(currentSection);
      this.currentActiveSection = currentSection;
    }
  }

  /**
   * Set active navigation item by section ID
   */
  setActiveNavItemById(sectionId) {
    // Remove active class from all nav links
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });

    // Add active class to current section's nav link
    if (sectionId) {
      const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
      }
    }
  }
  
  /**
   * Prevent body scroll when mobile menu is open
   */
  preventBodyScroll() {
    // Store original body overflow for restoration
    this.originalBodyOverflow = document.body.style.overflow;
  }
  
  /**
   * Set active navigation item
   */
  setActiveNavItem(href) {
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      
      if (link.getAttribute('href') === href) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }
  
  /**
   * Destroy the navigation instance
   */
  destroy() {
    // Remove event listeners
    this.navToggle?.removeEventListener('click', this.toggleMobileMenu);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleEscape);
    
    // Restore body overflow
    document.body.style.overflow = this.originalBodyOverflow;
    
    // Remove enhanced class
    document.documentElement.classList.remove('js-enhanced');
    
    console.log('Premium Navigation destroyed');
  }
}

/**
 * Utility functions
 */
const NavigationUtils = {
  /**
   * Debounce function for performance optimization
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  /**
   * Get preferred motion setting
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

/**
 * Initialize navigation when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if navigation elements exist before initializing
  const navbarElement = document.querySelector('.navbar');
  
  if (navbarElement) {
    // Initialize navigation
    window.premiumNavigation = new PremiumNavigation();
    
    // Optional: Auto-highlight active page based on current URL
    const currentPath = window.location.pathname;
    const currentNavLink = document.querySelector(`.nav-link[href="${currentPath}"]`);
    
    if (currentNavLink && !currentNavLink.classList.contains('active')) {
      window.premiumNavigation.setActiveNavItem(currentPath);
    }
    
    console.log('Premium Navigation ready');
  } else {
    console.warn('Navigation elements not found');
  }
});

/**
 * Handle page visibility changes (performance optimization)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.premiumNavigation) {
    // Close menus when page becomes hidden
    if (window.premiumNavigation.isMenuOpen) {
      window.premiumNavigation.closeMobileMenu();
    }
    window.premiumNavigation.closeAllDropdowns();
  }
});

/**
 * Export for module systems (if needed)
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PremiumNavigation, NavigationUtils };
}

/**
 * Performance monitoring (development only)
 */
if (process?.env?.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    // Monitor navigation performance
    if (window.performance && window.performance.measure) {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0];
      console.log('Navigation Performance:', {
        domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
        loadComplete: navigationTiming.loadEventEnd - navigationTiming.loadEventStart
      });
    }
  });
}
// JavaScript Document