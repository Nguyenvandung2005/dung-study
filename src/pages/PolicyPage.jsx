import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

const PRIMARY = "#ff6b81";

// ── Danh sách các trang điều khoản ──
const POLICIES = [
  { key: "dieu-khoan-su-dung", icon: "📋", label: "Điều khoản sử dụng" },
  { key: "chinh-sach-bao-mat", icon: "🔒", label: "Chính sách bảo mật" },
  { key: "chinh-sach-doi-tra", icon: "🔄", label: "Chính sách đổi trả" },
  { key: "chinh-sach-van-chuyen", icon: "🚚", label: "Chính sách vận chuyển" },
  { key: "dieu-kien-giao-dich-chung", icon: "🤝", label: "Điều kiện giao dịch chung" },
  { key: "chinh-sach-khuyen-mai", icon: "🎁", label: "Chính sách khuyến mãi" },
  { key: "chinh-sach-du-lieu-ca-nhan", icon: "👤", label: "Chính sách xử lý dữ liệu cá nhân" },
];

// ── Nội dung từng trang ──
const CONTENT = {
  "dieu-khoan-su-dung": {
    title: "Điều khoản sử dụng",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Giới thiệu",
        body: `Chào mừng bạn đến với PinkyCloud. Bằng việc truy cập và sử dụng website www.pinkycloud.vn, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện sử dụng sau đây.

Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.`,
      },
      {
        heading: "2. Quyền sở hữu trí tuệ",
        body: `Toàn bộ nội dung trên website này, bao gồm nhưng không giới hạn ở văn bản, hình ảnh, đồ họa, logo, biểu tượng, âm thanh, phần mềm và mã nguồn, đều thuộc quyền sở hữu của PinkyCloud hoặc các đối tác của chúng tôi.

Nghiêm cấm sao chép, phân phối, truyền tải, hiển thị, thực thi, tái tạo, xuất bản, cấp phép, tạo các tác phẩm phái sinh, chuyển nhượng hoặc bán bất kỳ thông tin nào thu được từ website này mà không có sự cho phép bằng văn bản của PinkyCloud.`,
      },
      {
        heading: "3. Trách nhiệm của người dùng",
        body: `Khi sử dụng website, bạn cam kết:
• Cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản.
• Bảo mật tài khoản và mật khẩu của mình.
• Không sử dụng website cho bất kỳ mục đích bất hợp pháp nào.
• Không đăng tải nội dung vi phạm pháp luật, xúc phạm, phân biệt đối xử.
• Không thực hiện các hành vi gian lận, lừa đảo.`,
      },
      {
        heading: "4. Giới hạn trách nhiệm",
        body: `PinkyCloud không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ của chúng tôi.

Chúng tôi không đảm bảo rằng website sẽ luôn hoạt động liên tục, không có lỗi hoặc virus.`,
      },
      {
        heading: "5. Thay đổi điều khoản",
        body: `PinkyCloud có quyền thay đổi, chỉnh sửa, bổ sung hoặc xóa bỏ bất kỳ phần nào của Điều khoản sử dụng này vào bất kỳ thời điểm nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải lên website.

Việc bạn tiếp tục sử dụng website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các thay đổi đó.`,
      },
      {
        heading: "6. Liên hệ",
        body: `Nếu bạn có bất kỳ câu hỏi nào về Điều khoản sử dụng này, vui lòng liên hệ với chúng tôi qua:
• Email: pinkycloudvietnam@gmail.com
• Hotline: 0909 123 456
• Địa chỉ: Số 57, đường Quang Trung, Quận Gò Vấp, TP. Hồ Chí Minh`,
      },
    ],
  },

  "chinh-sach-bao-mat": {
    title: "Chính sách bảo mật",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Thu thập thông tin",
        body: `PinkyCloud thu thập các thông tin sau khi bạn sử dụng dịch vụ:
• Thông tin cá nhân: Họ tên, địa chỉ email, số điện thoại, địa chỉ giao hàng.
• Thông tin giao dịch: Lịch sử mua hàng, phương thức thanh toán (không lưu thông tin thẻ).
• Thông tin kỹ thuật: Địa chỉ IP, loại trình duyệt, trang web giới thiệu, thời gian truy cập.
• Thông tin từ cookie: Giúp cải thiện trải nghiệm người dùng.`,
      },
      {
        heading: "2. Mục đích sử dụng thông tin",
        body: `Chúng tôi sử dụng thông tin thu thập được để:
• Xử lý đơn hàng và cung cấp dịch vụ khách hàng.
• Gửi thông báo về đơn hàng, sản phẩm mới và khuyến mãi (nếu bạn đồng ý).
• Cải thiện website và trải nghiệm người dùng.
• Phân tích xu hướng mua sắm để đưa ra đề xuất phù hợp.
• Tuân thủ các nghĩa vụ pháp lý.`,
      },
      {
        heading: "3. Bảo mật thông tin",
        body: `PinkyCloud cam kết bảo mật thông tin của bạn bằng các biện pháp sau:
• Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải.
• Lưu trữ mật khẩu dưới dạng hash (bcrypt).
• Hệ thống tường lửa và phát hiện xâm nhập.
• Kiểm tra bảo mật định kỳ.
• Giới hạn quyền truy cập dữ liệu cho nhân viên.`,
      },
      {
        heading: "4. Chia sẻ thông tin",
        body: `Chúng tôi KHÔNG bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại.

Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:
• Đối tác vận chuyển để thực hiện giao hàng.
• Cổng thanh toán để xử lý giao dịch.
• Cơ quan nhà nước khi có yêu cầu pháp lý.`,
      },
      {
        heading: "5. Quyền của người dùng",
        body: `Bạn có quyền:
• Truy cập và xem thông tin cá nhân của mình.
• Yêu cầu chỉnh sửa thông tin không chính xác.
• Yêu cầu xóa tài khoản và dữ liệu cá nhân.
• Từ chối nhận email marketing.
• Khiếu nại về cách xử lý dữ liệu của chúng tôi.

Để thực hiện các quyền này, liên hệ: pinkycloudvietnam@gmail.com`,
      },
      {
        heading: "6. Cookie",
        body: `Website sử dụng cookie để:
• Ghi nhớ giỏ hàng và phiên đăng nhập.
• Phân tích lưu lượng truy cập (Google Analytics).
• Cá nhân hóa nội dung hiển thị.

Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng của website có thể bị ảnh hưởng.`,
      },
    ],
  },

  "chinh-sach-doi-tra": {
    title: "Chính sách đổi trả",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Điều kiện đổi trả",
        body: `PinkyCloud chấp nhận đổi/trả sản phẩm trong các trường hợp sau:
• Sản phẩm bị lỗi do nhà sản xuất (bể, vỡ, rò rỉ, hỏng hóc).
• Sản phẩm không đúng với mô tả trên website.
• Sản phẩm giao nhầm (sai sản phẩm, sai màu, sai dung tích).
• Sản phẩm hết hạn sử dụng trước ngày giao hàng.`,
      },
      {
        heading: "2. Thời gian đổi trả",
        body: `• Đổi/trả trong vòng 30 ngày kể từ ngày nhận hàng.
• Riêng sản phẩm lỗi do vận chuyển: Phản ánh trong vòng 48 giờ kể từ khi nhận hàng.
• Sản phẩm điện tử (máy rung, máy massage): Bảo hành 6 tháng.

Lưu ý: Không áp dụng đổi trả với sản phẩm đã qua sử dụng, trừ trường hợp lỗi từ nhà sản xuất.`,
      },
      {
        heading: "3. Quy trình đổi trả",
        body: `Bước 1: Liên hệ hotline 0909 123 456 hoặc email pinkycloudvietnam@gmail.com để thông báo.
Bước 2: Cung cấp mã đơn hàng, hình ảnh/video sản phẩm lỗi.
Bước 3: Nhận xác nhận từ bộ phận CSKH trong vòng 24 giờ làm việc.
Bước 4: Gửi sản phẩm về địa chỉ: 57 Quang Trung, Gò Vấp, TP.HCM.
Bước 5: Nhận sản phẩm mới hoặc hoàn tiền trong vòng 3-5 ngày làm việc.`,
      },
      {
        heading: "4. Chi phí đổi trả",
        body: `• Lỗi do PinkyCloud: Chúng tôi chịu toàn bộ chi phí vận chuyển đổi/trả.
• Lỗi do khách hàng (đặt nhầm, không phù hợp): Khách hàng chịu phí ship chiều về.
• Hàng đổi sẽ được giao miễn phí.`,
      },
      {
        heading: "5. Hoàn tiền",
        body: `• Hoàn tiền 100% nếu sản phẩm không thể thay thế.
• Thời gian hoàn tiền: 3-7 ngày làm việc tùy phương thức thanh toán.
• Chuyển khoản ngân hàng: 1-3 ngày làm việc.
• Ví điện tử (MoMo, VNPay): 1-2 ngày làm việc.
• Tiền mặt (COD): Chuyển khoản trong vòng 3 ngày làm việc.`,
      },
      {
        heading: "6. Trường hợp không áp dụng",
        body: `Chính sách đổi trả KHÔNG áp dụng cho:
• Sản phẩm đã được sử dụng (trừ lỗi nhà sản xuất).
• Sản phẩm không còn nguyên tem, nhãn.
• Sản phẩm bị hư hỏng do người dùng (rơi vỡ, ngấm nước...).
• Sản phẩm khuyến mãi, quà tặng kèm.
• Yêu cầu đổi trả sau 30 ngày kể từ ngày nhận hàng.`,
      },
    ],
  },

  "chinh-sach-van-chuyen": {
    title: "Chính sách vận chuyển",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Phạm vi giao hàng",
        body: `PinkyCloud giao hàng toàn quốc 63 tỉnh thành Việt Nam.

Đặc biệt, chúng tôi có dịch vụ giao hàng nhanh 2H tại:
• TP. Hồ Chí Minh (nội thành)
• TP. Hà Nội (nội thành)

Các khu vực khác: Giao qua đơn vị vận chuyển đối tác.`,
      },
      {
        heading: "2. Thời gian giao hàng",
        body: `• Giao nhanh 2H: Nội thành TP.HCM và HN, đặt hàng trước 20:00.
• Nội thành các tỉnh: 1-2 ngày làm việc.
• Ngoại thành, vùng sâu xa: 3-5 ngày làm việc.
• Đảo, vùng đặc biệt: 5-7 ngày làm việc.

Thời gian trên tính từ khi đơn hàng được xác nhận (không tính ngày lễ, Tết).`,
      },
      {
        heading: "3. Phí vận chuyển",
        body: `• Miễn phí vận chuyển cho đơn hàng từ 249.000đ trở lên.
• Đơn hàng dưới 249.000đ: Phí 15.000đ - 30.000đ tùy khu vực.
• Giao hàng nhanh 2H: Miễn phí cho đơn từ 99.000đ (chương trình NowFree).
• Giao đến tỉnh thành xa: Phí tính theo thực tế của đơn vị vận chuyển.`,
      },
      {
        heading: "4. Đơn vị vận chuyển",
        body: `PinkyCloud hợp tác với các đơn vị vận chuyển uy tín:
• Giao hàng nhanh (GHN) — Nội thành và toàn quốc.
• Giao hàng tiết kiệm (GHTK) — Toàn quốc.
• J&T Express — Toàn quốc.
• NowShip — Giao nhanh 2H nội thành TP.HCM.
• ViettelPost — Vùng sâu, vùng xa.`,
      },
      {
        heading: "5. Theo dõi đơn hàng",
        body: `Sau khi đặt hàng thành công, bạn sẽ nhận được:
• SMS xác nhận đơn hàng.
• Email với mã vận đơn để theo dõi.
• Thông báo khi hàng được giao cho đơn vị vận chuyển.
• Thông báo khi hàng đến nơi.

Bạn cũng có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi" trên website.`,
      },
      {
        heading: "6. Lưu ý khi nhận hàng",
        body: `• Kiểm tra kỹ hàng hóa trước khi ký nhận.
• Từ chối nhận nếu phát hiện bao bì bị rách, móp méo bất thường.
• Chụp ảnh/quay video khi mở hàng nếu nghi ngờ hàng lỗi.
• Phản ánh sự cố trong vòng 48 giờ kể từ khi nhận hàng.`,
      },
    ],
  },

  "dieu-kien-giao-dich-chung": {
    title: "Điều kiện giao dịch chung",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Phạm vi áp dụng",
        body: `Điều kiện giao dịch chung này áp dụng cho tất cả các giao dịch mua bán hàng hóa giữa khách hàng và PinkyCloud thông qua website www.pinkycloud.vn, ứng dụng di động và các kênh bán hàng chính thức khác.`,
      },
      {
        heading: "2. Đặt hàng",
        body: `• Khách hàng đặt hàng qua website bằng cách thêm sản phẩm vào giỏ hàng và hoàn tất thanh toán.
• Đơn hàng được xác nhận sau khi PinkyCloud gửi email/SMS xác nhận.
• PinkyCloud có quyền từ chối đơn hàng trong trường hợp hết hàng, thông tin không hợp lệ hoặc nghi ngờ gian lận.
• Giá sản phẩm hiển thị trên website là giá cuối cùng, đã bao gồm VAT.`,
      },
      {
        heading: "3. Thanh toán",
        body: `Các phương thức thanh toán được chấp nhận:
• Thanh toán khi nhận hàng (COD).
• Chuyển khoản ngân hàng.
• Ví điện tử: MoMo, ZaloPay, VNPay.
• Thẻ tín dụng/ghi nợ quốc tế: Visa, Mastercard.

Thông tin thanh toán được mã hóa SSL và bảo mật tuyệt đối.`,
      },
      {
        heading: "4. Giá cả",
        body: `• Giá sản phẩm có thể thay đổi mà không cần báo trước.
• Giá áp dụng là giá tại thời điểm khách hàng hoàn tất đặt hàng.
• Trong trường hợp có sự nhầm lẫn về giá, PinkyCloud sẽ liên hệ khách hàng để xác nhận lại.
• Khuyến mãi và mã giảm giá chỉ áp dụng theo đúng điều kiện đã quy định.`,
      },
      {
        heading: "5. Hủy đơn hàng",
        body: `Khách hàng có thể hủy đơn hàng trong các trường hợp:
• Hủy trước khi đơn được xác nhận: Miễn phí, hoàn tiền 100%.
• Hủy sau khi đơn được xác nhận nhưng chưa giao: Liên hệ hotline ngay.
• Không nhận hàng khi giao: Khách hàng chịu phí vận chuyển 2 chiều.

PinkyCloud có thể hủy đơn nếu: Hết hàng, thông tin giao hàng không chính xác, hoặc phát hiện gian lận.`,
      },
      {
        heading: "6. Giải quyết tranh chấp",
        body: `• Mọi tranh chấp sẽ được giải quyết trước tiên thông qua thương lượng hòa giải.
• Nếu không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án có thẩm quyền tại TP. Hồ Chí Minh.
• Luật pháp Việt Nam điều chỉnh tất cả các giao dịch trên website này.`,
      },
    ],
  },

  "chinh-sach-khuyen-mai": {
    title: "Chính sách khuyến mãi",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Các hình thức khuyến mãi",
        body: `PinkyCloud triển khai các chương trình khuyến mãi sau:
• Giảm giá trực tiếp trên sản phẩm.
• Mã giảm giá (voucher/coupon).
• Mua X tặng Y.
• Flash sale theo khung giờ.
• Miễn phí vận chuyển.
• Tích điểm đổi quà.
• Quà tặng kèm theo đơn hàng.`,
      },
      {
        heading: "2. Điều kiện áp dụng",
        body: `• Mỗi chương trình khuyến mãi có thời hạn và điều kiện riêng.
• Một đơn hàng chỉ được áp dụng 1 mã giảm giá trừ khi có thông báo khác.
• Khuyến mãi không áp dụng kết hợp với nhau trừ khi được quy định rõ.
• PinkyCloud có quyền hủy đơn hàng nếu phát hiện lạm dụng khuyến mãi.`,
      },
      {
        heading: "3. Mã giảm giá",
        body: `• Mã giảm giá có thời hạn sử dụng, kiểm tra kỹ trước khi dùng.
• Mỗi mã chỉ được sử dụng một lần/tài khoản trừ khi có quy định khác.
• Mã giảm giá không có giá trị quy đổi thành tiền mặt.
• Trong trường hợp hoàn hàng, giá trị mã giảm giá sẽ không được hoàn lại.`,
      },
      {
        heading: "4. Chương trình thành viên",
        body: `PinkyCloud có 4 hạng thành viên:
• Đồng (0 - 1 triệu): Tích 1đ/1.000đ mua hàng.
• Bạc (1tr - 5tr): Tích 1.5đ/1.000đ + ưu đãi sinh nhật.
• Vàng (5tr - 20tr): Tích 2đ/1.000đ + quà tháng + ưu tiên CSKH.
• Kim cương (trên 20tr): Tích 3đ/1.000đ + miễn phí ship + early access.`,
      },
      {
        heading: "5. Thay đổi chương trình",
        body: `PinkyCloud có quyền thay đổi, kết thúc sớm hoặc điều chỉnh bất kỳ chương trình khuyến mãi nào mà không cần thông báo trước. Mọi thay đổi sẽ được cập nhật trên website.`,
      },
    ],
  },

  "chinh-sach-du-lieu-ca-nhan": {
    title: "Chính sách xử lý dữ liệu cá nhân",
    updated: "01/01/2024",
    sections: [
      {
        heading: "1. Cơ sở pháp lý",
        body: `Chính sách này được xây dựng theo quy định của:
• Luật An toàn thông tin mạng 2015.
• Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
• Thông tư 06/2022/TT-BTTTT về an toàn thông tin.

PinkyCloud cam kết xử lý dữ liệu cá nhân đúng quy định pháp luật Việt Nam.`,
      },
      {
        heading: "2. Loại dữ liệu thu thập",
        body: `Dữ liệu cá nhân cơ bản:
• Họ tên, ngày sinh, giới tính.
• Địa chỉ email, số điện thoại.
• Địa chỉ nhà/nơi làm việc.

Dữ liệu giao dịch:
• Lịch sử đặt hàng, thanh toán.
• Sản phẩm đã xem, yêu thích.

Dữ liệu kỹ thuật:
• IP, thiết bị truy cập, trình duyệt, cookies.`,
      },
      {
        heading: "3. Mục đích xử lý",
        body: `Chúng tôi xử lý dữ liệu cá nhân của bạn cho các mục đích sau:
• Cung cấp dịch vụ mua sắm và hỗ trợ khách hàng.
• Xác minh danh tính và ngăn chặn gian lận.
• Gửi thông báo đơn hàng và dịch vụ (bắt buộc).
• Gửi thông tin khuyến mãi (chỉ khi có sự đồng ý).
• Cải thiện sản phẩm và dịch vụ.
• Tuân thủ nghĩa vụ pháp lý.`,
      },
      {
        heading: "4. Thời gian lưu trữ",
        body: `• Dữ liệu tài khoản: Lưu trữ trong suốt thời gian tài khoản còn hoạt động.
• Sau khi xóa tài khoản: Xóa hoàn toàn trong vòng 30 ngày.
• Dữ liệu giao dịch: Lưu trữ 5 năm theo quy định pháp luật kế toán.
• Dữ liệu log hệ thống: Xóa sau 90 ngày.`,
      },
      {
        heading: "5. Quyền của chủ thể dữ liệu",
        body: `Theo Nghị định 13/2023/NĐ-CP, bạn có các quyền sau:
• Quyền biết: Được thông báo về việc xử lý dữ liệu.
• Quyền đồng ý: Quyết định cho phép hoặc không cho phép xử lý.
• Quyền truy cập: Xem dữ liệu cá nhân của mình.
• Quyền chỉnh sửa: Yêu cầu sửa dữ liệu không chính xác.
• Quyền xóa: Yêu cầu xóa dữ liệu (trong giới hạn pháp luật).
• Quyền hạn chế: Yêu cầu hạn chế xử lý dữ liệu.
• Quyền phản đối: Từ chối một số hoạt động xử lý nhất định.`,
      },
      {
        heading: "6. Liên hệ về dữ liệu",
        body: `Để thực hiện các quyền về dữ liệu cá nhân, liên hệ:
• Email: privacy@pinkycloud.vn
• Hotline: 0909 123 456
• Địa chỉ: 57 Quang Trung, Gò Vấp, TP.HCM

Chúng tôi sẽ phản hồi trong vòng 72 giờ làm việc.`,
      },
    ],
  },
};

