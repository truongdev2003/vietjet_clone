import { FileText } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/Legal.css';

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="legal-header">
            <div className="legal-icon">
              <FileText size={40} />
            </div>
            <h1 className="legal-title">Điều khoản sử dụng</h1>
            <p className="legal-subtitle">
              Cập nhật lần cuối: 08/10/2025
            </p>
          </div>

          {/* Content */}
          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Giới thiệu</h2>
              <p>
                Chào mừng bạn đến với VietJet Air. Bằng việc truy cập và sử dụng website của chúng tôi,
                bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản và điều kiện sử dụng sau đây.
                Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng
                dịch vụ của chúng tôi.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Định nghĩa</h2>
              <ul>
                <li><strong>Chúng tôi:</strong> VietJet Air - hãng hàng không cung cấp dịch vụ</li>
                <li><strong>Bạn/Hành khách:</strong> Người sử dụng dịch vụ của chúng tôi</li>
                <li><strong>Vé:</strong> Tài liệu xác nhận hợp đồng vận chuyển hàng không</li>
                <li><strong>Booking:</strong> Đặt chỗ trên chuyến bay</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Đặt vé và Thanh toán</h2>
              <h3>3.1 Quy trình đặt vé</h3>
              <p>
                Khi đặt vé qua website, bạn cần cung cấp thông tin chính xác và đầy đủ. Chúng tôi có quyền
                từ chối hoặc hủy đặt chỗ nếu phát hiện thông tin sai lệch.
              </p>
              
              <h3>3.2 Thanh toán</h3>
              <p>
                Tất cả các khoản thanh toán phải được thực hiện bằng VNĐ hoặc ngoại tệ theo tỷ giá quy đổi
                của chúng tôi. Giá vé đã bao gồm thuế và phí (trừ khi có ghi chú khác).
              </p>

              <h3>3.3 Xác nhận booking</h3>
              <p>
                Booking chỉ được xác nhận sau khi thanh toán thành công và bạn nhận được email xác nhận
                kèm mã booking. Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Thay đổi và Hoàn hủy</h2>
              <h3>4.1 Thay đổi vé</h3>
              <p>
                Bạn có thể thay đổi ngày bay, giờ bay tùy theo loại vé đã mua. Phí thay đổi và chênh lệch
                giá vé (nếu có) sẽ được áp dụng. Thay đổi phải được thực hiện ít nhất 3 giờ trước giờ bay.
              </p>

              <h3>4.2 Hoàn vé</h3>
              <ul>
                <li>Vé Eco: Hoàn 50% giá vé (trừ phí hành chính)</li>
                <li>Vé SkyBoss: Hoàn 70% giá vé</li>
                <li>Vé Deluxe: Hoàn 90% giá vé</li>
                <li>Vé khuyến mãi: Không được hoàn (trừ khi có quy định khác)</li>
              </ul>
              <p>Yêu cầu hoàn vé phải được gửi trước 24 giờ so với giờ khởi hành.</p>

              <h3>4.3 No-show (Không xuất hiện)</h3>
              <p>
                Nếu bạn không xuất hiện hoặc không thông báo hủy chuyến, vé sẽ bị hủy và không được hoàn tiền.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Hành lý</h2>
              <h3>5.1 Hành lý xách tay</h3>
              <p>
                Tối đa 7kg, kích thước 56cm x 36cm x 23cm. Mỗi hành khách được mang 1 túi xách tay và
                1 vật dụng cá nhân (túi xách, laptop).
              </p>

              <h3>5.2 Hành lý ký gửi</h3>
              <ul>
                <li>Economy: 20kg miễn phí</li>
                <li>Business: 30kg miễn phí</li>
                <li>Hành lý vượt quá: Phí theo quy định</li>
              </ul>

              <h3>5.3 Trách nhiệm</h3>
              <p>
                Chúng tôi không chịu trách nhiệm về hành lý bị mất, hư hỏng do lỗi đóng gói hoặc chứa
                vật phẩm cấm. Hành khách cần khai báo giá trị hành lý nếu {'>'}$100.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Check-in</h2>
              <p>
                Hành khách phải check-in trước giờ đóng quầy (thường là 40 phút trước giờ bay nội địa,
                50 phút bay quốc tế). Check-in online mở từ 24h đến 1h trước giờ bay.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Từ chối vận chuyển</h2>
              <p>Chúng tôi có quyền từ chối vận chuyển nếu:</p>
              <ul>
                <li>Hành khách không có giấy tờ hợp lệ</li>
                <li>Hành khách trong tình trạng say xỉn, gây rối</li>
                <li>Hành khách có vấn đề sức khỏe không phù hợp</li>
                <li>Hành lý chứa vật phẩm nguy hiểm</li>
                <li>Không tuân thủ quy định an toàn</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>8. Trách nhiệm giới hạn</h2>
              <p>
                Trách nhiệm của chúng tôi được giới hạn theo Công ước Montreal 1999 và luật hàng không Việt Nam:
              </p>
              <ul>
                <li>Tử vong/thương tích: Tối đa 128,821 SDR</li>
                <li>Hành lý ký gửi: Tối đa 1,288 SDR</li>
                <li>Hành lý xách tay: Tối đa 332 SDR</li>
                <li>Delay: Tối đa 5,346 SDR</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>9. Quyền sở hữu trí tuệ</h2>
              <p>
                Tất cả nội dung trên website (logo, hình ảnh, văn bản) thuộc quyền sở hữu của VietJet Air.
                Nghiêm cấm sao chép, sử dụng mà không có sự cho phép.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Bảo mật thông tin</h2>
              <p>
                Chúng tôi cam kết bảo mật thông tin cá nhân của bạn theo Chính sách bảo mật. Thông tin
                chỉ được sử dụng cho mục đích cung cấp dịch vụ và không chia sẻ cho bên thứ ba (trừ khi
                có yêu cầu pháp lý).
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Luật áp dụng</h2>
              <p>
                Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được giải
                quyết tại Tòa án có thẩm quyền tại Việt Nam.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Liên hệ</h2>
              <p>
                Nếu có thắc mắc về các điều khoản này, vui lòng liên hệ:
              </p>
              <ul>
                <li><strong>Hotline:</strong> 1900 1886 (24/7)</li>
                <li><strong>Email:</strong> support@vietjetair.com</li>
                <li><strong>Địa chỉ:</strong> 200 Nguyễn Sơn, Long Biên, Hà Nội</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
