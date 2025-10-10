import { Shield } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/Legal.css';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="legal-header">
            <div className="legal-icon">
              <Shield size={40} />
            </div>
            <h1 className="legal-title">Chính sách bảo mật</h1>
            <p className="legal-subtitle">
              Cập nhật lần cuối: 08/10/2025
            </p>
          </div>

          {/* Content */}
          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Giới thiệu</h2>
              <p>
                VietJet Air cam kết bảo vệ quyền riêng tư và bảo mật thông tin cá nhân của quý khách.
                Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Thông tin chúng tôi thu thập</h2>
              
              <h3>2.1 Thông tin cá nhân</h3>
              <ul>
                <li>Họ và tên đầy đủ</li>
                <li>Ngày sinh, giới tính</li>
                <li>Số điện thoại, địa chỉ email</li>
                <li>Địa chỉ liên hệ</li>
                <li>Số CMND/CCCD/Hộ chiếu</li>
                <li>Thông tin thanh toán (số thẻ được mã hóa)</li>
              </ul>

              <h3>2.2 Thông tin chuyến bay</h3>
              <ul>
                <li>Lịch sử đặt vé và chuyến bay</li>
                <li>Sở thích chỗ ngồi, suất ăn</li>
                <li>Yêu cầu đặc biệt (hỗ trợ y tế, wheelchair, v.v.)</li>
                <li>Thông tin hành lý</li>
              </ul>

              <h3>2.3 Thông tin kỹ thuật</h3>
              <ul>
                <li>Địa chỉ IP</li>
                <li>Loại trình duyệt và thiết bị</li>
                <li>Cookie và dữ liệu phiên</li>
                <li>Lịch sử truy cập website</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Mục đích sử dụng thông tin</h2>
              <p>Chúng tôi sử dụng thông tin của bạn để:</p>
              <ul>
                <li><strong>Cung cấp dịch vụ:</strong> Xử lý booking, check-in, vận chuyển hành khách</li>
                <li><strong>Giao tiếp:</strong> Gửi xác nhận booking, thông báo chuyến bay, cập nhật quan trọng</li>
                <li><strong>Cải thiện dịch vụ:</strong> Phân tích hành vi người dùng, nâng cao trải nghiệm</li>
                <li><strong>Marketing:</strong> Gửi khuyến mãi, chương trình ưu đãi (chỉ khi có sự đồng ý)</li>
                <li><strong>Bảo mật:</strong> Phát hiện và ngăn chặn gian lận, đảm bảo an toàn</li>
                <li><strong>Tuân thủ pháp luật:</strong> Đáp ứng yêu cầu của cơ quan có thẩm quyền</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Chia sẻ thông tin</h2>
              <p>Chúng tôi chỉ chia sẻ thông tin của bạn với:</p>
              
              <h3>4.1 Đối tác dịch vụ</h3>
              <ul>
                <li>Công ty xử lý thanh toán</li>
                <li>Nhà cung cấp dịch vụ công nghệ</li>
                <li>Đối tác logistics và hành lý</li>
                <li>Đối tác khách sạn, xe đưa đón (nếu đặt combo)</li>
              </ul>

              <h3>4.2 Cơ quan nhà nước</h3>
              <p>
                Tuân thủ yêu cầu pháp lý của cơ quan hải quan, an ninh, thuế và các cơ quan có thẩm quyền khác.
              </p>

              <h3>4.3 Các trường hợp khác</h3>
              <ul>
                <li>Bảo vệ quyền lợi và an toàn của VietJet Air và khách hàng</li>
                <li>Trong trường hợp sáp nhập, mua lại công ty</li>
                <li>Với sự đồng ý rõ ràng của bạn</li>
              </ul>

              <p className="highlight-text">
                ⚠️ Chúng tôi KHÔNG bán thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Bảo mật thông tin</h2>
              <p>Chúng tôi áp dụng các biện pháp bảo mật:</p>
              
              <h3>5.1 Bảo mật kỹ thuật</h3>
              <ul>
                <li><strong>Mã hóa SSL/TLS:</strong> Bảo vệ dữ liệu truyền tải</li>
                <li><strong>Firewall:</strong> Ngăn chặn truy cập trái phép</li>
                <li><strong>Mã hóa dữ liệu:</strong> Thông tin nhạy cảm được mã hóa lưu trữ</li>
                <li><strong>Xác thực đa yếu tố:</strong> Cho tài khoản người dùng</li>
              </ul>

              <h3>5.2 Bảo mật vật lý</h3>
              <ul>
                <li>Server đặt tại trung tâm dữ liệu an toàn</li>
                <li>Kiểm soát truy cập vật lý nghiêm ngặt</li>
                <li>Backup dữ liệu định kỳ</li>
              </ul>

              <h3>5.3 Bảo mật con người</h3>
              <ul>
                <li>Đào tạo nhân viên về bảo mật thông tin</li>
                <li>Giới hạn quyền truy cập dựa trên vai trò</li>
                <li>Thỏa thuận bảo mật với nhân viên và đối tác</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>6. Cookie và theo dõi</h2>
              <p>
                Website sử dụng cookie để cải thiện trải nghiệm người dùng. Cookie là tệp văn bản nhỏ
                được lưu trên thiết bị của bạn.
              </p>

              <h3>6.1 Loại cookie chúng tôi sử dụng</h3>
              <ul>
                <li><strong>Cookie cần thiết:</strong> Đảm bảo website hoạt động (không thể tắt)</li>
                <li><strong>Cookie chức năng:</strong> Ghi nhớ lựa chọn của bạn (ngôn ngữ, tìm kiếm)</li>
                <li><strong>Cookie phân tích:</strong> Theo dõi cách bạn sử dụng website</li>
                <li><strong>Cookie marketing:</strong> Hiển thị quảng cáo phù hợp (có thể tắt)</li>
              </ul>

              <h3>6.2 Quản lý cookie</h3>
              <p>
                Bạn có thể quản lý cookie qua cài đặt trình duyệt. Tuy nhiên, việc tắt cookie có thể
                ảnh hưởng đến một số tính năng của website.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Quyền của bạn</h2>
              <p>Bạn có các quyền sau đối với thông tin cá nhân:</p>

              <h3>7.1 Quyền truy cập</h3>
              <p>Yêu cầu xem thông tin cá nhân mà chúng tôi đang lưu trữ về bạn.</p>

              <h3>7.2 Quyền sửa đổi</h3>
              <p>Yêu cầu cập nhật hoặc sửa thông tin không chính xác.</p>

              <h3>7.3 Quyền xóa</h3>
              <p>
                Yêu cầu xóa thông tin cá nhân (trừ khi chúng tôi có nghĩa vụ pháp lý phải lưu trữ).
              </p>

              <h3>7.4 Quyền hạn chế xử lý</h3>
              <p>Yêu cầu giới hạn cách chúng tôi sử dụng thông tin của bạn.</p>

              <h3>7.5 Quyền từ chối marketing</h3>
              <p>Từ chối nhận email marketing bất cứ lúc nào qua link "Unsubscribe".</p>

              <h3>7.6 Quyền di chuyển dữ liệu</h3>
              <p>Yêu cầu chúng tôi chuyển thông tin của bạn cho bên khác.</p>

              <p className="highlight-text">
                📧 Để thực hiện các quyền trên, vui lòng liên hệ: privacy@vietjetair.com
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Lưu trữ thông tin</h2>
              <p>
                Chúng tôi lưu trữ thông tin của bạn trong thời gian cần thiết để:
              </p>
              <ul>
                <li>Cung cấp dịch vụ cho bạn</li>
                <li>Tuân thủ nghĩa vụ pháp lý (tối thiểu 7 năm cho hồ sơ tài chính)</li>
                <li>Giải quyết tranh chấp</li>
                <li>Ngăn chặn gian lận</li>
              </ul>
              <p>
                Sau thời gian này, thông tin sẽ được xóa hoặc ẩn danh hóa một cách an toàn.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Quyền riêng tư trẻ em</h2>
              <p>
                Website không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin
                của trẻ em mà không có sự đồng ý của cha mẹ. Nếu bạn tin rằng chúng tôi đã vô tình
                thu thập thông tin của trẻ em, vui lòng liên hệ ngay.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Chuyển thông tin ra nước ngoài</h2>
              <p>
                Trong một số trường hợp, thông tin của bạn có thể được chuyển và xử lý tại các quốc gia
                khác (ví dụ: server đặt tại Singapore). Chúng tôi đảm bảo rằng việc chuyển giao này tuân thủ
                các tiêu chuẩn bảo mật quốc tế.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Cập nhật chính sách</h2>
              <p>
                Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Các thay đổi quan trọng
                sẽ được thông báo qua email hoặc thông báo trên website. Ngày cập nhật cuối cùng sẽ được
                hiển thị ở đầu trang.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Liên hệ</h2>
              <p>
                Nếu bạn có câu hỏi hoặc thắc mắc về Chính sách bảo mật, vui lòng liên hệ:
              </p>
              <ul className="contact-list">
                <li>
                  <strong>Bộ phận Bảo mật Dữ liệu:</strong><br />
                  Email: privacy@vietjetair.com
                </li>
                <li>
                  <strong>Hotline:</strong> 1900 1886 (24/7)
                </li>
                <li>
                  <strong>Địa chỉ:</strong><br />
                  VietJet Air<br />
                  200 Nguyễn Sơn, Long Biên, Hà Nội, Việt Nam
                </li>
                <li>
                  <strong>Thời gian xử lý:</strong> Trong vòng 30 ngày kể từ khi nhận yêu cầu
                </li>
              </ul>
            </section>

            <div className="legal-footer">
              <p>
                Bằng việc sử dụng website và dịch vụ của chúng tôi, bạn đồng ý với Chính sách bảo mật này.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
