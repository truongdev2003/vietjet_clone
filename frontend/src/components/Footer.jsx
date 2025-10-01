import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: #2d3436;
  color: white;
  padding: 40px 20px 20px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
`;

const FooterSection = styled.div``;

const SectionTitle = styled.h3`
  color: #00b894;
  margin-bottom: 15px;
  font-size: 18px;
`;

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FooterLink = styled.li`
  margin-bottom: 8px;
  
  a {
    color: #b2bec3;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #00b894;
    }
  }
`;

const SocialMedia = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 15px;
`;

const SocialIcon = styled.a`
  color: #b2bec3;
  transition: color 0.3s ease;
  
  &:hover {
    color: #00b894;
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #636e72;
  padding-top: 20px;
  text-align: center;
  color: #b2bec3;
  font-size: 14px;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterGrid>
          <FooterSection>
            <SectionTitle>Dịch vụ</SectionTitle>
            <FooterLinks>
              <FooterLink><Link to="/booking">Đặt vé máy bay</Link></FooterLink>
              <FooterLink><Link to="/checkin">Check-in online</Link></FooterLink>
              <FooterLink><Link to="/manage">Quản lý đặt chỗ</Link></FooterLink>
              <FooterLink><Link to="/flight-status">Tình trạng chuyến bay</Link></FooterLink>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <SectionTitle>Thông tin</SectionTitle>
            <FooterLinks>
              <FooterLink><Link to="/about">Về chúng tôi</Link></FooterLink>
              <FooterLink><Link to="/news">Tin tức</Link></FooterLink>
              <FooterLink><Link to="/careers">Tuyển dụng</Link></FooterLink>
              <FooterLink><Link to="/investor">Nhà đầu tư</Link></FooterLink>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <SectionTitle>Hỗ trợ</SectionTitle>
            <FooterLinks>
              <FooterLink><Link to="/contact">Liên hệ</Link></FooterLink>
              <FooterLink><Link to="/faq">Câu hỏi thường gặp</Link></FooterLink>
              <FooterLink><Link to="/terms">Điều khoản</Link></FooterLink>
              <FooterLink><Link to="/privacy">Chính sách bảo mật</Link></FooterLink>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <SectionTitle>Kết nối với chúng tôi</SectionTitle>
            <p style={{ color: '#b2bec3', marginBottom: '15px' }}>
              Theo dõi chúng tôi để cập nhật thông tin mới nhất
            </p>
            <SocialMedia>
              <SocialIcon href="#" target="_blank">
                <Facebook size={24} />
              </SocialIcon>
              <SocialIcon href="#" target="_blank">
                <Instagram size={24} />
              </SocialIcon>
              <SocialIcon href="#" target="_blank">
                <Youtube size={24} />
              </SocialIcon>
              <SocialIcon href="#" target="_blank">
                <Twitter size={24} />
              </SocialIcon>
            </SocialMedia>
          </FooterSection>
        </FooterGrid>
        
        <FooterBottom>
          <p>&copy; 2025 VietJet Air Clone. Đây là website học tập, không phải website chính thức.</p>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;