export default function PolicyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const activeKey = slug || "dieu-khoan-su-dung";
  const activePolicy = POLICIES.find(p => p.key === activeKey) || POLICIES[0];
  const activeContent = CONTENT[activeKey] || CONTENT["dieu-khoan-su-dung"];

  // Cuộn lên đầu nội dung khi đổi trang
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeKey]);

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 60 }}>

      {/* Hero nhỏ */}
      <div style={{ background: `linear-gradient(135deg, ${PRIMARY}, #ff8fa3)`, padding: "28px 0" }}>
        <div className="container">
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>Trang chủ</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "#fff" }}>{activePolicy.label}</span>
          </div>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 26, margin: 0 }}>
            {activePolicy.icon} {activePolicy.label}
          </h1>
        </div>
      </div>

      <div className="container" style={{ marginTop: 24 }}>
        <div className="row g-4" style={{ alignItems: "flex-start" }}>

          {/* ══ SIDEBAR ══ */}
          <div className="col-lg-3">
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden", position: "sticky", top: 80 }}>
              <div style={{ padding: "14px 18px", background: PRIMARY, color: "#fff", fontWeight: 700, fontSize: 14 }}>
                📑 Danh mục điều khoản
              </div>
              {POLICIES.map((p, i) => (
                <div key={p.key}
                  onClick={() => navigate(`/chinh-sach/${p.key}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 18px", cursor: "pointer",
                    borderBottom: i < POLICIES.length - 1 ? "1px solid #f5f5f5" : "none",
                    background: activeKey === p.key ? "#fff0f3" : "#fff",
                    borderLeft: activeKey === p.key ? `3px solid ${PRIMARY}` : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (activeKey !== p.key) e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={e => { if (activeKey !== p.key) e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: activeKey === p.key ? 700 : 400, color: activeKey === p.key ? PRIMARY : "#444", lineHeight: 1.4 }}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ NỘI DUNG ══ */}
          <div className="col-lg-9" ref={contentRef}>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "32px 36px" }}>

              {/* Tiêu đề + ngày cập nhật */}
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${PRIMARY}` }}>
                <h2 style={{ fontWeight: 800, fontSize: 22, color: "#1a1a1a", margin: "0 0 8px" }}>
                  {activePolicy.icon} {activeContent.title}
                </h2>
                <span style={{ fontSize: 12, color: "#aaa" }}>
                  📅 Cập nhật lần cuối: {activeContent.updated}
                </span>
              </div>

              {/* Các phần nội dung */}
              {activeContent.sections.map((section, i) => (
                <div key={i} style={{ marginBottom: 28 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 10, paddingLeft: 12, borderLeft: `3px solid ${PRIMARY}` }}>
                    {section.heading}
                  </h4>
                  <div style={{ fontSize: 14, color: "#444", lineHeight: 1.9, whiteSpace: "pre-line", paddingLeft: 4 }}>
                    {section.body}
                  </div>
                </div>
              ))}

              {/* Điều hướng sang trang khác */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
                {(() => {
                  const idx = POLICIES.findIndex(p => p.key === activeKey);
                  const prev = POLICIES[idx - 1];
                  const next = POLICIES[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => navigate(`/chinh-sach/${prev.key}`)}
                          style={{ background: "#f5f5f5", border: "none", borderRadius: 25, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}>
                          ← {prev.label}
                        </button>
                      ) : <div />}
                      {next && (
                        <button onClick={() => navigate(`/chinh-sach/${next.key}`)}
                          style={{ background: PRIMARY, border: "none", borderRadius: 25, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                          {next.label} →
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Liên hệ hỗ trợ */}
            <div style={{ background: "#fff0f3", borderRadius: 12, border: `1px solid ${PRIMARY}33`, padding: "18px 24px", marginTop: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: PRIMARY, marginBottom: 4 }}>💬 Cần hỗ trợ thêm?</div>
                <div style={{ fontSize: 13, color: "#666" }}>Đội ngũ PinkyCloud luôn sẵn sàng giải đáp thắc mắc của bạn.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <a href="tel:0909123456" style={{ background: PRIMARY, color: "#fff", borderRadius: 20, padding: "8px 18px", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>📞 0909 123 456</a>
                <Link to="/lien-he" style={{ background: "#fff", color: PRIMARY, border: `1px solid ${PRIMARY}`, borderRadius: 20, padding: "8px 18px", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Liên hệ</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}