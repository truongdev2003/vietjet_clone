import { useEffect, useState } from "react";
import bannerService from "../services/bannerService";
import "../styles/HeroCarousel.css";

const HeroCarousel = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await bannerService.getActiveBanners();
      if (response.success && response.data.banners.length > 0) {
        setBanners(response.data.banners);
      } else {
        // Default banners nếu chưa có data
        setBanners([
          {
            _id: "1",
            title: "Bay cùng Vietjet Air",
            description: "Khám phá thế giới với giá vé ưu đãi nhất",
            image: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
          },
          {
            _id: "2",
            title: "Ưu đãi đặc biệt mùa hè",
            description: "Giảm giá lên đến 50% các chặng bay nội địa",
            image: "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)",
          },
          {
            _id: "3",
            title: "Điểm đến châu Á",
            description: "Khám phá 100+ điểm đến khắp châu Á",
            image: "linear-gradient(135deg, #dc2626 0%, #be123c 100%)",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      // Default banners on error
      setBanners([
        {
          _id: "1",
          title: "Bay cùng Vietjet Air",
          description: "Khám phá thế giới với giá vé ưu đãi nhất",
          image: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto slide
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length]);

  // Track view when banner is displayed
  useEffect(() => {
    if (
      banners[currentSlide] &&
      banners[currentSlide]._id &&
      !banners[currentSlide]._id.match(/^[0-9]$/)
    ) {
      bannerService
        .trackView(banners[currentSlide]._id)
        .catch((err) => console.error("Error tracking view:", err));
    }
  }, [currentSlide, banners]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleBannerClick = (banner) => {
    if (banner.link) {
      if (banner._id && !banner._id.match(/^[0-9]$/)) {
        bannerService
          .trackClick(banner._id)
          .catch((err) => console.error("Error tracking click:", err));
      }
      window.open(banner.link, "_blank");
    }
  };

  if (loading) {
    return (
      <section className="hero-carousel">
        <div className="hero-slide active">
          <div
            className="hero-background"
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
            }}
          />
          <div className="hero-content-wrapper">
            <div className="loading-spinner-hero">
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="hero-carousel"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`hero-slide ${index === currentSlide ? "active" : ""}`}
          onClick={() => handleBannerClick(banner)}
          style={{ cursor: banner.link ? "pointer" : "default" }}
        >
          {/* Background */}
          <div
            className="hero-background"
            style={{
              background: banner.image.startsWith("http")
                ? `url(${banner.image})`
                : banner.image,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Pattern Overlay */}
          <div className="hero-pattern" />
        </div>
      ))}

      {/* Search Form Container - Positioned on the right */}
      <div className="hero-search-container">{children}</div>

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="carousel-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
