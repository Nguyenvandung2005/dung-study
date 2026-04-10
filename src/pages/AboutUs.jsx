import React, { useState } from "react";

export default function AboutUs() {
  const [hoveredBox, setHoveredBox] = useState(null);

  const getBoxStyle = (boxId) => {
    const whiteBackgroundBoxes = ['sanxuat', '2', 'uytín', 'chatlüong', 'tuте'];
    
    let backgroundColor = '#fff';
    let color = '333';
    
    if (hoveredBox === boxId && whiteBackgroundBoxes.includes(boxId)) {
      backgroundColor = '#E23E8C';
      color = '#fff';
    }
    
    return {
      backgroundColor,
      transform: hoveredBox === boxId ? "scale(1.05)" : "scale(1)",
      transition: "all 0.3s ease-in-out",
      color: hoveredBox === boxId && whiteBackgroundBoxes.includes(boxId) ? color : 'inherit'
    };
  };

  return (
    <div>
      <div className="container about-header">
        <div className="row align-items-center">
          <div className="col-md-6 text-center mb-4 mb-md-0">
            <img 
              src="/IMG/logoQuangba.png" 
              className="img-fluid about-header-image"
              alt="Thương Hiệu PinkyCloud"
            />
          </div>

          <div className="col-md-6">
            <h2 style={{ 
              fontSize: "28px", 
              fontWeight: "bold", 
              color: "#E23E8C",
              marginBottom: "20px"
            }}>
              VỀ THƯƠNG HIỆU PINKYCLOUD
            </h2>
            <p style={{ lineHeight: "1.8", marginBottom: "15px", textAlign: "justify" }}>
              Thương hiệu mỹ phẩm <strong>PINKYCLOUD</strong> thuộc sở hữu của Công ty TNHH Sản Xuất & Thương Mại PinkyCloud, được đăng ký độc quyền tại Việt Nam từ năm 2023. PINKYCLOUD tự hào là một trong những đơn vị tiên phong trong lĩnh vực cung cấp mỹ phẩm trang điểm và chăm sóc da với phong cách hiện đại, dễ thương và phù hợp với làn da phụ nữ Việt.
            </p>
            <p style={{ lineHeight: "1.8", marginBottom: "15px", textAlign: "justify" }}>
              Trụ sở chính của PINKYCLOUD được đặt tại Quận Gò Vấp, TP. Hồ Chí Minh. Hiện nay, hệ thống chi nhánh của PINKYCLOUD đã có mặt tại TP. Hồ Chí Minh, Nha Trang, Đà Nẵng, Bình Dương và Kiên Giang, nhằm phục vụ khách hàng trên khắp cả nước. Đặc biệt, cửa hàng trải nghiệm và mua sắm <strong>PINKYCLOUD Beauty Concept Store</strong> chính thức khai trương vào tháng 03/2024.
            </p>
            <p style={{ lineHeight: "1.8", marginBottom: "15px", textAlign: "justify" }}>
              PINKYCLOUD sở hữu nhà máy sản xuất hiện đại với diện tích hơn 1.500m², bao gồm 5 phân xưởng, 10 dây chuyền đóng gói và hơn 200 nhân sự lành nghề. Toàn bộ quy trình sản xuất được thực hiện 100% tại Việt Nam, từ nghiên cứu công thức đến đóng gói thành phẩm.
            </p>
            <p style={{ lineHeight: "1.8", textAlign: "justify" }}>
              Các sản phẩm của PINKYCLOUD đều phải trải qua quy trình kiểm định chất lượng nghiêm ngặt, đảm bảo độ an toàn, hiệu quả và phù hợp với làn da phụ nữ Việt trước khi chính thức phân phối ra thị trường.
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginBottom: "50px" }}>
        <div className="row g-4">
          <div className="col-md-6">
            <div 
              onMouseEnter={() => setHoveredBox('sanxuat')}
              onMouseLeave={() => setHoveredBox(null)}
              style={{
              padding: "30px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "5px",
              ...getBoxStyle('sanxuat'),
              cursor: "pointer"
            }}>
              <div className="d-flex align-items-start mb-3">
                <span style={{
                  fontSize: "24px",
                  color: "#E23E8C",
                  fontWeight: "bold",
                  marginRight: "15px"
                }}>
                  ❯
                </span>
              <h5 style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: hoveredBox === 'sanxuat' ? "#fff" : "#333",
                  margin: 0,
                  transition: "color 0.3s ease-in-out"
                }}>
                  100% SẢN XUẤT TẠI VIỆT NAM
                </h5>
              </div>
              <p style={{
                fontSize: "15px",
                color: hoveredBox === 'sanxuat' ? "#fff" : "#666",
                lineHeight: "1.6",
                marginLeft: "39px",
                transition: "color 0.3s ease-in-out"
              }}>
                Tất cả sản phẩm tại PinkyCloud đều tuyển chọn kỹ lưỡng, phân phối chính hãng. Chúng tôi tự hào là thương hiệu Việt, đồng hành cùng vẻ đẹp của phụ nữ Việt Nam.
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div 
              onMouseEnter={() => setHoveredBox('2')}
              onMouseLeave={() => setHoveredBox(null)}
              style={{
              padding: "30px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "5px",
              ...getBoxStyle('2'),
              cursor: "pointer"
            }}>
              <div className="d-flex align-items-start mb-3">
                <span style={{
                  fontSize: "24px",
                  color: "#E23E8C",
                  fontWeight: "bold",
                  marginRight: "15px"
                }}>
                  ❯
                </span>
                <h5 style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: hoveredBox === '2' ? "#fff" : "#333",
                  margin: 0,
                  transition: "color 0.3s ease-in-out"
                }}>
                  HÀI LÒNG KHÁCH HÀNG
                </h5>
              </div>
              <p style={{
                fontSize: "15px",
                color: hoveredBox === '2' ? "#fff" : "#666",
                lineHeight: "1.6",
                marginLeft: "39px",
                transition: "color 0.3s ease-in-out"
              }}>
                Luôn có mặt khi khách hàng cần. Luôn lắng nghe khi khách hàng nói. Luôn cố gắng đáp ứng mọi nhu cầu của khách hàng.      
                Chúng tôi không ngừng nỗ lực để mang đến trải nghiệm mua sắm tốt nhất cho khách hàng.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginBottom: "50px", textAlign: "center" }}>
        <img 
          src="/IMG/ceo.jpg" 
          alt="CEO" 
          className="img-fluid rounded shadow-lg"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      <section style={{
        backgroundColor: "#f5f5f5",
        padding: "60px 0",
        marginBottom: "50px",
        position: "relative"
      }}>
        <div className="container">
          <h2 style={{
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "#333",
            marginBottom: "50px"
          }}>
            Giá Trị Cốt Lõi
          </h2>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div 
                onMouseEnter={() => setHoveredBox('uytín')}
                onMouseLeave={() => setHoveredBox(null)}
                style={{
                padding: "30px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "5px",
                minHeight: "250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                ...getBoxStyle('uytín'),
                cursor: "pointer"
              }}>
                <h4 style={{
                  fontSize: "50px",
                  fontWeight: "bold",
                  color: hoveredBox === 'uytín' ? "#fff" : "#E23E8C",
                  marginBottom: "15px",
                  transition: "color 0.3s ease-in-out"
                }}>
                  Uy Tín
                </h4>
                <p style={{
                  fontSize: "14px",
                  color: hoveredBox === 'uytín' ? "#fff" : "#666",
                  lineHeight: "1.6",
                  transition: "color 0.3s ease-in-out"
                }}>
                  Uy tín với triết lý kinh doanh của công ty, với khách hàng, với đối tác, với cộng sự. Uy tín trong từng giao dịch và từng sản phẩm.
                </p>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div 
                onMouseEnter={() => setHoveredBox('chatlüong')}
                onMouseLeave={() => setHoveredBox(null)}
                style={{
                padding: "30px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "5px",
                minHeight: "250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                ...getBoxStyle('chatlüong'),
                cursor: "pointer"
              }}>
                <h4 style={{
                  fontSize: "50px",
                  fontWeight: "bold",
                  color: hoveredBox === 'chatlüong' ? "#fff" : "#E23E8C",
                  marginBottom: "15px",
                  transition: "color 0.3s ease-in-out"
                }}>
                  Chất Lượng
                </h4>
                <p style={{
                  fontSize: "14px",
                  color: hoveredBox === 'chatlüong' ? "#fff" : "#666",
                  lineHeight: "1.6",
                  transition: "color 0.3s ease-in-out"
                }}>
                  Sản phẩm tung ra thị trường phải là những sản phẩm chất lượng nhất, được làm ra từ khối óc và bàn tay người Việt Nam.
                </p>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div 
                onMouseEnter={() => setHoveredBox('tuте')}
                onMouseLeave={() => setHoveredBox(null)}
                style={{
                padding: "30px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "5px",
                minHeight: "250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                ...getBoxStyle('tuте'),
                cursor: "pointer"
              }}>
                <h4 style={{
                  fontSize: "50px",
                  fontWeight: "bold",
                  color: hoveredBox === 'tuте' ? "#fff" : "#E23E8C",
                  marginBottom: "15px",
                  transition: "color 0.3s ease-in-out"
                }}>
                  Tử Tế
                </h4>
                <p style={{
                  fontSize: "14px",
                  color: hoveredBox === 'tuте' ? "#fff" : "#666",
                  lineHeight: "1.6",
                  transition: "color 0.3s ease-in-out"
                }}>
                  Tử tế với khách hàng, với cộng sự, với đối tác và xã hội. Tôn trọng các tiêu chuẩn đã được thiết lập.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "50px" }}>
        <div className="container">
          <div className="row">
            {/* Mission */}
            <div className="col-md-6 mb-4 mb-md-0">
              <div 
                onMouseEnter={() => setHoveredBox('mission')}
                onMouseLeave={() => setHoveredBox(null)}
                style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "5px",
                height: "300px",
                ...getBoxStyle('mission'),
                cursor: "pointer"
              }}>
                <img 
                  src="/IMG/GT4.png" 
                  alt="Mission"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: hoveredBox === 'mission' ? "rgba(200, 40, 120, 1)" : "rgba(231, 62, 140, 0.8)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "20px",
                  textAlign: "center",
                  transition: "background-color 0.3s ease-in-out"
                }}>
                  <h3 style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: "15px"
                  }}>
                    SỨ MỆNH
                  </h3>
                  <p style={{
                    fontSize: "16px",
                    color: "#fff",
                    lineHeight: "1.6"
                  }}>
                    Mang đến những sản phẩm làm đẹp chất lượng nhất với giá thành tối ưu, giúp bạn tự tin tỏa sáng mỗi ngày.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div 
                onMouseEnter={() => setHoveredBox('vision')}
                onMouseLeave={() => setHoveredBox(null)}
                style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "5px",
                height: "300px",
                ...getBoxStyle('vision'),
                cursor: "pointer"
              }}>
                <img 
                  src="/IMG/GT5.png" 
                  alt="Vision"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: hoveredBox === 'vision' ? "rgba(200, 40, 120, 1)" : "rgba(231, 62, 140, 0.8)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "20px",
                  textAlign: "center",
                  transition: "background-color 0.3s ease-in-out"
                }}>
                  <h3 style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: "15px"
                  }}>
                    TẦM NHÌN
                  </h3>
                  <p style={{
                    fontSize: "16px",
                    color: "#fff",
                    lineHeight: "1.6"
                  }}>
                    Trở thành thương hiệu mỹ phẩm được phái đẹp Việt tin chọn và yêu mến.
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
