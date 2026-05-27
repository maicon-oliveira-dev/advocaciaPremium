gsap.registerPlugin(ScrollTrigger);

const header = document.querySelector(".header");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileMenuBreakpoint = window.matchMedia("(max-width: 768px)");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileMenuPanel = document.querySelector(".mobile-menu-panel");
const mobileMenuInner = document.querySelector(".mobile-menu-inner");
const mobileMenuBackdrop = document.querySelector(".mobile-menu-backdrop");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileMenuClose = document.querySelector(".mobile-menu-close");
const mobileMenuHeading = document.querySelector(".mobile-menu-heading");
const mobileMenuFooter = document.querySelector(".mobile-menu-footer");
const mobileMenuLinks = mobileMenu ? Array.from(mobileMenu.querySelectorAll(".mobile-menu-link")) : [];
const mobileMenuAnchors = mobileMenu ? Array.from(mobileMenu.querySelectorAll('a[href^="#"]')) : [];
const mobileMenuRevealTargets = [
  mobileMenuHeading,
  mobileMenuClose,
  ...mobileMenuLinks,
  mobileMenuFooter
].filter(Boolean);
let lenis = null;
let mobileMenuAnimation = null;
let isMobileMenuOpen = false;
let mobileMenuTouchStartY = null;
let mobileMenuTouchDeltaY = 0;

const updateHeaderState = (scrollValue = window.scrollY) => {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", scrollValue > 40);
};

const killMobileMenuAnimation = () => {
  if (!mobileMenuAnimation) {
    return;
  }

  mobileMenuAnimation.kill();
  mobileMenuAnimation = null;
};

const setMobileMenuState = (isOpen) => {
  isMobileMenuOpen = isOpen;

  if (mobileMenuToggle) {
    mobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  if (mobileMenu) {
    mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  document.body.classList.toggle("mobile-menu-open", isOpen);

  if (lenis) {
    if (isOpen) {
      lenis.stop();
    } else {
      lenis.start();
      ScrollTrigger.update();
    }
  }
};

const clearMobileMenuTransforms = () => {
  if (!mobileMenuPanel || !mobileMenuBackdrop || !mobileMenuInner) {
    return;
  }

  gsap.set(
    [mobileMenuBackdrop, mobileMenuPanel, mobileMenuInner, ...mobileMenuRevealTargets],
    { clearProps: "opacity,transform" }
  );
};

const resetMobileMenuDrag = (animate = true) => {
  if (
    prefersReducedMotion ||
    !mobileMenuPanel ||
    !mobileMenuBackdrop ||
    !mobileMenuInner
  ) {
    mobileMenuTouchDeltaY = 0;
    return;
  }

  const duration = animate ? 0.34 : 0;

  gsap.to(mobileMenuPanel, {
    y: 0,
    duration,
    ease: "power3.out",
    overwrite: true
  });

  gsap.to(mobileMenuInner, {
    y: 0,
    duration,
    ease: "power3.out",
    overwrite: true
  });

  gsap.to(mobileMenuBackdrop, {
    opacity: 1,
    duration: animate ? 0.22 : 0,
    ease: "power2.out",
    overwrite: true
  });

  mobileMenuTouchDeltaY = 0;
};

const openMobileMenu = () => {
  if (!mobileMenu || !mobileMenuPanel || isMobileMenuOpen) {
    return;
  }

  killMobileMenuAnimation();
  mobileMenu.hidden = false;
  setMobileMenuState(true);

  if (prefersReducedMotion) {
    clearMobileMenuTransforms();
    mobileMenuClose?.focus();
    return;
  }

  gsap.set(mobileMenuBackdrop, { opacity: 0 });
  gsap.set(mobileMenuPanel, {
    opacity: 1,
    y: 72,
    scale: 0.985
  });
  gsap.set(mobileMenuInner, { y: 0 });
  gsap.set(mobileMenuRevealTargets, {
    opacity: 0,
    y: 28
  });

  mobileMenuAnimation = gsap.timeline({
    defaults: {
      ease: "power3.out"
    },
    onComplete: () => {
      mobileMenuAnimation = null;
      mobileMenuClose?.focus();
    }
  });

  mobileMenuAnimation.to(mobileMenuBackdrop, {
    opacity: 1,
    duration: 0.28
  }, 0);

  mobileMenuAnimation.to(mobileMenuPanel, {
    y: 0,
    scale: 1,
    duration: 0.54
  }, 0);

  mobileMenuAnimation.to(mobileMenuRevealTargets, {
    opacity: 1,
    y: 0,
    duration: 0.46,
    stagger: 0.06
  }, 0.14);
};

const closeMobileMenu = ({ immediate = false, focusToggle = false } = {}) => {
  if (!mobileMenu || mobileMenu.hidden) {
    return;
  }

  killMobileMenuAnimation();

  const finalize = () => {
    mobileMenu.hidden = true;
    mobileMenuTouchStartY = null;
    setMobileMenuState(false);
    clearMobileMenuTransforms();

    if (focusToggle && mobileMenuToggle) {
      mobileMenuToggle.focus();
    }
  };

  if (immediate || prefersReducedMotion || !mobileMenuPanel || !mobileMenuBackdrop) {
    finalize();
    return;
  }

  mobileMenuAnimation = gsap.timeline({
    defaults: {
      ease: "power3.in"
    },
    onComplete: () => {
      mobileMenuAnimation = null;
      finalize();
    }
  });

  mobileMenuAnimation.to(mobileMenuRevealTargets.slice().reverse(), {
    opacity: 0,
    y: 18,
    duration: 0.18,
    stagger: 0.03
  }, 0);

  mobileMenuAnimation.to(mobileMenuPanel, {
    y: 86,
    opacity: 0,
    duration: 0.3
  }, 0.06);

  mobileMenuAnimation.to(mobileMenuBackdrop, {
    opacity: 0,
    duration: 0.22
  }, 0.12);
};

const updateMobileMenuDrag = (deltaY) => {
  if (
    prefersReducedMotion ||
    !mobileMenuPanel ||
    !mobileMenuBackdrop ||
    !mobileMenuInner
  ) {
    return;
  }

  const clampedDelta = Math.max(0, Math.min(deltaY, 240));

  gsap.set(mobileMenuPanel, { y: clampedDelta });
  gsap.set(mobileMenuInner, { y: clampedDelta * 0.14 });
  gsap.set(mobileMenuBackdrop, {
    opacity: Math.max(0.18, 1 - clampedDelta / 280)
  });
};

const handleMobileMenuTouchStart = (event) => {
  if (!isMobileMenuOpen || event.touches.length !== 1) {
    return;
  }

  mobileMenuTouchStartY = event.touches[0].clientY;
  mobileMenuTouchDeltaY = 0;
};

const handleMobileMenuTouchMove = (event) => {
  if (!isMobileMenuOpen || mobileMenuTouchStartY === null) {
    return;
  }

  mobileMenuTouchDeltaY = event.touches[0].clientY - mobileMenuTouchStartY;

  if (mobileMenuTouchDeltaY <= 0) {
    return;
  }

  event.preventDefault();
  updateMobileMenuDrag(mobileMenuTouchDeltaY);
};

const handleMobileMenuTouchEnd = () => {
  if (!isMobileMenuOpen || mobileMenuTouchStartY === null) {
    return;
  }

  const shouldCloseMenu = mobileMenuTouchDeltaY > 110;
  const shouldResetMenu = mobileMenuTouchDeltaY > 0;

  mobileMenuTouchStartY = null;

  if (shouldCloseMenu) {
    closeMobileMenu({ focusToggle: true });
    return;
  }

  if (shouldResetMenu) {
    resetMobileMenuDrag();
  }
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

document.querySelectorAll('.blog-link[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
  });
});

