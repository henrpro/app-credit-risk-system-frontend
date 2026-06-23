
(function() {
    "use strict";
  
/**
 * Easy selector helper function
 */
const select = (el, all = false) => {
el = el.trim()
if (all) {
    return [...document.querySelectorAll(el)]
} else {
    return document.querySelector(el)
}
}

/**
 * Easy event listener function
 */
const on = (type, el, listener, all = false) => {
if (all) {
    select(el, all).forEach(e => e.addEventListener(type, listener))
} else {
    select(el, all).addEventListener(type, listener)
}
}

/**
 * Easy on scroll event listener 
 */
const onscroll = (el, listener) => {
el.addEventListener('scroll', listener)
}

/**
 * Sidebar toggle
 */
if (select('.toggle-sidebar-btn')) {
on('click', '.toggle-sidebar-btn', function(e) {
    select('body').classList.toggle('toggle-sidebar')
})
}


/**
 * Navbar links active state on scroll
 */
let navbarlinks = select('#navbar .scrollto', true)
const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
    if (!navbarlink.hash) return
    let section = select(navbarlink.hash)
    if (!section) return
    if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
    } else {
        navbarlink.classList.remove('active')
    }
    })
}
window.addEventListener('load', navbarlinksActive)
onscroll(document, navbarlinksActive)

/**
 * Toggle .header-scrolled class to #header when page is scrolled
 */
let selectHeader = select('#header')
if (selectHeader) {
const headerScrolled = () => {
    if (window.scrollY > 100) {
    selectHeader.classList.add('header-scrolled')
    } else {
    selectHeader.classList.remove('header-scrolled')
    }
}
window.addEventListener('load', headerScrolled)
onscroll(document, headerScrolled)
}

/**
 * Theme Toggle
 */
const themeToggleBtn = select('#theme-toggle');
const themeIcon = select('#theme-icon');

if (themeToggleBtn) {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  if (currentTheme === 'light') {
    themeIcon.classList.replace('bi-sun-fill', 'bi-moon-fill');
  } else {
    themeIcon.classList.replace('bi-moon-fill', 'bi-sun-fill');
  }

  on('click', '#theme-toggle', function(e) {
    e.preventDefault();
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'light') {
      themeIcon.classList.replace('bi-sun-fill', 'bi-moon-fill');
    } else {
      themeIcon.classList.replace('bi-moon-fill', 'bi-sun-fill');
    }
  });
}

/**
 * Privacy Toggle
 */
const privacyToggleBtn = select('#privacy-toggle');
const privacyIcon = select('#privacy-icon');

if (privacyToggleBtn) {
  const isPrivacy = document.documentElement.classList.contains('privacy-mode');
  if (isPrivacy) {
    privacyIcon.classList.replace('bi-eye-fill', 'bi-eye-slash-fill');
  }

  on('click', '#privacy-toggle', function(e) {
    e.preventDefault();
    let isCurrentlyPrivacy = document.documentElement.classList.contains('privacy-mode');
    
    if (isCurrentlyPrivacy) {
      document.documentElement.classList.remove('privacy-mode');
      localStorage.setItem('privacy', 'false');
      privacyIcon.classList.replace('bi-eye-slash-fill', 'bi-eye-fill');
    } else {
      document.documentElement.classList.add('privacy-mode');
      localStorage.setItem('privacy', 'true');
      privacyIcon.classList.replace('bi-eye-fill', 'bi-eye-slash-fill');
    }
  });
}

})();