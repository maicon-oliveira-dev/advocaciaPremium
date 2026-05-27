gsap.registerPlugin(ScrollTrigger);

const header = document.querySelector(".header");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lenis = null;

const updateHeaderState = (scrollValue = window.scrollY) => {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", scrollValue > 40);
};

if (!prefersReducedMotion && typeof Lenis !== "undefined") {
  lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true
  });

  lenis.on("scroll", ({ scroll }) => {
    updateHeaderState(scroll);
    ScrollTrigger.update();
  });

  ScrollTrigger.addEventListener("refresh", () => {
    lenis.resize();
  });

  const onAnimationFrame = (time) => {
    lenis.raf(time);
    requestAnimationFrame(onAnimationFrame);
  };

  requestAnimationFrame(onAnimationFrame);
} else {
  window.addEventListener("scroll", () => {
    updateHeaderState(window.scrollY);
  }, { passive: true });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    if (!lenis) {
      return;
    }

    const targetId = anchor.getAttribute("href");

    if (!targetId || targetId === "#") {
      return;
    }

    const targetElement = document.querySelector(targetId);

    if (!targetElement) {
      return;
    }

    event.preventDefault();

    lenis.scrollTo(targetElement, {
      duration: 1.1
    });
  });
});

updateHeaderState();

/*
  Estado inicial dos elementos
*/

gsap.set(".justice-statue", {
  scale: 1.05,
  y: 0,
  opacity: 1,
  transformOrigin: "center center"
});

gsap.set(".hero-bg", {
  scale: 1,
  opacity: 1
});

gsap.set(".hero-content-1", {
  opacity: 1,
  y: 0
});

gsap.set(".hero-content-2", {
  opacity: 0,
  y: 80
});

gsap.set(".hero-lines span", {
  scaleY: 0,
  transformOrigin: "top center"
});

gsap.set(".scroll-hint", {
  opacity: 0,
  y: 20
});

gsap.set(".text-atmosphere", {
  opacity: 0,
  scale: 0.92
});

gsap.set(".hero-transition-panel", {
  yPercent: 100
});

/*
  Timeline principal controlada pelo scroll
*/

const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero-cinematic",
    start: "top top",
    end: "+=3600",
    scrub: 1.2,
    pin: true
  }
});

/*
  Cena 1 - Entrada cinematografica
*/

timeline.from(".header", {
  y: -40,
  opacity: 0,
  duration: 0.6
});

timeline.from(".hero-content-1 .eyebrow", {
  y: 40,
  opacity: 0,
  duration: 0.6
}, "-=0.2");

timeline.from(".hero-content-1 h1", {
  y: 90,
  opacity: 0,
  duration: 0.9
}, "-=0.25");

timeline.from(".hero-content-1 p", {
  y: 50,
  opacity: 0,
  duration: 0.7
}, "-=0.25");

timeline.to(".hero-content-1 .text-atmosphere", {
  opacity: 0.82,
  scale: 1,
  duration: 0.9
}, "-=0.8");

timeline.to(".hero-lines span", {
  scaleY: 1,
  duration: 0.9,
  stagger: 0.12
}, "-=0.4");

timeline.to(".scroll-hint", {
  opacity: 1,
  y: 0,
  duration: 0.6
}, "-=0.5");

/*
  Cena 2 - Camera aproxima a imagem
*/

timeline.to(".justice-statue", {
  scale: 1.14,
  y: -30,
  filter: "brightness(1.06) contrast(1.04)",
  duration: 1.4
});

timeline.to(".hero-bg", {
  scale: 1.06,
  opacity: 0.75,
  duration: 1.2
}, "<");

timeline.to(".hero-content-1", {
  y: -90,
  opacity: 0,
  duration: 0.9
}, "<");

timeline.to(".hero-content-1 .text-atmosphere", {
  opacity: 0,
  scale: 1.08,
  duration: 0.8
}, "<");

timeline.to(".scroll-hint", {
  opacity: 0,
  y: 20,
  duration: 0.5
}, "<");

/*
  Cena 3 - Segunda frase entra
*/

timeline.to(".hero-content-2", {
  opacity: 1,
  y: 0,
  duration: 0.9
});

timeline.to(".hero-content-2 .text-atmosphere", {
  opacity: 0.72,
  scale: 1,
  duration: 0.9
}, "<");

timeline.to(".justice-statue", {
  scale: 1.22,
  y: -65,
  duration: 1.3
}, "<");

/*
  Cena 4 - Saida premium para proxima secao
*/

timeline.to(".hero-content-2", {
  y: -80,
  opacity: 0,
  duration: 0.8
});

timeline.to(".hero-content-2 .text-atmosphere", {
  opacity: 0,
  scale: 1.08,
  duration: 0.8
}, "<");

timeline.to(".hero-transition-panel", {
  yPercent: 0,
  duration: 1.15,
  ease: "power2.out"
}, "<");

timeline.to(".justice-statue", {
  scale: 1.34,
  y: -110,
  opacity: 0.65,
  duration: 1
}, "<");

timeline.to(".hero-bg", {
  opacity: 0.25,
  duration: 1
}, "<");

/*
  Reveals sutis das secoes seguintes
*/

const createSectionReveal = (triggerSelector, targetSelector) => {
  if (prefersReducedMotion || !document.querySelector(targetSelector)) {
    return;
  }

  gsap.from(targetSelector, {
    opacity: 0,
    y: 60,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: {
      trigger: triggerSelector,
      start: "top 78%",
      once: true
    }
  });
};

createSectionReveal(".about-section", ".about-section .section-shell");
createSectionReveal(".practice-section", ".practice-section .section-heading");
createSectionReveal(".statement-section", ".statement-section .statement-shell");
createSectionReveal(".blog-preview-section", ".blog-preview-header");
createSectionReveal(".contact-section", ".contact-section .contact-shell");

if (!prefersReducedMotion && document.querySelector(".practice-grid")) {
  gsap.from(".practice-card", {
    opacity: 0,
    y: 70,
    duration: 0.9,
    stagger: 0.14,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".practice-section",
      start: "top 70%",
      once: true
    }
  });
}

if (!prefersReducedMotion && document.querySelector(".blog-grid")) {
  gsap.from(".blog-card", {
    opacity: 0,
    y: 70,
    duration: 0.9,
    stagger: 0.14,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".blog-preview-section",
      start: "top 60%",
      once: true
    }
  });
}

window.addEventListener("load", () => {
  if (lenis) {
    lenis.resize();
  }

  ScrollTrigger.refresh();
  updateHeaderState(lenis ? lenis.scroll : window.scrollY);
});
