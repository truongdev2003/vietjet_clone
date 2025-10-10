import { Award, Globe, Heart, Plane, Shield, Users } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/About.css';

const AboutPage = () => {
  const stats = [
    { icon: Plane, value: '200+', label: 'Chuyến bay/ngày' },
    { icon: Users, value: '50M+', label: 'Hành khách/năm' },
    { icon: Globe, value: '100+', label: 'Điểm đến' },
    { icon: Award, value: '15+', label: 'Giải thưởng' }
  ];

  const values = [
    {
      icon: Shield,
      title: 'An toàn tuyệt đối',
      description: 'Cam kết đặt an toàn hành khách lên hàng đầu với đội ngũ phi công giàu kinh nghiệm và máy bay hiện đại.'
    },
    {
      icon: Heart,
      title: 'Dịch vụ tận tâm',
      description: 'Đội ngũ tiếp viên thân thiện, chuyên nghiệp, luôn sẵn sàng mang đến trải nghiệm bay tuyệt vời nhất.'
    },
    {
      icon: Award,
      title: 'Giá cả cạnh tranh',
      description: 'Cung cấp vé máy bay với mức giá hợp lý nhất, nhiều ưu đãi và chương trình khuyến mãi hấp dẫn.'
    }
  ];

  const fleet = [
    {
      model: 'Airbus A321neo',
      quantity: 50,
      seats: 240,
      range: '6,850 km'
    },
    {
      model: 'Airbus A320',
      quantity: 30,
      seats: 180,
      range: '5,700 km'
    },
    {
      model: 'Boeing 737 MAX',
      quantity: 20,
      seats: 189,
      range: '6,570 km'
    }
  ];

  const milestones = [
    { year: '2007', event: 'Thành lập hãng hàng không VietJet' },
    { year: '2011', event: 'Chuyến bay thương mại đầu tiên' },
    { year: '2015', event: 'Mở rộng mạng bay quốc tế' },
    { year: '2018', event: 'Đạt 50 triệu hành khách' },
    { year: '2020', event: 'Ra mắt đội bay A321neo' },
    { year: '2025', event: 'Hơn 200 chuyến bay mỗi ngày' }
  ];

  return (
    <>
      <Header />
      <div className="about-page">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="animate-fade-in">Về VietJet Air</h1>
            <p className="animate-fade-in-delay">
              Hãng hàng không hiện đại, an toàn và thân thiện hàng đầu Việt Nam
            </p>
          </div>
        </div>

        <div className="about-container">
          {/* Stats Section */}
          <div className="stats-section">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="stat-icon">
                    <Icon size={36} />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Story Section */}
          <div className="story-section">
            <div className="story-content">
              <h2>Câu chuyện của chúng tôi</h2>
              <p className="story-intro">
                VietJet Air được thành lập vào năm 2007 với sứ mệnh mang đến dịch vụ hàng không 
                chất lượng cao với mức giá hợp lý cho mọi người dân Việt Nam.
              </p>
              <p>
                Từ những chuyến bay đầu tiên, chúng tôi đã không ngừng phát triển và mở rộng, 
                trở thành một trong những hãng hàng không hàng đầu khu vực Đông Nam Á. Với đội bay 
                hiện đại, mạng lưới đường bay rộng khắp và dịch vụ chuyên nghiệp, VietJet tự hào 
                đã phục vụ hơn 50 triệu hành khách mỗi năm.
              </p>
              <p>
                Chúng tôi cam kết không ngừng đổi mới, nâng cao chất lượng dịch vụ và mang đến 
                những trải nghiệm bay tuyệt vời nhất cho hành khách. An toàn bay luôn là ưu tiên 
                hàng đầu trong mọi hoạt động của chúng tôi.
              </p>
            </div>
            <div className="story-image">
              <div className="image-placeholder">
                <Plane size={120} />
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="values-section">
            <h2>Giá trị cốt lõi</h2>
            <p className="section-subtitle">
              Những giá trị định hình nên VietJet Air
            </p>
            <div className="values-grid">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="value-card">
                    <div className="value-icon">
                      <Icon size={40} />
                    </div>
                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fleet Section */}
          <div className="fleet-section">
            <h2>Đội bay hiện đại</h2>
            <p className="section-subtitle">
              Máy bay thế hệ mới, tiết kiệm nhiên liệu và thân thiện với môi trường
            </p>
            <div className="fleet-grid">
              {fleet.map((aircraft, index) => (
                <div key={index} className="fleet-card">
                  <div className="fleet-icon">
                    <Plane size={48} />
                  </div>
                  <h3>{aircraft.model}</h3>
                  <div className="fleet-details">
                    <div className="fleet-detail">
                      <span className="detail-label">Số lượng:</span>
                      <span className="detail-value">{aircraft.quantity} máy bay</span>
                    </div>
                    <div className="fleet-detail">
                      <span className="detail-label">Sức chứa:</span>
                      <span className="detail-value">{aircraft.seats} ghế</span>
                    </div>
                    <div className="fleet-detail">
                      <span className="detail-label">Tầm bay:</span>
                      <span className="detail-value">{aircraft.range}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="timeline-section">
            <h2>Hành trình phát triển</h2>
            <p className="section-subtitle">
              Những cột mốc quan trọng trong lịch sử VietJet Air
            </p>
            <div className="timeline">
              {milestones.map((milestone, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-year">{milestone.year}</div>
                    <div className="timeline-event">{milestone.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <h2>Sẵn sàng bay cùng VietJet?</h2>
            <p>Đặt vé ngay hôm nay và trải nghiệm dịch vụ hàng không tuyệt vời</p>
            <button className="btn-cta" onClick={() => window.location.href = '/'}>
              Đặt vé ngay
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
