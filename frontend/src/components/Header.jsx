import { Globe, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #00b894, #00a085);
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  height: 70px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: white;
  font-weight: bold;
  font-size: 24px;
  
  &:hover {
    color: #e8f8f5;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e8f8f5;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const LanguageSelector = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 8px;
  border-radius: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const UserButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">
          VietJet Air
        </Logo>
        
        <NavLinks>
          <NavLink to="/booking">Đặt vé</NavLink>
          <NavLink to="/checkin">Check-in</NavLink>
          <NavLink to="/manage">Quản lý đặt chỗ</NavLink>
          <NavLink to="/promotions">Khuyến mãi</NavLink>
        </NavLinks>
        
        <RightSection>
          <LanguageSelector>
            <Globe size={18} />
            VI
          </LanguageSelector>
          
          <UserButton>
            <User size={18} />
            Đăng nhập
          </UserButton>
          
          <MobileMenuButton>
            <Menu size={24} />
          </MobileMenuButton>
        </RightSection>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;