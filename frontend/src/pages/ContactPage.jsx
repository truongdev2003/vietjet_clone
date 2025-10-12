import {
    ChevronDown,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
} from "lucide-react";
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import contactService from "../services/contactService";
import "../styles/Contact.css";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const faqs = [
    {
      question: "Làm thế nào để đặt vé máy bay?",
      answer:
        "Bạn có thể đặt vé trực tuyến trên website của chúng tôi bằng cách tìm kiếm chuyến bay, chọn chuyến bay phù hợp, điền thông tin hành khách và thanh toán. Hoặc liên hệ hotline 1900-1886 để được hỗ trợ.",
    },
    {
      question: "Chính sách hủy vé và hoàn tiền?",
      answer:
        "Vé có thể hủy trong vòng 24 giờ sau khi đặt để được hoàn tiền 100%. Sau 24 giờ, phí hủy vé áp dụng tùy theo loại vé và thời gian hủy. Vui lòng xem chi tiết trong điều khoản đặt vé.",
    },
    {
      question: "Tôi có thể thay đổi thông tin chuyến bay không?",
      answer:
        "Có, bạn có thể thay đổi ngày, giờ bay hoặc hành trình với phí thay đổi áp dụng. Thay đổi tên hành khách chỉ áp dụng trong trường hợp lỗi chính tả nhỏ.",
    },
    {
      question: "Hành lý được phép mang theo?",
      answer:
        "Hành lý xách tay: 7kg (1 kiện). Hành lý ký gửi: 20kg (hạng phổ thông), 30kg (hạng thương gia). Vật phẩm cấm: chất lỏng >100ml, vũ khí, chất cháy nổ.",
    },
    {
      question: "Check-in online như thế nào?",
      answer:
        "Check-in online mở từ 24 giờ đến 1 giờ trước giờ khởi hành. Truy cập trang Check-in, nhập mã đặt vé và họ tên, chọn ghế và tải boarding pass.",
    },
    {
      question: "Chương trình khách hàng thân thiết?",
      answer:
        "Đăng ký thành viên VietJet Sky Club để tích điểm mỗi chuyến bay, đổi vé miễn phí, ưu tiên check-in, phòng chờ thương gia và nhiều đặc quyền khác.",
    },
  ];

  const contactInfo = [
    {
      icon: Phone,
      title: "Hotline",
      details: ["1900-1886", "024-3868-2888"],
      subtext: "24/7 - Miễn phí",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["support@vietjet.com", "booking@vietjet.com"],
      subtext: "Phản hồi trong 24h",
    },
    {
      icon: MapPin,
      title: "Văn phòng",
      details: ["Tầng 8, Tòa nhà Icon4", "Số 243A Đê La Thành, Hà Nội"],
      subtext: "T2-T6: 8:00-17:30",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Use contactService to submit form
      await contactService.submitContactForm(formData);
      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setError(error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <>
      <Header />
      <div className="contact-page">
        {/* Hero Section */}
        <div className="contact-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <MessageCircle size={48} strokeWidth={2} />
            </div>
            <h1>Liên hệ với chúng tôi</h1>
            <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
          </div>
        </div>

        <div className="contact-container">
          {/* Contact Info Cards */}
          <div className="contact-info-section">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="info-card">
                  <div className="info-icon"  >
                    <Icon size={32} style={{ color: "#ffffff" }} />
                  </div>
                  <h3>{info.title}</h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="info-detail">
                      {detail}
                    </p>
                  ))}
                  <p className="info-subtext">{info.subtext}</p>
                </div>
              );
            })}
          </div>

          {/* Contact Form & FAQ */}
          <div className="contact-content">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Gửi tin nhắn cho chúng tôi</h2>
              <p className="form-description">
                Điền thông tin bên dưới và chúng tôi sẽ phản hồi trong thời gian
                sớm nhất
              </p>

              {success && (
                <div className="success-message">
                  <Send size={20} />
                  <span>
                    Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ với bạn sớm.
                  </span>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Nguyễn Văn A"
                      required
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="example@email.com"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="0912345678"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Chủ đề *</label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                      }
                      required
                      className="input-field"
                    >
                      <option value="">Chọn chủ đề</option>
                      <option value="booking">Đặt vé</option>
                      <option value="checkin">Check-in</option>
                      <option value="baggage">Hành lý</option>
                      <option value="refund">Hoàn tiền</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Nội dung *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    placeholder="Nhập nội dung tin nhắn..."
                    rows={6}
                    required
                    className="input-field textarea-field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-submit">
                  <Send size={20} />
                  {loading ? "Đang gửi..." : "Gửi tin nhắn"}
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
              <h2>Câu hỏi thường gặp</h2>
              <p className="faq-description">
                Tìm câu trả lời nhanh chóng cho những câu hỏi phổ biến
              </p>

              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className={`faq-item ${
                      activeAccordion === index ? "active" : ""
                    }`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => toggleAccordion(index)}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        size={20}
                        className={`faq-icon ${
                          activeAccordion === index ? "rotated" : ""
                        }`}
                      />
                    </button>
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <h2>Vị trí văn phòng</h2>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0969868057487!2d105.81632831540152!3d21.028810993007957!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab8ea2a6bc89%3A0x5c800d1b5b9e5e9c!2zMjQzIEzDqiBUaOG6v25nIEtp4buHdCwgVGh1eSBLaHXDqiwgVMOieSBI4buTLCBIw6AgTuG7mWksIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vietjet Office Location"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
