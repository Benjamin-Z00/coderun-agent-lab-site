const cards = document.querySelectorAll(".project-card, .price-card, .timeline-item");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.16 }
);

cards.forEach((card) => observer.observe(card));
