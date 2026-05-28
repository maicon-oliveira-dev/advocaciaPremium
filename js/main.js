gsap.registerPlugin(ScrollTrigger);

const body = document.body;
const header = document.querySelector(".header");
const mainContent = document.querySelector("main");
const themeToggles = Array.from(document.querySelectorAll(".theme-toggle"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const headerMenuBreakpoint = window.matchMedia("(max-width: 960px)");
const compactViewportMedia = window.matchMedia("(max-width: 768px)");
const heroParallaxDesktopMedia = window.matchMedia("(min-width: 1025px)");
const finePointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
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
const heroDesktopLayerImages = Array.from(document.querySelectorAll(".hero-layer[data-desktop-src]"));
const heroMobileComposition = document.querySelector(".hero-mobile-composition");
const heroLayerImages = [...heroDesktopLayerImages, heroMobileComposition].filter(Boolean);
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
let mobileMenuTouchStartScrollTop = 0;
let mobileMenuIsDragging = false;
let mobileMenuReturnFocusTarget = null;
let lockedScrollY = 0;
let pushedMenuHistoryState = false;
let pendingMobileMenuCloseRequest = null;
let destroyHeroMouseParallax = null;
const isCompactViewport = compactViewportMedia.matches;
const desktopHeroMediaQuery = "(min-width: 769px)";
const mobileHeroMediaQuery = "(max-width: 768px)";
const desktopHeroMotion = {
  initialOpacity: 0.74,
  initialScale: 1.08,
  introScale: 1.03,
  bgScale: 1.04,
  scene2BgOpacity: 0.78,
  scene2Scale: 1.12,
  scene2Y: -28,
  scene3Scale: 1.18,
  scene3Y: -56,
  scene4Scale: 1.27,
  scene4Y: -92,
  scene4Opacity: 0.7,
  scene4BgOpacity: 0.34
};
const desktopHeroLayerMotion = {
  baseStartScale: 1.015,
  baseStartY: 10,
  baseScene2Scale: 1.04,
  baseScene2Y: -10,
  baseScene3Scale: 1.055,
  baseScene3Y: -16,
  baseScene4Scale: 1.07,
  baseScene4Y: -22,
  goldenStartOpacity: 0.1,
  goldenBaseOpacity: 0.34,
  goldenStartScale: 1.04,
  goldenScene2Scale: 1.08,
  goldenScene2Opacity: 0.48,
  goldenScene3Scale: 1.1,
  goldenScene3Opacity: 0.52,
  goldenScene4Scale: 1.13,
  goldenScene4Opacity: 0.24,
  textMistStartX: -18,
  textMistStartOpacity: 0.04,
  textMistBaseOpacity: 0.16,
  textMistScene2X: -22,
  textMistScene2Opacity: 0.24,
  textMistScene3X: -28,
  textMistScene3Opacity: 0.28,
  textMistScene4X: -38,
  textMistScene4Opacity: 0.08,
  skyStartOpacity: 0.08,
  skyBaseOpacity: 0.22,
  skyStartScale: 1.03,
  skyScene2X: 18,
  skyScene2Y: -10,
  skyScene2Scale: 1.04,
  skyScene2Opacity: 0.3,
  skyScene3X: 24,
  skyScene3Y: -14,
  skyScene3Scale: 1.06,
  skyScene3Opacity: 0.36,
  skyScene4X: 32,
  skyScene4Y: -22,
  skyScene4Opacity: 0.14,
  vignetteStartOpacity: 0.94,
  shadowStartOpacity: 0.9
};
const mobileHeroMotion = {
  initialOpacity: 0.86,
  initialScale: 1.03,
  introScale: 1.01,
  compositionStartOpacity: 0.9,
  compositionStartScale: 1.015,
  scene2Scale: 1.06,
  scene2Y: -16,
  scene2BgOpacity: 0.86,
  scene3Scale: 1.09,
  scene3Y: -28,
  scene4Scale: 1.12,
  scene4Y: -46,
  scene4Opacity: 0.76,
  scene4CompositionOpacity: 0.84,
  scene4BgOpacity: 0.54
};

const themeStorageKey = "preferred-theme";
const themeNames = new Set(["graphite", "light"]);
const mobileMenuFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");
const mobileMenuInertTargets = [header, mainContent].filter(Boolean);

const normalizeThemeName = (themeName) => {
  if (themeName === "black") {
    return "light";
  }

  return themeNames.has(themeName) ? themeName : "graphite";
};

const setThemeState = (themeName) => {
  if (!body) {
    return "graphite";
  }

  const normalizedTheme = normalizeThemeName(themeName);
  body.dataset.theme = normalizedTheme;

  themeToggles.forEach((toggle) => {
    const label = toggle.querySelector(".theme-toggle-label");

    if (label) {
      label.textContent = normalizedTheme === "light" ? "Grafite" : "Claro";
    }

    toggle.setAttribute("aria-pressed", normalizedTheme === "light" ? "true" : "false");
  });

  return normalizedTheme;
};

const getStoredTheme = () => {
  try {
    return window.localStorage.getItem(themeStorageKey);
  } catch (error) {
    return null;
  }
};

const persistTheme = (themeName) => {
  try {
    window.localStorage.setItem(themeStorageKey, themeName);
  } catch (error) {
    return;
  }
};

const initThemeToggle = () => {
  if (!body) {
    return;
  }

  const storedTheme = getStoredTheme();
  const initialTheme = normalizeThemeName(storedTheme || body.dataset.theme || "graphite");
  const appliedInitialTheme = setThemeState(initialTheme);

  if (storedTheme && storedTheme !== appliedInitialTheme) {
    persistTheme(appliedInitialTheme);
  }

  themeToggles.forEach((toggle) => {
    if (toggle.dataset.initialized === "true") {
      return;
    }

    toggle.dataset.initialized = "true";
    toggle.addEventListener("click", () => {
      const nextTheme = body.dataset.theme === "light" ? "graphite" : "light";
      const appliedTheme = setThemeState(nextTheme);
      persistTheme(appliedTheme);
    });
  });
};

const updateHeaderState = (scrollValue = window.scrollY) => {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", scrollValue > 40);
};

let hasQueuedHeroAssetRefresh = false;
const pendingHeroAssets = new Set();

function queueHeroAssetRefresh() {
  if (hasQueuedHeroAssetRefresh) {
    return;
  }

  hasQueuedHeroAssetRefresh = true;

  requestAnimationFrame(() => {
    hasQueuedHeroAssetRefresh = false;

    if (lenis) {
      lenis.resize();
    }

    ScrollTrigger.refresh();
    updateHeaderState(lenis ? lenis.scroll : window.scrollY);
  });
}

const settleHeroAssetRefresh = (image) => {
  pendingHeroAssets.delete(image);

  if (pendingHeroAssets.size === 0) {
    queueHeroAssetRefresh();
  }
};

const observeHeroAssetLoad = (image) => {
  if (!(image instanceof HTMLImageElement)) {
    return;
  }

  const source = image.getAttribute("src");

  if (!source || image.dataset.heroObservedSource === source) {
    return;
  }

  image.dataset.heroObservedSource = source;

  if (image.complete) {
    if (pendingHeroAssets.size === 0) {
      queueHeroAssetRefresh();
    }

    return;
  }

  pendingHeroAssets.add(image);

  const handleSettled = () => {
    settleHeroAssetRefresh(image);
  };

  image.addEventListener("load", handleSettled, { once: true });
  image.addEventListener("error", handleSettled, { once: true });
};

const hydrateHeroImageSource = (image, sourceAttribute) => {
  if (!(image instanceof HTMLImageElement)) {
    return;
  }

  if (!image.getAttribute("src")) {
    const nextSource = image.dataset[sourceAttribute];

    if (nextSource) {
      image.setAttribute("src", nextSource);
    }
  }

  observeHeroAssetLoad(image);
};

const applyResponsiveHeroAssetSources = () => {
  if (compactViewportMedia.matches) {
    hydrateHeroImageSource(heroMobileComposition, "mobileSrc");
    return;
  }

  heroDesktopLayerImages.forEach((image) => {
    hydrateHeroImageSource(image, "desktopSrc");
  });
};

const initHeroMouseParallax = () => {
  if (destroyHeroMouseParallax) {
    destroyHeroMouseParallax();
    destroyHeroMouseParallax = null;
  }

  const canUseMouseParallax =
    heroParallaxDesktopMedia.matches &&
    finePointerMedia.matches &&
    !prefersReducedMotion;

  if (!canUseMouseParallax) {
    return;
  }

  const hero = document.querySelector(".hero-cinematic");
  const heroVisual = document.querySelector(".hero-visual");
  const heroParallaxScene = document.querySelector(".hero-parallax-scene");
  const heroBaseLayer = document.querySelector(".hero-base-layer");
  const heroGoldenLightLayer = document.querySelector(".hero-golden-light-layer");
  const heroTextMistLayer = document.querySelector(".hero-text-mist-layer");
  const heroSkyGlowLayer = document.querySelector(".hero-sky-glow-layer");
  const heroBaseParallaxLayer = document.querySelector(".hero-base-parallax-layer");
  const heroGoldenLightParallaxLayer = document.querySelector(".hero-golden-light-parallax-layer");
  const heroGoldenLightParallaxScale = document.querySelector(".hero-golden-light-parallax-scale");
  const heroTextMistParallaxLayer = document.querySelector(".hero-text-mist-parallax-layer");
  const heroTextMistParallaxScale = document.querySelector(".hero-text-mist-parallax-scale");
  const heroSkyGlowParallaxLayer = document.querySelector(".hero-sky-glow-parallax-layer");
  const heroSkyGlowParallaxScale = document.querySelector(".hero-sky-glow-parallax-scale");
  const heroContentTargets = [
    document.querySelector(".hero-content-1"),
    document.querySelector(".hero-content-2")
  ].filter(Boolean);

  if (
    !hero ||
    !heroVisual ||
    !heroParallaxScene ||
    !heroBaseLayer ||
    !heroGoldenLightLayer ||
    !heroTextMistLayer ||
    !heroSkyGlowLayer ||
    !heroBaseParallaxLayer ||
    !heroGoldenLightParallaxLayer ||
    !heroGoldenLightParallaxScale ||
    !heroTextMistParallaxLayer ||
    !heroTextMistParallaxScale ||
    !heroSkyGlowParallaxLayer ||
    !heroSkyGlowParallaxScale
  ) {
    return;
  }

  gsap.set(
    [
      heroParallaxScene,
      heroBaseParallaxLayer,
      heroGoldenLightParallaxLayer,
      heroGoldenLightParallaxScale,
      heroTextMistParallaxLayer,
      heroTextMistParallaxScale,
      heroSkyGlowParallaxLayer,
      heroSkyGlowParallaxScale,
      ...heroContentTargets
    ],
    {
      force3D: true
    }
  );

  const visualRotateXTo = gsap.quickTo(heroParallaxScene, "rotationX", {
    duration: 0.9,
    ease: "power3.out"
  });
  const visualRotateYTo = gsap.quickTo(heroParallaxScene, "rotationY", {
    duration: 0.9,
    ease: "power3.out"
  });
  const baseXTo = gsap.quickTo(heroBaseParallaxLayer, "x", {
    duration: 0.85,
    ease: "power3.out"
  });
  const baseYTo = gsap.quickTo(heroBaseParallaxLayer, "y", {
    duration: 0.85,
    ease: "power3.out"
  });
  const goldenXTo = gsap.quickTo(heroGoldenLightParallaxLayer, "x", {
    duration: 0.85,
    ease: "power3.out"
  });
  const goldenYTo = gsap.quickTo(heroGoldenLightParallaxLayer, "y", {
    duration: 0.85,
    ease: "power3.out"
  });
  const goldenScaleXTo = gsap.quickTo(heroGoldenLightParallaxScale, "scaleX", {
    duration: 0.85,
    ease: "power3.out"
  });
  const goldenScaleYTo = gsap.quickTo(heroGoldenLightParallaxScale, "scaleY", {
    duration: 0.85,
    ease: "power3.out"
  });
  const textMistXTo = gsap.quickTo(heroTextMistParallaxLayer, "x", {
    duration: 0.85,
    ease: "power3.out"
  });
  const textMistYTo = gsap.quickTo(heroTextMistParallaxLayer, "y", {
    duration: 0.85,
    ease: "power3.out"
  });
  const textMistScaleXTo = gsap.quickTo(heroTextMistParallaxScale, "scaleX", {
    duration: 0.85,
    ease: "power3.out"
  });
  const textMistScaleYTo = gsap.quickTo(heroTextMistParallaxScale, "scaleY", {
    duration: 0.85,
    ease: "power3.out"
  });
  const skyGlowXTo = gsap.quickTo(heroSkyGlowParallaxLayer, "x", {
    duration: 0.85,
    ease: "power3.out"
  });
  const skyGlowYTo = gsap.quickTo(heroSkyGlowParallaxLayer, "y", {
    duration: 0.85,
    ease: "power3.out"
  });
  const skyGlowScaleXTo = gsap.quickTo(heroSkyGlowParallaxScale, "scaleX", {
    duration: 0.85,
    ease: "power3.out"
  });
  const skyGlowScaleYTo = gsap.quickTo(heroSkyGlowParallaxScale, "scaleY", {
    duration: 0.85,
    ease: "power3.out"
  });
  const contentXTo = heroContentTargets.map((target) => gsap.quickTo(target, "x", {
    duration: 0.95,
    ease: "power3.out"
  }));
  const contentYTo = heroContentTargets.map((target) => gsap.quickTo(target, "y", {
    duration: 0.95,
    ease: "power3.out"
  }));
  let contentRestState = heroContentTargets.map((target) => ({
    x: Number(gsap.getProperty(target, "x")) || 0,
    y: Number(gsap.getProperty(target, "y")) || 0
  }));
  let hasActiveParallaxPointer = false;

  const captureContentRestState = () => {
    contentRestState = heroContentTargets.map((target) => ({
      x: Number(gsap.getProperty(target, "x")) || 0,
      y: Number(gsap.getProperty(target, "y")) || 0
    }));
  };

  const resetHeroParallax = () => {
    visualRotateXTo(0);
    visualRotateYTo(0);
    baseXTo(0);
    baseYTo(0);
    goldenXTo(0);
    goldenYTo(0);
    goldenScaleXTo(1);
    goldenScaleYTo(1);
    textMistXTo(0);
    textMistYTo(0);
    textMistScaleXTo(1);
    textMistScaleYTo(1);
    skyGlowXTo(0);
    skyGlowYTo(0);
    skyGlowScaleXTo(1);
    skyGlowScaleYTo(1);
    contentXTo.forEach((animateTo, index) => {
      animateTo(contentRestState[index]?.x ?? 0);
    });
    contentYTo.forEach((animateTo, index) => {
      animateTo(contentRestState[index]?.y ?? 0);
    });
    hasActiveParallaxPointer = false;
  };

  const handleHeroPointerMove = (event) => {
    const rect = hero.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    if (!hasActiveParallaxPointer) {
      captureContentRestState();
      hasActiveParallaxPointer = true;
    }

    const normalizedX = gsap.utils.clamp(
      -0.5,
      0.5,
      (event.clientX - rect.left) / rect.width - 0.5
    );
    const normalizedY = gsap.utils.clamp(
      -0.5,
      0.5,
      (event.clientY - rect.top) / rect.height - 0.5
    );
    const parallaxDepth = Math.min(1, Math.hypot(normalizedX, normalizedY) / 0.7);
    const contentOffsetX = normalizedX * 16;
    const contentOffsetY = normalizedY * 10;

    visualRotateYTo(normalizedX * 6);
    visualRotateXTo(normalizedY * -4.4);
    baseXTo(normalizedX * 36);
    baseYTo(normalizedY * 24);
    goldenXTo(normalizedX * 84);
    goldenYTo(normalizedY * 48);
    goldenScaleXTo(1 + parallaxDepth * 0.04);
    goldenScaleYTo(1 + parallaxDepth * 0.04);
    textMistXTo(normalizedX * -68);
    textMistYTo(normalizedY * -40);
    textMistScaleXTo(1 + parallaxDepth * 0.05);
    textMistScaleYTo(1 + parallaxDepth * 0.05);
    skyGlowXTo(normalizedX * 64);
    skyGlowYTo(normalizedY * -40);
    skyGlowScaleXTo(1 + parallaxDepth * 0.03);
    skyGlowScaleYTo(1 + parallaxDepth * 0.03);
    contentXTo.forEach((animateTo, index) => {
      animateTo((contentRestState[index]?.x ?? 0) + contentOffsetX);
    });
    contentYTo.forEach((animateTo, index) => {
      animateTo((contentRestState[index]?.y ?? 0) + contentOffsetY);
    });
  };

  hero.addEventListener("pointerenter", captureContentRestState);
  hero.addEventListener("pointermove", handleHeroPointerMove);
  hero.addEventListener("pointerleave", resetHeroParallax);
  window.addEventListener("blur", resetHeroParallax);

  destroyHeroMouseParallax = () => {
    hero.removeEventListener("pointerenter", captureContentRestState);
    hero.removeEventListener("pointermove", handleHeroPointerMove);
    hero.removeEventListener("pointerleave", resetHeroParallax);
    window.removeEventListener("blur", resetHeroParallax);
    resetHeroParallax();
  };
};

const killMobileMenuAnimation = () => {
  if (!mobileMenuAnimation) {
    return;
  }

  mobileMenuAnimation.kill();
  mobileMenuAnimation = null;
};

const getMobileMenuFocusableElements = () => {
  if (!mobileMenu) {
    return [];
  }

  return Array.from(mobileMenu.querySelectorAll(mobileMenuFocusableSelector)).filter((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    return (
      element !== mobileMenuBackdrop &&
      !element.hasAttribute("disabled") &&
      !element.hidden &&
      element.getClientRects().length > 0
    );
  });
};

const focusFirstMobileMenuElement = () => {
  const focusableElements = getMobileMenuFocusableElements();
  const focusTarget = mobileMenuClose || focusableElements[0] || mobileMenuPanel;

  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
};

const setMobileMenuBackgroundInert = (isInert) => {
  mobileMenuInertTargets.forEach((target) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.inert = isInert;
  });
};

const pushMobileMenuHistoryState = () => {
  if (pushedMenuHistoryState || typeof window.history?.pushState !== "function") {
    return;
  }

  try {
    const currentState =
      history.state && typeof history.state === "object" ? history.state : {};

    history.pushState({
      ...currentState,
      mobileMenuOpen: true
    }, "");
    pushedMenuHistoryState = true;
  } catch (error) {
    pushedMenuHistoryState = false;
  }
};

const queueMobileMenuHistoryClose = (closeOptions) => {
  if (!pushedMenuHistoryState || typeof window.history?.back !== "function") {
    return false;
  }

  pendingMobileMenuCloseRequest = { ...closeOptions };
  pushedMenuHistoryState = false;

  try {
    history.back();
    return true;
  } catch (error) {
    pendingMobileMenuCloseRequest = null;
    return false;
  }
};

const lockPageScroll = () => {
  if (!body || body.dataset.scrollLocked === "true") {
    return;
  }

  lockedScrollY = lenis ? Math.round(lenis.scroll) : window.scrollY;
  body.dataset.scrollLocked = "true";
  body.style.position = "fixed";
  body.style.top = `-${lockedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
};

const unlockPageScroll = () => {
  if (!body || body.dataset.scrollLocked !== "true") {
    return;
  }

  const scrollPosition = lockedScrollY;

  body.dataset.scrollLocked = "false";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";

  window.scrollTo(0, scrollPosition);
};

const resolveAnchorTarget = (anchor) => {
  const targetId = anchor?.getAttribute("href");

  if (!targetId || targetId === "#" || !targetId.startsWith("#")) {
    return null;
  }

  return document.querySelector(targetId);
};

const scrollToTarget = (targetElement) => {
  if (!targetElement) {
    return;
  }

  const runScroll = () => {
    if (lenis) {
      lenis.scrollTo(targetElement, {
        duration: prefersReducedMotion ? 0 : 1.1
      });
      return;
    }

    targetElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  };

  window.requestAnimationFrame(runScroll);
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
  setMobileMenuBackgroundInert(isOpen);

  if (isOpen) {
    lockPageScroll();
  } else {
    unlockPageScroll();
  }

  if (lenis) {
    if (isOpen) {
      lenis.stop();
    } else {
      lenis.start();
      lenis.scrollTo(lockedScrollY, {
        immediate: true
      });
      lenis.resize();
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

  mobileMenuReturnFocusTarget =
    document.activeElement instanceof HTMLElement ? document.activeElement : mobileMenuToggle;

  killMobileMenuAnimation();
  mobileMenu.hidden = false;
  if (mobileMenuInner) {
    mobileMenuInner.scrollTop = 0;
  }
  pushMobileMenuHistoryState();
  setMobileMenuState(true);
  window.requestAnimationFrame(() => {
    if (isMobileMenuOpen) {
      focusFirstMobileMenuElement();
    }
  });

  if (prefersReducedMotion) {
    clearMobileMenuTransforms();
    focusFirstMobileMenuElement();
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
      focusFirstMobileMenuElement();
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

const closeMobileMenu = ({
  immediate = false,
  focusToggle = false,
  afterClose = null,
  fromPopState = false,
  skipHistoryBack = false
} = {}) => {
  if (!mobileMenu || mobileMenu.hidden) {
    return;
  }

  if (!fromPopState && !skipHistoryBack) {
    const queuedHistoryClose = queueMobileMenuHistoryClose({
      immediate,
      focusToggle,
      afterClose
    });

    if (queuedHistoryClose) {
      return;
    }
  }

  killMobileMenuAnimation();

  const finalize = () => {
    const focusTarget = mobileMenuReturnFocusTarget || mobileMenuToggle;

    mobileMenu.hidden = true;
    mobileMenuTouchStartY = null;
    mobileMenuTouchStartScrollTop = 0;
    mobileMenuIsDragging = false;
    setMobileMenuState(false);
    clearMobileMenuTransforms();
    mobileMenuReturnFocusTarget = null;
    pendingMobileMenuCloseRequest = null;

    if (typeof afterClose === "function") {
      afterClose();
      return;
    }

    if (focusToggle && focusTarget instanceof HTMLElement) {
      focusTarget.focus();
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
  mobileMenuTouchStartScrollTop = mobileMenuInner ? mobileMenuInner.scrollTop : 0;
  mobileMenuIsDragging = false;
};

const handleMobileMenuTouchMove = (event) => {
  if (!isMobileMenuOpen || mobileMenuTouchStartY === null) {
    return;
  }

  mobileMenuTouchDeltaY = event.touches[0].clientY - mobileMenuTouchStartY;

  if (mobileMenuTouchDeltaY <= 0) {
    return;
  }

  if (mobileMenuInner && mobileMenuInner.scrollTop > 0) {
    return;
  }

  if (mobileMenuTouchStartScrollTop > 0) {
    return;
  }

  mobileMenuIsDragging = true;
  event.preventDefault();
  updateMobileMenuDrag(mobileMenuTouchDeltaY);
};

const handleMobileMenuTouchEnd = () => {
  if (!isMobileMenuOpen || mobileMenuTouchStartY === null) {
    return;
  }

  const shouldCloseMenu = mobileMenuIsDragging && mobileMenuTouchDeltaY > 110;
  const shouldResetMenu = mobileMenuIsDragging && mobileMenuTouchDeltaY > 0;

  mobileMenuTouchStartY = null;
  mobileMenuTouchStartScrollTop = 0;
  mobileMenuIsDragging = false;

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

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
} else {
  window.addEventListener("scroll", () => {
    updateHeaderState(window.scrollY);
  }, { passive: true });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetElement = resolveAnchorTarget(anchor);

    if (!targetElement) {
      return;
    }

    event.preventDefault();

    if (mobileMenu?.contains(anchor) && isMobileMenuOpen) {
      closeMobileMenu({
        afterClose: () => {
          scrollToTarget(targetElement);
        }
      });
      return;
    }

    scrollToTarget(targetElement);
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

  window.addEventListener("keydown", (event) => {
    if (!isMobileMenuOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu({ focusToggle: true });
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getMobileMenuFocusableElements();

    if (!focusableElements.length) {
      event.preventDefault();
      focusFirstMobileMenuElement();
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstFocusable || !mobileMenu.contains(activeElement)) {
        event.preventDefault();
        lastFocusable.focus();
      }

      return;
    }

    if (activeElement === lastFocusable || !mobileMenu.contains(activeElement)) {
      event.preventDefault();
      firstFocusable.focus();
    }
  });

  document.addEventListener("focusin", (event) => {
    if (!isMobileMenuOpen || mobileMenu.contains(event.target)) {
      return;
    }

    focusFirstMobileMenuElement();
  });

  window.addEventListener("popstate", () => {
    const pendingCloseOptions = pendingMobileMenuCloseRequest;
    pendingMobileMenuCloseRequest = null;

    if (!isMobileMenuOpen) {
      return;
    }

    pushedMenuHistoryState = false;
    closeMobileMenu({
      ...(pendingCloseOptions || {}),
      fromPopState: true,
      focusToggle:
        pendingCloseOptions && "focusToggle" in pendingCloseOptions
          ? pendingCloseOptions.focusToggle
          : true
    });
  });

  headerMenuBreakpoint.addEventListener("change", (event) => {
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
    mobileMenuTouchStartScrollTop = 0;
    mobileMenuIsDragging = false;
    resetMobileMenuDrag();
  });
}

initThemeToggle();
updateHeaderState();
applyResponsiveHeroAssetSources();

/*
  Estado inicial dos elementos
*/
const setSharedHeroInitialState = () => {
  gsap.set([
    ".hero-visual",
    ".hero-mobile-composition",
    ".hero-bg",
    ".hero-base-layer",
    ".hero-golden-light-layer",
    ".hero-text-mist-layer",
    ".hero-sky-glow-layer",
    ".hero-transition-panel"
  ], {
    force3D: true
  });

  gsap.set(".hero-bg", {
    scale: 1,
    opacity: 1
  });

  gsap.set(".hero-content-1", {
    opacity: 1,
    y: 0
  });

  gsap.set(".hero-content-1 .eyebrow", {
    opacity: 0,
    y: 18,
    clipPath: "inset(100% 0% 0% 0%)"
  });

  gsap.set(".hero-content-1 h1", {
    opacity: 0,
    y: 42,
    clipPath: "inset(100% 0% 0% 0%)"
  });

  gsap.set(".hero-content-1 p", {
    opacity: 0,
    y: 26,
    clipPath: "inset(100% 0% 0% 0%)"
  });

  gsap.set(".hero-content-1 .hero-mobile-cta", {
    opacity: 0,
    y: 20
  });

  gsap.set(".hero-content-2", {
    opacity: 0,
    y: 50
  });

  gsap.set(".hero-content-2 .eyebrow", {
    opacity: 0,
    y: 18,
    clipPath: "inset(100% 0% 0% 0%)"
  });

  gsap.set(".hero-content-2 h2", {
    opacity: 0,
    y: 42,
    clipPath: "inset(100% 0% 0% 0%)"
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
};

const setDesktopHeroInitialState = () => {
  setSharedHeroInitialState();

  gsap.set(".hero-visual", {
    scale: desktopHeroMotion.initialScale,
    y: 0,
    opacity: desktopHeroMotion.initialOpacity,
    transformOrigin: "center center"
  });

  gsap.set(".hero-mobile-composition", {
    opacity: 0,
    scale: 1,
    y: 0,
    transformOrigin: "58% 50%"
  });

  gsap.set(".hero-base-layer", {
    scale: desktopHeroLayerMotion.baseStartScale,
    y: desktopHeroLayerMotion.baseStartY,
    transformOrigin: "center center"
  });

  gsap.set(".hero-golden-light-layer", {
    xPercent: -50,
    yPercent: -50,
    opacity: desktopHeroLayerMotion.goldenStartOpacity,
    scale: desktopHeroLayerMotion.goldenStartScale,
    transformOrigin: "center center"
  });

  gsap.set(".hero-text-mist-layer", {
    x: desktopHeroLayerMotion.textMistStartX,
    y: 0,
    opacity: desktopHeroLayerMotion.textMistStartOpacity
  });

  gsap.set(".hero-sky-glow-layer", {
    x: 0,
    y: 0,
    scale: desktopHeroLayerMotion.skyStartScale,
    opacity: desktopHeroLayerMotion.skyStartOpacity
  });

  gsap.set(".hero-edge-vignette-layer", {
    opacity: desktopHeroLayerMotion.vignetteStartOpacity
  });

  gsap.set(".hero-shadow-overlay-layer", {
    opacity: desktopHeroLayerMotion.shadowStartOpacity
  });
};

const setMobileHeroInitialState = () => {
  setSharedHeroInitialState();

  gsap.set(".hero-visual", {
    scale: mobileHeroMotion.initialScale,
    y: 0,
    opacity: mobileHeroMotion.initialOpacity,
    transformOrigin: "58% 50%"
  });

  gsap.set(".hero-mobile-composition", {
    opacity: mobileHeroMotion.compositionStartOpacity,
    scale: mobileHeroMotion.compositionStartScale,
    y: 0,
    transformOrigin: "58% 50%"
  });
};

const createDesktopHeroTimeline = () => {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero-cinematic",
      start: "top top",
      end: "+=3600",
      scrub: 1.2,
      pin: true
    }
  });

  timeline.from(".header", {
    y: -40,
    opacity: 0,
    duration: 0.6
  }, 0.18);

  timeline.to(".hero-visual", {
    opacity: 1,
    scale: desktopHeroMotion.introScale,
    duration: 1.45
  }, 0);

  timeline.to(".hero-base-layer", {
    scale: 1,
    y: 0,
    duration: 1.4
  }, 0.04);

  timeline.to(".hero-golden-light-layer", {
    opacity: desktopHeroLayerMotion.goldenBaseOpacity,
    scale: 1,
    duration: 1.2
  }, 0.18);

  timeline.to(".hero-text-mist-layer", {
    x: 0,
    opacity: desktopHeroLayerMotion.textMistBaseOpacity,
    duration: 1.25
  }, 0.28);

  timeline.to(".hero-sky-glow-layer", {
    opacity: desktopHeroLayerMotion.skyBaseOpacity,
    scale: 1,
    duration: 1.28
  }, 0.34);

  timeline.to(".hero-content-1 .eyebrow", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.7
  }, 0.4);

  timeline.to(".hero-content-1 h1", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 1.02
  }, 0.48);

  timeline.to(".hero-content-1 p", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.84
  }, 0.66);

  timeline.to(".hero-content-1 .text-atmosphere", {
    opacity: 0.78,
    scale: 1,
    duration: 1
  }, 0.54);

  timeline.to(".hero-lines span", {
    scaleY: 1,
    duration: 0.9,
    stagger: 0.12
  }, 0.62);

  timeline.to(".scroll-hint", {
    opacity: 1,
    y: 0,
    duration: 0.6
  }, 0.86);

  timeline.to(".hero-visual", {
    scale: desktopHeroMotion.scene2Scale,
    y: desktopHeroMotion.scene2Y,
    duration: 1.45
  });

  timeline.to(".hero-bg", {
    scale: desktopHeroMotion.bgScale,
    opacity: desktopHeroMotion.scene2BgOpacity,
    duration: 1.2
  }, "<");

  timeline.to(".hero-base-layer", {
    scale: desktopHeroLayerMotion.baseScene2Scale,
    y: desktopHeroLayerMotion.baseScene2Y,
    duration: 1.45
  }, "<");

  timeline.to(".hero-golden-light-layer", {
    opacity: desktopHeroLayerMotion.goldenScene2Opacity,
    scale: desktopHeroLayerMotion.goldenScene2Scale,
    duration: 1.45
  }, "<");

  timeline.to(".hero-text-mist-layer", {
    x: desktopHeroLayerMotion.textMistScene2X,
    opacity: desktopHeroLayerMotion.textMistScene2Opacity,
    duration: 1.45
  }, "<");

  timeline.to(".hero-sky-glow-layer", {
    x: desktopHeroLayerMotion.skyScene2X,
    y: desktopHeroLayerMotion.skyScene2Y,
    scale: desktopHeroLayerMotion.skyScene2Scale,
    opacity: desktopHeroLayerMotion.skyScene2Opacity,
    duration: 1.45
  }, "<");

  timeline.to(".hero-content-1", {
    y: -56,
    opacity: 0,
    duration: 0.9
  }, "<");

  timeline.to(".hero-content-1 .text-atmosphere", {
    opacity: 0,
    scale: 1.06,
    duration: 0.8
  }, "<");

  timeline.to(".scroll-hint", {
    opacity: 0,
    y: 16,
    duration: 0.5
  }, "<");

  timeline.to(".hero-content-2", {
    opacity: 1,
    y: 0,
    duration: 0.98
  }, "+=0.08");

  timeline.to(".hero-content-2 .eyebrow", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.66
  }, "<0.08");

  timeline.to(".hero-content-2 h2", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.98
  }, "<0.04");

  timeline.to(".hero-content-2 .text-atmosphere", {
    opacity: 0.68,
    scale: 1,
    duration: 0.9
  }, "<");

  timeline.to(".hero-visual", {
    scale: desktopHeroMotion.scene3Scale,
    y: desktopHeroMotion.scene3Y,
    duration: 1.32
  }, "<");

  timeline.to(".hero-base-layer", {
    scale: desktopHeroLayerMotion.baseScene3Scale,
    y: desktopHeroLayerMotion.baseScene3Y,
    duration: 1.32
  }, "<");

  timeline.to(".hero-golden-light-layer", {
    opacity: desktopHeroLayerMotion.goldenScene3Opacity,
    scale: desktopHeroLayerMotion.goldenScene3Scale,
    duration: 1.32
  }, "<");

  timeline.to(".hero-text-mist-layer", {
    x: desktopHeroLayerMotion.textMistScene3X,
    opacity: desktopHeroLayerMotion.textMistScene3Opacity,
    duration: 1.32
  }, "<");

  timeline.to(".hero-sky-glow-layer", {
    x: desktopHeroLayerMotion.skyScene3X,
    y: desktopHeroLayerMotion.skyScene3Y,
    scale: desktopHeroLayerMotion.skyScene3Scale,
    opacity: desktopHeroLayerMotion.skyScene3Opacity,
    duration: 1.32
  }, "<");

  timeline.to(".hero-content-2", {
    y: -54,
    opacity: 0,
    duration: 0.82
  });

  timeline.to(".hero-content-2 .text-atmosphere", {
    opacity: 0,
    scale: 1.1,
    duration: 0.82
  }, "<");

  timeline.to(".hero-transition-panel", {
    yPercent: 0,
    duration: 1.2,
    ease: "power2.out"
  }, "<0.08");

  timeline.to(".hero-visual", {
    scale: desktopHeroMotion.scene4Scale,
    y: desktopHeroMotion.scene4Y,
    opacity: desktopHeroMotion.scene4Opacity,
    duration: 1.08
  }, "<");

  timeline.to(".hero-bg", {
    opacity: desktopHeroMotion.scene4BgOpacity,
    duration: 1.08
  }, "<");

  timeline.to(".hero-base-layer", {
    scale: desktopHeroLayerMotion.baseScene4Scale,
    y: desktopHeroLayerMotion.baseScene4Y,
    duration: 1.08
  }, "<");

  timeline.to(".hero-golden-light-layer", {
    opacity: desktopHeroLayerMotion.goldenScene4Opacity,
    scale: desktopHeroLayerMotion.goldenScene4Scale,
    duration: 1.08
  }, "<");

  timeline.to(".hero-text-mist-layer", {
    x: desktopHeroLayerMotion.textMistScene4X,
    opacity: desktopHeroLayerMotion.textMistScene4Opacity,
    duration: 1.08
  }, "<");

  timeline.to(".hero-sky-glow-layer", {
    x: desktopHeroLayerMotion.skyScene4X,
    y: desktopHeroLayerMotion.skyScene4Y,
    opacity: desktopHeroLayerMotion.skyScene4Opacity,
    duration: 1.08
  }, "<");
};

const createMobileHeroTimeline = () => {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero-cinematic",
      start: "top top",
      end: "bottom top",
      scrub: 0.92,
      pin: false
    }
  });

  timeline.to(".hero-visual", {
    opacity: 1,
    scale: mobileHeroMotion.introScale,
    duration: 0.84
  }, 0);

  timeline.to(".hero-mobile-composition", {
    opacity: 1,
    scale: 1,
    duration: 0.88
  }, 0.04);

  timeline.to(".hero-content-1 .eyebrow", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.56
  }, 0.12);

  timeline.to(".hero-content-1 h1", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.78
  }, 0.18);

  timeline.to(".hero-content-1 p", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.72
  }, 0.3);

  timeline.to(".hero-content-1 .hero-mobile-cta", {
    opacity: 1,
    y: 0,
    duration: 0.62
  }, 0.38);

  timeline.to(".hero-content-1 .text-atmosphere", {
    opacity: 0.56,
    scale: 1,
    duration: 0.72
  }, 0.26);

  timeline.to(".hero-lines span", {
    scaleY: 1,
    duration: 0.5,
    stagger: 0.08
  }, 0.26);

  timeline.add("scene2", 1.02);

  timeline.to(".hero-visual", {
    scale: mobileHeroMotion.scene2Scale,
    y: mobileHeroMotion.scene2Y,
    duration: 0.96
  }, "scene2");

  timeline.to(".hero-bg", {
    opacity: mobileHeroMotion.scene2BgOpacity,
    duration: 0.88
  }, "scene2");

  timeline.to(".hero-content-1", {
    y: -32,
    opacity: 0,
    duration: 0.68
  }, "scene2");

  timeline.to(".hero-content-1 .text-atmosphere", {
    opacity: 0,
    scale: 1.04,
    duration: 0.62
  }, "scene2");

  timeline.to(".hero-content-2", {
    opacity: 1,
    y: 0,
    duration: 0.74
  }, "scene2+=0.14");

  timeline.to(".hero-content-2 .eyebrow", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.52
  }, "scene2+=0.18");

  timeline.to(".hero-content-2 h2", {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    duration: 0.76
  }, "scene2+=0.22");

  timeline.to(".hero-content-2 .text-atmosphere", {
    opacity: 0.52,
    scale: 1,
    duration: 0.68
  }, "scene2+=0.2");

  timeline.to(".hero-visual", {
    scale: mobileHeroMotion.scene3Scale,
    y: mobileHeroMotion.scene3Y,
    duration: 0.9
  }, "scene2+=0.18");

  timeline.add("scene3", 1.94);

  timeline.to(".hero-content-2", {
    y: -34,
    opacity: 0,
    duration: 0.6
  }, "scene3");

  timeline.to(".hero-content-2 .text-atmosphere", {
    opacity: 0,
    scale: 1.06,
    duration: 0.6
  }, "scene3");

  timeline.to(".hero-transition-panel", {
    yPercent: 0,
    duration: 0.9,
    ease: "power2.out"
  }, "scene3+=0.04");

  timeline.to(".hero-visual", {
    scale: mobileHeroMotion.scene4Scale,
    y: mobileHeroMotion.scene4Y,
    opacity: mobileHeroMotion.scene4Opacity,
    duration: 0.88
  }, "scene3");

  timeline.to(".hero-mobile-composition", {
    opacity: mobileHeroMotion.scene4CompositionOpacity,
    duration: 0.88
  }, "scene3");

  timeline.to(".hero-bg", {
    opacity: mobileHeroMotion.scene4BgOpacity,
    duration: 0.88
  }, "scene3");
};

initHeroMouseParallax();
heroParallaxDesktopMedia.addEventListener("change", initHeroMouseParallax);
finePointerMedia.addEventListener("change", initHeroMouseParallax);
compactViewportMedia.addEventListener("change", () => {
  applyResponsiveHeroAssetSources();
  queueHeroAssetRefresh();
});

const heroMatchMedia = gsap.matchMedia();

heroMatchMedia.add(desktopHeroMediaQuery, () => {
  applyResponsiveHeroAssetSources();
  setDesktopHeroInitialState();
  createDesktopHeroTimeline();
});

heroMatchMedia.add(mobileHeroMediaQuery, () => {
  applyResponsiveHeroAssetSources();
  setMobileHeroInitialState();
  createMobileHeroTimeline();
});

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
  if (isCompactViewport) {
    contactTimeline.from(".contact-panel", {
      y: sectionMotion.panelY,
      opacity: 0,
      duration: 0.88
    });

    contactTimeline.from(".contact-panel .field-group, .contact-panel .contact-button", {
      y: 18,
      opacity: 0,
      duration: 0.52,
      stagger: sectionMotion.fieldStagger
    }, "-=0.38");

    contactTimeline.from(".contact-visual-frame", {
      y: sectionMotion.visualY,
      opacity: 0,
      duration: 0.82
    }, "-=0.26");
  } else {
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

heroLayerImages.forEach((image) => {
  observeHeroAssetLoad(image);
});

window.addEventListener("load", () => {
  queueHeroAssetRefresh();

  updateHeaderState(lenis ? lenis.scroll : window.scrollY);
});
