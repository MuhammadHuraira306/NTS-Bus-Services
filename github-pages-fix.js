// GitHub Pages compatibility helper: keeps portal links functional even if the optional
// landing-page controller is delayed. The real authentication controller handles the demo session.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a.btn-quick-login').forEach(link => {
    link.setAttribute('role', 'button');
    link.style.cursor = 'pointer';
  });
});
