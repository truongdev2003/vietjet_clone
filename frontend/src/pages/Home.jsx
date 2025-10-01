import styled from 'styled-components';
import FlightSearchForm from '../components/FlightSearchForm';
import Footer from '../components/Footer';
import Header from '../components/Header';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, #00b894, #00a085);
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white" opacity="0.1"><polygon points="1000,100 1000,0 0,100"/></svg>');
  background-size: cover;
  padding: 60px 20px 120px;
  color: white;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 40px 20px;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin: 60px 0;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00b894, #00a085);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 2rem;
`;

const FeatureTitle = styled.h3`
  color: #2d3436;
  margin-bottom: 15px;
  font-size: 1.3rem;
`;

const FeatureDescription = styled.p`
  color: #636e72;
  line-height: 1.6;
`;

const PromotionSection = styled.section`
  background: linear-gradient(135deg, #fd79a8, #e84393);
  color: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  margin: 40px 0;
`;

const PromotionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 15px;
`;

const PromotionText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 25px;
  opacity: 0.9;
`;

const PromotionButton = styled.button`
  background: white;
  color: #e84393;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const Home = () => {
  return (
    <PageContainer>
      <Header />
      
      <HeroSection>
        <HeroContent>
          <HeroTitle>Khám phá thế giới cùng VietJet</HeroTitle>
          <HeroSubtitle>
            Đặt vé máy bay giá rẻ, dịch vụ tốt nhất cho chuyến đi của bạn
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <FlightSearchForm />

      <MainContent>
        <ContentContainer>
          <FeaturesSection>
            <FeatureCard>
              <FeatureIcon>✈️</FeatureIcon>
              <FeatureTitle>Giá vé tốt nhất</FeatureTitle>
              <FeatureDescription>
                Cam kết mang đến giá vé máy bay rẻ nhất với chất lượng dịch vụ hàng đầu
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>🌍</FeatureIcon>
              <FeatureTitle>Mạng lưới rộng khắp</FeatureTitle>
              <FeatureDescription>
                Kết nối hơn 100 điểm đến trong nước và quốc tế với lịch bay thuận tiện
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>⚡</FeatureIcon>
              <FeatureTitle>Đặt vé nhanh chóng</FeatureTitle>
              <FeatureDescription>
                Hệ thống đặt vé trực tuyến hiện đại, thanh toán an toàn chỉ trong vài phút
              </FeatureDescription>
            </FeatureCard>
          </FeaturesSection>

          <PromotionSection>
            <PromotionTitle>🎉 Khuyến mãi đặc biệt!</PromotionTitle>
            <PromotionText>
              Giảm đến 50% cho tất cả các tuyến bay nội địa. Đặt ngay hôm nay!
            </PromotionText>
            <PromotionButton>Xem chi tiết</PromotionButton>
          </PromotionSection>
        </ContentContainer>
      </MainContent>

      <Footer />
    </PageContainer>
  );
};

export default Home;