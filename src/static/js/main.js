const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

if (localStorage.getItem('privacy') === 'true') {
  document.documentElement.classList.add('privacy-mode');
}

(function () {
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
   * Sidebar toggle
   */
  if (select('.toggle-sidebar-btn')) {
    on('click', '.toggle-sidebar-btn', function (e) {
      select('body').classList.toggle('toggle-sidebar')
    })
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

    on('click', '#theme-toggle', function (e) {
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

    on('click', '#privacy-toggle', function (e) {
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