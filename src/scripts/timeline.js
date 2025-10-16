// Timeline animation script
document.addEventListener('DOMContentLoaded', function() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  const fadeElements = document.querySelectorAll('.fade-in-element');

  // Intersection Observer for timeline items
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
  };

  // Observer for fade-in elements
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target); // Stop observing after animation
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
  });

  // Observer for timeline items
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        timelineItems.forEach(item => item.classList.remove('active'));
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  // Start observing
  timelineItems.forEach(item => {
    // Set first item as active by default
    if (item.dataset.step === "1") {
      item.classList.add('active');
    }
    timelineObserver.observe(item);
  });

  fadeElements.forEach(el => {
    fadeObserver.observe(el);
  });
});