if (mobileMenuToggle && mobileMenu && mobileMenuPanel) {
  mobileMenuToggle.addEventListener("click", () => {
    openMobileMenu();
  });

  mobileMenuClose?.addEventListener("click", () => {
    closeMobileMenu({ focusToggle: true });
  });

  mobileMenuBackdrop?.addEventListener("click", () => {
    closeMobileMenu({ focusToggle: true });
  });

  mobileMenuAnchors.forEach((anchor) => {
    anchor.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMobileMenuOpen) {
      closeMobileMenu({ focusToggle: true });
    }
  });

  mobileMenuBreakpoint.addEventListener("change", (event) => {
    if (!event.matches) {
      closeMobileMenu({ immediate: true });
    }
  });

  mobileMenuPanel.addEventListener("touchstart", handleMobileMenuTouchStart, {
    passive: true
  });

  mobileMenuPanel.addEventListener("touchmove", handleMobileMenuTouchMove, {
    passive: false
  });

  mobileMenuPanel.addEventListener("touchend", handleMobileMenuTouchEnd);
  mobileMenuPanel.addEventListener("touchcancel", () => {
    mobileMenuTouchStartY = null;
    resetMobileMenuDrag();
  });
}

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

const createSectionTimeline = (triggerSelector, start = "top 72%") => {
  if (prefersReducedMotion || !document.querySelector(triggerSelector)) {
    return null;
  }

  return gsap.timeline({
    defaults: {
      ease: "power3.out"
    },
    scrollTrigger: {
      trigger: triggerSelector,
      start,
      once: true
    }
  });
};

const isCompactViewport = mobileMenuBreakpoint.matches;
const sectionMotion = {
  aboutColumnsY: isCompactViewport ? 34 : 42,
  cardY: isCompactViewport ? 56 : 70,
  quoteY: isCompactViewport ? 38 : 50,
  visualY: isCompactViewport ? 46 : 60,
  panelY: isCompactViewport ? 40 : 50,
  columnStagger: isCompactViewport ? 0.12 : 0.18,
  cardStagger: isCompactViewport ? 0.1 : 0.15,
  fieldStagger: isCompactViewport ? 0.04 : 0.06
};

