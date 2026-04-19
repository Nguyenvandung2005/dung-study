import React from "react";
import { Link } from "react-router-dom";
import "../css/AboutUs.css";

const values = [
  {
    title: "Uy tín",
    description:
      "Minh bạch trong từng cam kết, giữ chuẩn chất lượng trong mọi sản phẩm và dịch vụ.",
  },
  {
    title: "Chất lượng",
    description:
      "Quy trình kiểm định nghiêm ngặt giúp sản phẩm an toàn, hiệu quả và phù hợp làn da Việt.",
  },
  {
    title: "Tử tế",
    description:
      "Lấy khách hàng làm trọng tâm, phục vụ bằng sự chân thành và tinh thần trách nhiệm.",
  },
];

const highlights = [
  {
    number: "2023",
    label: "Năm thương hiệu được đăng ký độc quyền tại Việt Nam",
  },
  {
    number: "1.500m²",
    label: "Quy mô nhà máy với dây chuyền sản xuất hiện đại",
  },
  {
    number: "200+",
    label: "Nhân sự đồng hành trong sản xuất và vận hành",
  },
];

const teamMembers = [
  {
    name: "Nguyễn Văn Dụng",
    studentId: "23657251",
    role: "Phụ trách giao diện",
    image: "/IMG/Dung.jpg",
    focus: "Trang Chủ, Trang tin tức, Trang AdminProduct",
    skills: ["HomePage", "News", "AdminProduct"],
  },
  {
    name: "Nguyễn Văn Đức",
    studentId: "23648601",
    role: "Backend & tính năng",
    image: "/IMG/Duc.jpg",
    focus: "Kết nối server, Trang Sản phẩm, Giỏ hàng",
    skills: ["Server", "Product", "Cart"],
  },
  {
    name: "Lê Văn Dương",
    studentId: "23660591",
    role: "Nội dung & tài liệu",
    image: "/IMG/Duong.jpg",
    focus: "Trang Về chúng tôi, Làm tài liệu báo cáo, Backend Account",
    skills: ["AboutUs", "Report", "Backend Account"],
  },
  {
    name: "Phạm Thị Hồng Dung",
    studentId: "23639641",
    role: "Auth & Checkout",
    image: "/IMG/HongDung.jpg",
    focus: "Trang đăng nhập đăng ký, Thanh toán, Trang liên hệ",
    skills: ["Login", "Checkout", "Contact"],
  },
];

export default function AboutUs() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container py-4 py-lg-5">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb about-breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Trang chủ</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Về chúng tôi
              </li>
            </ol>
          </nav>

          <div className="about-hero-frame">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-6">
                <div className="about-hero-content">
                  <span className="about-chip">PinkyCloud Beauty</span>
                  <h1 className="about-title mt-3">Nâng tầm trải nghiệm làm đẹp mỗi ngày</h1>
                  <p className="about-lead mt-3">
                    PinkyCloud là thương hiệu mỹ phẩm Việt theo đuổi chất lượng thực tế,
                    thiết kế hiện đại và dịch vụ tận tâm. Chúng tôi xây dựng hệ sinh thái
                    làm đẹp từ nghiên cứu, sản xuất đến tư vấn cá nhân hóa.
                  </p>
                  <div className="about-actions mt-4">
                    <a href="/san-pham" className="btn about-btn-primary">
                      Khám phá sản phẩm
                    </a>
                    <a href="/lien-he" className="btn about-btn-outline">
                      Liên hệ tư vấn
                    </a>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="about-hero-image-wrap">
                  <img src="/IMG/logoQuangba.png" alt="Thương hiệu PinkyCloud" className="about-hero-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <div className="about-surface">
            <div className="row g-4">
              {highlights.map((item) => (
                <div key={item.number} className="col-12 col-md-4">
                  <div className="about-stat-card">
                    <div className="about-stat-number">{item.number}</div>
                    <p className="about-stat-label">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <article className="about-article about-article-full">
            <h2>Về thương hiệu PinkyCloud</h2>
            <p>
              Trụ sở chính của PinkyCloud đặt tại Gò Vấp, TP. Hồ Chí Minh và mạng lưới
              chi nhánh đã mở rộng tại nhiều tỉnh thành. Với mô hình Beauty Concept Store,
              khách hàng có thể trải nghiệm, được tư vấn trực tiếp và chọn sản phẩm phù hợp.
            </p>
            <p>
              Toàn bộ quá trình từ nghiên cứu công thức đến đóng gói được triển khai tại Việt Nam.
              Chúng tôi tập trung vào tính an toàn, độ ổn định và hiệu quả sử dụng lâu dài.
            </p>
          </article>

          <div className="about-members-strip">
            <div className="about-members-head">
              <h3>Thành viên PinkyCloud</h3>
            </div>

            <div className="about-members-row">
              {teamMembers.map((member) => (
                <div key={member.studentId} className="about-member-profile">
                  <div className="about-member-badge">Nhóm 04</div>
                  <img src={member.image} alt={member.name} className="about-member-avatar" />
                  <h4>{member.name}</h4>
                  <div className="about-member-id">MSSV: {member.studentId}</div>
                  <p className="about-member-role">{member.role}</p>
                  <div className="about-member-tags">
                    {member.skills.map((skill) => (
                      <span key={`${member.studentId}-${skill}`}>{skill}</span>
                    ))}
                  </div>
                  <p className="about-member-focus">{member.focus}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-section about-values-section">
        <div className="container">
          <div className="about-section-head text-center">
            <h2>Giá trị cốt lõi</h2>
            <p>Ba nguyên tắc vận hành tạo nên chất lượng thương hiệu và niềm tin khách hàng.</p>
          </div>

          <div className="row g-4">
            {values.map((value, index) => (
              <div key={value.title} className="col-12 col-md-4">
                <div className="about-value-card">
                  <div className="about-value-index">0{index + 1}</div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section pb-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="about-media-card">
                <img src="/IMG/GT4.png" alt="Sứ mệnh PinkyCloud" />
                <div className="about-media-overlay">
                  <h3>Sứ mệnh</h3>
                  <p>
                    Cung cấp giải pháp làm đẹp chất lượng cao với mức giá hợp lý, giúp khách hàng tự tin hơn mỗi ngày.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="about-media-card">
                <img src="/IMG/GT5.png" alt="Tầm nhìn PinkyCloud" />
                <div className="about-media-overlay">
                  <h3>Tầm nhìn</h3>
                  <p>
                    Trở thành thương hiệu mỹ phẩm Việt được yêu thích nhờ chất lượng bền vững và dịch vụ khác biệt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
