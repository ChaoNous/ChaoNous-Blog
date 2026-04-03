import { BANNER_HEIGHT_EXTEND, BP_TABLET } from "../../constants/constants";
import { siteConfig } from "../../config";

let activeCarouselCleanup: (() => void) | null = null;
let activeCarouselElement: HTMLElement | null = null;

function initCarousel() {
  const carousel = document.getElementById("banner-carousel");
  if (!(carousel instanceof HTMLElement)) {
    cleanupBannerRuntime();
    return;
  }

  if (activeCarouselElement === carousel) {
    return;
  }

  cleanupBannerRuntime();

  const carouselItems = Array.from(document.querySelectorAll(".carousel-item"));
  const isMobile = window.innerWidth < BP_TABLET;
  const validItems = carouselItems.filter((item) => {
    if (isMobile) {
      return item.querySelector(".block.md\\:hidden");
    }
    return item.querySelector(".hidden.md\\:block");
  });

  if (validItems.length <= 1 || !siteConfig.banner.carousel?.enable) {
    activeCarouselElement = carousel;
    activeCarouselCleanup = null;
    return;
  }

  let currentIndex = 0;
  const interval = siteConfig.banner.carousel?.interval || 6;
  let carouselInterval: number | null = null;
  let isPaused = false;
  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  function switchToSlide(index: number) {
    const currentItem = validItems[currentIndex];
    currentItem.classList.remove("opacity-100", "scale-100");
    currentItem.classList.add("opacity-0", "scale-110");

    currentIndex = index;

    const nextItem = validItems[currentIndex];
    nextItem.classList.add("opacity-100", "scale-100");
    nextItem.classList.remove("opacity-0", "scale-110");
  }

  function startCarousel() {
    if (carouselInterval !== null) {
      window.clearInterval(carouselInterval);
    }

    carouselInterval = window.setInterval(() => {
      if (!isPaused) {
        const nextIndex = (currentIndex + 1) % validItems.length;
        switchToSlide(nextIndex);
      }
    }, interval * 1000);
  }

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = false;
    isPaused = true;
    if (carouselInterval !== null) {
      window.clearInterval(carouselInterval);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!startX || !startY) return;

    const diffX = Math.abs(e.touches[0].clientX - startX);
    const diffY = Math.abs(e.touches[0].clientY - startY);

    if (diffX > diffY && diffX > 30) {
      isSwiping = true;
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!startX || !startY || !isSwiping) {
      isPaused = false;
      startCarousel();
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        const nextIndex = (currentIndex + 1) % validItems.length;
        switchToSlide(nextIndex);
      } else {
        const prevIndex =
          (currentIndex - 1 + validItems.length) % validItems.length;
        switchToSlide(prevIndex);
      }
    }

    startX = 0;
    startY = 0;
    isSwiping = false;
    isPaused = false;
    startCarousel();
  };

  const handleMouseEnter = () => {
    isPaused = true;
    if (carouselInterval !== null) {
      window.clearInterval(carouselInterval);
    }
  };

  const handleMouseLeave = () => {
    isPaused = false;
    startCarousel();
  };

  carouselItems.forEach((item) => {
    item.classList.add("opacity-0", "scale-110");
    item.classList.remove("opacity-100", "scale-100");
  });

  validItems[0].classList.add("opacity-100", "scale-100");
  validItems[0].classList.remove("opacity-0", "scale-110");

  if ("ontouchstart" in window) {
    carousel.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    carousel.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    carousel.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });
  }

  carousel.addEventListener("mouseenter", handleMouseEnter);
  carousel.addEventListener("mouseleave", handleMouseLeave);

  startCarousel();

  activeCarouselElement = carousel;
  activeCarouselCleanup = () => {
    if ("ontouchstart" in window) {
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchmove", handleTouchMove);
      carousel.removeEventListener("touchend", handleTouchEnd);
    }
    carousel.removeEventListener("mouseenter", handleMouseEnter);
    carousel.removeEventListener("mouseleave", handleMouseLeave);

    if (carouselInterval !== null) {
      window.clearInterval(carouselInterval);
    }
  };
}

export function revealBanner() {
  requestAnimationFrame(() => {
    const banner = document.getElementById("banner");
    if (banner) {
      banner.classList.remove("opacity-0", "scale-105");
    }

    const mobileBanner = document.querySelector(
      '.block.md\\:hidden[alt="Mobile banner image of the blog"]',
    );
    if (mobileBanner && !document.getElementById("banner-carousel")) {
      mobileBanner.classList.remove("opacity-0", "scale-105");
      mobileBanner.classList.add("opacity-100");
    }

    initCarousel();
  });
}

export function syncBannerHeightExtend() {
  let offset = Math.floor(window.innerHeight * (BANNER_HEIGHT_EXTEND / 100));
  offset = offset - (offset % 4);
  document.documentElement.style.setProperty(
    "--banner-height-extend",
    `${offset}px`,
  );
}

export function cleanupBannerRuntime() {
  activeCarouselCleanup?.();
  activeCarouselCleanup = null;
  activeCarouselElement = null;
}
