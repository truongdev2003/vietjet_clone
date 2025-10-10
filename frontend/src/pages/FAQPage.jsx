import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/FAQ.css';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      category: 'Đặt vé & Thanh toán',
      questions: [
        {
          q: 'Làm thế nào để đặt vé máy bay?',
          a: 'Bạn có thể đặt vé trực tuyến qua website của chúng tôi bằng cách: (1) Chọn điểm đi và điểm đến, (2) Chọn ngày bay, (3) Chọn chuyến bay phù hợp, (4) Điền thông tin hành khách, (5) Thanh toán và nhận vé điện tử qua email.',
        },
        {
          q: 'Tôi có thể thanh toán bằng những phương thức nào?',
          a: 'Chúng tôi chấp nhận nhiều phương thức thanh toán: Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB), Chuyển khoản ngân hàng, Ví điện tử (MoMo, ZaloPay, VNPay), và Thanh toán tại quầy.',
        },
        {
          q: 'Tôi có nhận được xác nhận đặt vé không?',
          a: 'Sau khi thanh toán thành công, bạn sẽ nhận được email xác nhận đặt vé kèm theo mã booking và vé điện tử. Vui lòng kiểm tra cả hộp thư spam nếu không thấy email.',
        },
        {
          q: 'Mã booking là gì và dùng để làm gì?',
          a: 'Mã booking là mã 6-8 ký tự duy nhất để xác định đặt chỗ của bạn. Bạn cần mã này để check-in online, thay đổi thông tin vé, hoặc liên hệ với bộ phận hỗ trợ.',
        },
      ],
    },
    {
      category: 'Hành lý',
      questions: [
        {
          q: 'Quy định về hành lý xách tay?',
          a: 'Hành lý xách tay tối đa 7kg với kích thước không quá 56cm x 36cm x 23cm. Bạn được mang 1 túi xách tay và 1 vật dụng cá nhân (túi xách, laptop).',
        },
        {
          q: 'Quy định về hành lý ký gửi?',
          a: 'Hành lý Economy: 20kg miễn phí. Hành lý Business: 30kg miễn phí. Hành lý vượt quá sẽ bị tính phí theo quy định. Kích thước tối đa: Tổng 3 chiều không quá 158cm.',
        },
        {
          q: 'Tôi có thể mua thêm hành lý không?',
          a: 'Có, bạn có thể mua thêm hành lý khi đặt vé hoặc sau khi đã đặt vé thông qua mục "Quản lý booking". Giá mua trước sẽ rẻ hơn mua tại sân bay.',
        },
        {
          q: 'Những vật phẩm nào không được phép mang lên máy bay?',
          a: 'Không được mang: Chất lỏng >100ml trong hành lý xách tay, vật dụng sắc nhọn, chất dễ cháy nổ, pin lithium rời >160Wh, và các vật phẩm nguy hiểm khác theo quy định ICAO.',
        },
      ],
    },
    {
      category: 'Check-in & Lên máy bay',
      questions: [
        {
          q: 'Khi nào tôi có thể check-in online?',
          a: 'Check-in online mở từ 24 giờ đến 1 giờ trước giờ khởi hành. Sau khi check-in, bạn sẽ nhận được thẻ lên máy bay điện tử qua email hoặc có thể tải xuống từ website.',
        },
        {
          q: 'Tôi cần có mặt tại sân bay trước bao lâu?',
          a: 'Bay nội địa: Có mặt trước 2 tiếng để làm thủ tục và gửi hành lý. Bay quốc tế: Có mặt trước 3 tiếng. Cửa lên máy bay đóng 15-20 phút trước giờ khởi hành.',
        },
        {
          q: 'Giấy tờ cần thiết khi làm thủ tục?',
          a: 'Bay nội địa: CMND/CCCD/Hộ chiếu còn hạn. Bay quốc tế: Hộ chiếu còn hạn ít nhất 6 tháng và visa (nếu cần). Trẻ em dưới 14 tuổi cần giấy khai sinh.',
        },
        {
          q: 'Tôi có thể chọn chỗ ngồi không?',
          a: 'Có, bạn có thể chọn chỗ ngồi khi đặt vé hoặc sau đó thông qua "Quản lý booking". Một số ghế đặc biệt (ghế thoát hiểm, ghế hàng đầu) có thể phụ thu thêm.',
        },
      ],
    },
    {
      category: 'Thay đổi & Hoàn hủy',
      questions: [
        {
          q: 'Tôi có thể thay đổi thông tin vé không?',
          a: 'Có, bạn có thể thay đổi ngày bay, giờ bay, và một số thông tin khác. Phí thay đổi và chênh lệch giá vé (nếu có) sẽ được áp dụng theo hạng vé bạn đã mua.',
        },
        {
          q: 'Chính sách hoàn vé như thế nào?',
          a: 'Tùy theo hạng vé: Vé Eco: Hoàn 50% giá vé (trừ phí). Vé SkyBoss: Hoàn 70% giá vé. Vé Deluxe: Hoàn 90% giá vé. Phải hoàn trước 24h so với giờ bay.',
        },
        {
          q: 'Tôi có thể thay đổi tên hành khách không?',
          a: 'Không, tên hành khách không thể thay đổi sau khi đã xuất vé. Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất đặt vé. Trường hợp sai sót, bạn cần hủy và đặt vé mới.',
        },
        {
          q: 'Nếu chuyến bay bị hủy/delay thì sao?',
          a: 'Nếu do hãng bay: Được đổi vé miễn phí hoặc hoàn toàn bộ tiền vé. Nếu delay >3h, được hỗ trợ bữa ăn/khách sạn. Bạn sẽ được thông báo qua SMS/email.',
        },
      ],
    },
    {
      category: 'Dịch vụ đặc biệt',
      questions: [
        {
          q: 'Trẻ em có thể bay một mình không?',
          a: 'Trẻ em từ 6-11 tuổi có thể bay một mình với dịch vụ "Unaccompanied Minor" (UM). Cần đăng ký trước và có phụ thu. Trẻ dưới 6 tuổi phải có người lớn đi cùng.',
        },
        {
          q: 'Quy định về vận chuyển vật nuôi?',
          a: 'Vật nuôi nhỏ (<8kg bao gồm lồng) có thể ở cabin. Vật nuôi lớn phải ở khoang hành lý. Cần giấy tờ: Giấy chứng nhận sức khỏe, giấy tiêm phòng. Đăng ký trước ít nhất 48h.',
        },
        {
          q: 'Tôi cần hỗ trợ y tế trên chuyến bay?',
          a: 'Vui lòng thông báo trước khi đặt vé về tình trạng sức khỏe và nhu cầu hỗ trợ. Cần giấy chứng nhận từ bác sĩ (MEDIF) nếu có vấn đề sức khỏe nghiêm trọng. Liên hệ: 1900 1886.',
        },
        {
          q: 'Có dịch vụ suất ăn đặc biệt không?',
          a: 'Có, chúng tôi cung cấp suất ăn: Chay, Halal, Kosher, không gluten, ít đường. Vui lòng đặt trước ít nhất 24 giờ thông qua "Quản lý booking" hoặc hotline.',
        },
      ],
    },
    {
      category: 'Khác',
      questions: [
        {
          q: 'Làm sao để tham gia chương trình khách hàng thường xuyên?',
          a: 'Đăng ký miễn phí trên website. Tích lũy điểm qua mỗi chuyến bay và đổi thành vé miễn phí, nâng hạng, hoặc dịch vụ khác. Thành viên được ưu tiên check-in và lên máy bay.',
        },
        {
          q: 'Tôi có thể mua bảo hiểm du lịch không?',
          a: 'Có, bạn có thể mua bảo hiểm du lịch khi đặt vé. Bảo hiểm bao gồm: Hủy chuyến, delay, mất hành lý, tai nạn, và chi phí y tế. Giá từ 50,000 VNĐ/người/chuyến.',
        },
        {
          q: 'Chế độ ưu đãi cho học sinh, sinh viên?',
          a: 'Có chương trình giảm giá 10-20% cho học sinh, sinh viên khi xuất trình thẻ hợp lệ. Áp dụng cho một số chuyến bay nhất định. Kiểm tra chi tiết trên trang "Khuyến mãi".',
        },
        {
          q: 'Làm sao để nhận thông báo về khuyến mãi?',
          a: 'Đăng ký nhận email hoặc SMS tại mục "Newsletter" trên website. Follow fanpage và kênh social media của chúng tôi để cập nhật các chương trình khuyến mãi mới nhất.',
        },
      ],
    },
  ];

  const toggleAccordion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <HelpCircle size={40} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Câu hỏi thường gặp (FAQ)
            </h1>
            <p className="text-gray-600 text-lg">
              Tìm câu trả lời cho các thắc mắc phổ biến của bạn
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqData.map((category, catIndex) => (
              <div key={catIndex} className="faq-category">
                <h2 className="category-title">{category.category}</h2>
                <div className="faq-list">
                  {category.questions.map((item, qIndex) => {
                    const index = `${catIndex}-${qIndex}`;
                    const isOpen = openIndex === index;

                    return (
                      <div key={qIndex} className="faq-item">
                        <button
                          onClick={() => toggleAccordion(catIndex, qIndex)}
                          className="faq-question"
                        >
                          <span className="question-text">{item.q}</span>
                          <span className="toggle-icon">
                            {isOpen ? (
                              <ChevronUp size={24} />
                            ) : (
                              <ChevronDown size={24} />
                            )}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="faq-answer">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="contact-support">
            <h3 className="support-title">Không tìm thấy câu trả lời?</h3>
            <p className="support-text">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7
            </p>
            <div className="support-buttons">
              <a href="/contact" className="btn-primary">
                Liên hệ hỗ trợ
              </a>
              <a href="tel:1900-1886" className="btn-secondary">
                Gọi: 1900 1886
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