const aboutTimeline = createSectionTimeline(".about-section", "top 72%");

if (aboutTimeline) {
  aboutTimeline.from(".about-section .section-label", {
    y: 24,
    opacity: 0,
    duration: 0.82
  });

  aboutTimeline.from(".about-section .section-title", {
    y: 60,
    opacity: 0,
    duration: 1.04
  }, "-=0.46");

  if (document.querySelector(".about-section .section-heading")) {
    aboutTimeline.fromTo(".about-section .section-heading", {
      "--section-rule-scale": 0
    }, {
      "--section-rule-scale": 1,
      duration: 0.78
    }, "-=0.72");
  }

  aboutTimeline.from(".about-section .about-column", {
    y: sectionMotion.aboutColumnsY,
    opacity: 0,
    duration: 0.94,
    stagger: sectionMotion.columnStagger
  }, "-=0.34");
}

const practiceTimeline = createSectionTimeline(".practice-section", "top 72%");

if (practiceTimeline) {
  practiceTimeline.from(".practice-section .section-label", {
    y: 24,
    opacity: 0,
    duration: 0.82
  });

  practiceTimeline.from(".practice-section .section-title", {
    y: 56,
    opacity: 0,
    duration: 0.98
  }, "-=0.46");

  if (document.querySelector(".practice-section .section-heading")) {
    practiceTimeline.fromTo(".practice-section .section-heading", {
      "--section-rule-scale": 0
    }, {
      "--section-rule-scale": 1,
      duration: 0.72
    }, "-=0.68");
  }

  practiceTimeline.from(".practice-card", {
    y: sectionMotion.cardY,
    opacity: 0,
    duration: 0.96,
    stagger: sectionMotion.cardStagger
  }, "-=0.28");
}

const statementTimeline = createSectionTimeline(".statement-section", "top 74%");

if (statementTimeline) {
  statementTimeline.fromTo(".statement-section", {
    "--statement-mark-opacity": 0,
    "--statement-mark-scale": 0.88
  }, {
    "--statement-mark-opacity": 1,
    "--statement-mark-scale": 1,
    duration: 0.96
  });

  statementTimeline.from(".statement-quote", {
    y: sectionMotion.quoteY,
    opacity: 0,
    duration: 1.02
  }, "-=0.56");

  statementTimeline.from(".statement-signature", {
    y: 18,
    opacity: 0,
    duration: 0.78
  }, "-=0.42");
}

const blogTimeline = createSectionTimeline(".blog-preview-section", "top 72%");

if (blogTimeline) {
  blogTimeline.from(".blog-preview-section .section-label", {
    y: 22,
    opacity: 0,
    duration: 0.8
  });

  blogTimeline.from(".blog-preview-header h2", {
    y: 56,
    opacity: 0,
    duration: 1
  }, "-=0.44");

  blogTimeline.from(".blog-preview-header p", {
    y: 28,
    opacity: 0,
    duration: 0.84
  }, "-=0.48");

  blogTimeline.from(".blog-card", {
    y: sectionMotion.cardY,
    opacity: 0,
    duration: 0.94,
    stagger: sectionMotion.cardStagger
  }, "-=0.24");
}

const contactTimeline = createSectionTimeline(".contact-section", "top 72%");

if (contactTimeline) {
  contactTimeline.from(".contact-visual-frame", {
    y: sectionMotion.visualY,
    opacity: 0,
    duration: 0.96
  });

  contactTimeline.from(".contact-visual-main", {
    y: 24,
    scale: 0.94,
    opacity: 0,
    duration: 1
  }, "-=0.72");

  contactTimeline.from(".contact-panel", {
    y: sectionMotion.panelY,
    opacity: 0,
    duration: 0.92
  }, "-=0.68");

  contactTimeline.from(".contact-panel .field-group, .contact-panel .contact-button", {
    y: 18,
    opacity: 0,
    duration: 0.56,
    stagger: sectionMotion.fieldStagger
  }, "-=0.42");
}

const footerTimeline = createSectionTimeline(".site-footer", "top 88%");

if (footerTimeline) {
  footerTimeline.from(".site-footer .footer-top", {
    y: 40,
    opacity: 0,
    duration: 0.86
  });

  footerTimeline.from(".site-footer .footer-bottom", {
    y: 24,
    opacity: 0,
    duration: 0.68
  }, "-=0.4");
}

window.addEventListener("load", () => {
  if (lenis) {
    lenis.resize();
  }

  ScrollTrigger.refresh();
  updateHeaderState(lenis ? lenis.scroll : window.scrollY);
});
