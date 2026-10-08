# AC — Visual QA Standard v1.0
## Chuẩn Thẩm Định Thị Giác Cổ Phục & Kiểm Toán Đa Phương Thức (Multimodal Cultural QA Policy)

> **TÀI LIỆU QUY CHUẨN KIỂM TOÁN VĂN HÓA (CANONICAL VISUAL AUDIT STANDARD)**
> **Xuất phát từ:** "AC — Research & Cultural Knowledge Master v1.0 FINAL" (SRC-03 đến SRC-07)
> **Trạng thái:** CANONICAL ZERO-DRIFT AUDIT ARTIFACT
> **Phạm vi thẩm định:** 3 Dáng áo nền (Áo ngũ thân tay chẽn, Áo tấc / Ngũ thân tay thụng, Áo tứ thân).

---

### 1. NGUYÊN TẮC THẨM ĐỊNH THỊ GIÁC CỐT LÕI (CORE AUDIT PRINCIPLES)

1. **Quan Sát 2D Thuần Túy (Objective 2D Perception Only):**
   - Mô hình Vision hoạt động như một cảm biến quang học 2D khách quan.
   - Tuyệt đối không suy diễn các kết cấu giải phẫu bị che khuất ở mặt trong (vạt con), mặt sau lưng, hoặc bị cánh tay/tư thế che khuất. Nếu không nhìn thấy $\rightarrow$ Bắt buộc trả về `NOT_ASSESSABLE`.
2. **Ngoại Lệ Vi Phạm Lộ Diện (Visible Violation Exception):**
   - Sự che khuất chỉ dẫn đến `NOT_ASSESSABLE` khi phần nhìn thấy hoàn toàn trung tính.
   - Nếu chi tiết bị che một phần nhưng phần lộ ra đã đủ bằng chứng chứng minh sự sai lệch kết cấu (ví dụ: cổ áo bị che một nửa nhưng nửa còn lại lộ rõ cổ bẻ nằm ngang kiểu âu phục) $\rightarrow$ Bắt buộc đánh giá `FAIL` hoặc `PARTIAL`.
3. **Bảo Vệ Độ Phân Giải Điểm Ảnh (Local Resolution Guard):**
   - Trong ảnh toàn thân 1024x1536, các chi tiết quá nhỏ (số lượng chính xác của khuy bấm nhỏ, viền thêu sợi chỉ) không đủ độ nét thì đánh giá `NOT_ASSESSABLE`, tuyệt đối không đánh `FAIL` chỉ vì không đếm rõ khuy nhỏ.
4. **Phân Tầng Thẩm Quyền Bằng Chứng (Evidence Provenance & Hard-Failure Gate):**
   - **Chỉ những đặc trưng `essential` có trạng thái bằng chứng xác thực vững chắc (`evidence_status === 'VERIFIED'`) mới đủ điều kiện kích hoạt phán quyết `CHANGES_CORE_IDENTIFICATION`**.
   - Các đặc trưng mang tính ước lượng dân gian hoặc gần đúng (`PROBABLE`, `APPROXIMATE`, `DISPUTED`, `UNKNOWN`) không được dùng làm căn cứ đánh trượt toàn diện trang phục.
5. **Hướng Nhìn Người Mặc (Wearer's Perspective Standard):**
   - Mọi quy định về hướng (vạt cài sang nách phải, hướng khuy) phải tính theo phía người mặc (wearer's right/left), không tính theo phía màn hình người xem.

---

### 2. DANH MỤC ĐẶC TRƯNG & TIÊU CHÍ ĐỐI SOÁT THEO TỪNG DÁNG ÁO

#### 2.1. ÁO NGŨ THÂN TAY CHẼN (`ngu_than_chen`)
*Tên lịch sử: Trách tụ đoản y | Quy chế: Thường phục / Tiện phục thời Nguyễn (1744, 1827, 1837)*

| Mã đặc trưng (`traitId`) | Tên gọi & Phân tầng | Căn cứ lịch sử | Điều kiện `PASS` | Dấu hiệu `PARTIAL` | Điều kiện `FAIL` | Tình huống `NOT_ASSESSABLE` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `collar_standing_mandarin` | **Cổ đứng lập lĩnh**<br>`essential` | VERIFIED<br>SRC-03, SRC-05 | Cổ đứng lập lĩnh dựng vuông vức ôm sát chân cổ (cao 2–5 cm), nẹp phẳng phiu. | Cổ đứng hơi thấp hoặc hơi ngả nhẹ nhưng vẫn giữ dáng cổ đứng. | Cổ bẻ nằm ngang (cổ âu phục), cổ khoét sâu hình chữ V, hoặc cổ tròn mở toang. | Cổ áo bị tóc dài hoặc khăn quàng che khuất 100% không nhìn thấy bất kỳ góc nào. |
| `closure_right_flap_quang` | **Cài vạt chéo nách phải**<br>`essential` | VERIFIED<br>SRC-03, SRC-05 | Vạt áo ngoài phủ chéo sang phía nách phải của người mặc, gài khuy định hình. | Vạt áo cài sang phải nhưng nẹp vạt hơi lệch góc. | Cài vạt sang nách trái, hoặc mở cúc ngực giữa kiểu áo sơ mi hiện đại. | Thân trên bị đồ vật che khuất hoàn toàn. |
| `sleeves_fitted_trach_tu` | **Ống tay chẽn bóp hẹp**<br>`essential` | VERIFIED<br>SRC-03, SRC-05 | Ống tay áo may thu hẹp dần từ khuỷu tay đến ôm gọn quanh cổ tay (trách tụ). | Ống tay hơi rộng nhẹ ở cổ tay nhưng vẫn theo phom suông chẽn. | Ống tay may xòe thụng rộng hình chữ nhật (biến dạng sang Áo tấc) hoặc tay cánh tiên. | Cả hai tay giấu hoàn toàn ra sau lưng hoặc bị khuất khỏi khung hình. |
| `five_panels_inner_flap` | **Cấu trúc 5 thân & vạt con**<br>`strongly_characteristic` | VERIFIED<br>SRC-03, SRC-05 | Nhìn thấy đường ghép khổ vải dọc thân và lớp vạt con lót trong. | Đường ghép thân nhìn mờ hoặc ẩn dưới chất liệu vải dày. | Thân áo cắt liền 1 mảnh như áo thun hiện đại. | Góc chụp chính diện khi áo đã cài kín vạt con bên trong $\rightarrow$ `NOT_ASSESSABLE`. |
| `five_buttons_right` | **Hàng 5 khuy nách phải**<br>`strongly_characteristic` | VERIFIED<br>SRC-03, SRC-05 | Nhìn rõ hàng khuy cài dọc từ cổ qua nách xuống sườn phải. | Khuy cài nhìn thấy 3–4 chiếc do góc bóng đổ. | Không có khuy cài hoặc dùng dây kéo khóa zipper hiện đại lộ liễu. | Khuy cài quá nhỏ hoặc độ phân giải ảnh không đủ nét. |
| `silhouette_straight_no_darts` | **Phom dáng suông buông**<br>`strongly_characteristic` | VERIFIED<br>SRC-03, SRC-05 | Thân áo buông suông thẳng đứng tự nhiên, tà xòe nhẹ, không nhấn eo. | Thân áo có độ ôm nhẹ theo dáng người nhưng không có đường may chích ben. | Chiết eo bó sát, độn ngực nhấn hông phong cách áo dài tân thời TK20. | Người mẫu ngồi gập người hoặc bị che phủ toàn bộ thân dưới. |
| `back_center_seam` | **Đường sống áo trung phùng**<br>`supporting` | VERIFIED<br>SRC-03, SRC-05 | Nhìn thấy đường sống may giữa lưng khi quan sát từ mặt sau. | Đường sống may mờ do chất liệu dệt bóng. | Mặt sau áo dệt liền 1 khổ không có đường may sống lưng. | Ảnh chụp góc chính diện hoặc 3/4 phía trước $\rightarrow$ `NOT_ASSESSABLE`. |
| `material_natural_silk` | **Chất liệu vải tự nhiên**<br>`supporting` | VERIFIED<br>SRC-05, SRC-06 | Vải sợi tự nhiên (tơ tằm, gấm, sa, đũi, linen) có độ rủ mềm mại mờ mịn. | Vải pha sợi hiện đại nhưng độ bắt sáng nhẹ nhàng. | Vải lụa phi bóng bắt sáng nhân tạo gắt (đặc trưng sân khấu biểu diễn). | Ảnh ánh sáng quá tối không nhìn rõ chất liệu bề mặt. |
| `body_color` | **Màu sắc thân áo**<br>`variable` | VERIFIED<br>SRC-03 | Hòa sắc thân áo hài hòa theo đúng bảng màu chỉ định. | Màu sắc lệch nhẹ do ánh sáng môi trường/tone màu nghệ thuật. | Màu sắc bị thay đổi hoàn toàn sang hệ màu tương phản đối lập. | Không xác định. |
| `woven_pattern` | **Hoa văn dệt chìm/nổi**<br>`variable` | VERIFIED<br>SRC-03 | Hoa văn dệt chìm truyền thống hoặc trơn màu trang nhã. | Hoa văn cách điệu nhẹ nhưng không phá vỡ tổng thể. | In hình hoạt họa hoặc logo thương hiệu hiện đại to bản. | Ảnh chụp xa không rõ vân vải. |
| `button_material` | **Chất liệu khuy cài**<br>`variable` | VERIFIED<br>SRC-05 | Khuy kim loại, ngọc, gỗ hoặc khuy tết đồng bộ. | Khuy nhựa tiệp màu thân áo. | Khuy áo đính đá dạ quang hoặc phụ liệu lệch tông. | Khuy quá nhỏ $\rightarrow$ `NOT_ASSESSABLE`. |

---

#### 2.2. ÁO TẤC / NGŨ THÂN TAY THỤNG (`ao_tac`)
*Tên lịch sử: Khoán tụ | Quy chế: Lễ phục phổ thông quan-hôn-tang-tế thời Nguyễn*

| Mã đặc trưng (`traitId`) | Tên gọi & Phân tầng | Căn cứ lịch sử | Điều kiện `PASS` | Dấu hiệu `PARTIAL` | Điều kiện `FAIL` | Tình huống `NOT_ASSESSABLE` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `collar_standing_mandarin` | **Cổ đứng lập lĩnh**<br>`essential` | VERIFIED<br>SRC-04, SRC-05 | Cổ đứng lập lĩnh dựng vuông vức ôm sát chân cổ mang tính lễ nghi. | Cổ đứng hơi thấp hoặc hơi ngả nhẹ. | Cổ bẻ nằm ngang, cổ khoét chữ V hoặc cổ tròn âu phục. | Bị tóc/phụ kiện che khuất 100%. |
| `closure_right_flap_quang` | **Cài khuy nách phải**<br>`essential` | VERIFIED<br>SRC-04, SRC-05 | Vạt áo ngoài phủ chéo cài khuy sang phía nách phải người mặc. | Vạt áo cài nách phải nhưng góc nẹp hơi lệch. | Cài sang nách trái hoặc dùng cúc ngực giữa. | Bị che khuất hoàn toàn. |
| `sleeves_wide_rectangular_box` | **Ống tay thụng chữ nhật**<br>`essential` | VERIFIED<br>SRC-04, SRC-05 | Ống tay may thụng rộng hình chữ nhật thẳng (khoán tụ), cổ tay mở rộng buông tự nhiên, không bóp hẹp. | Ống tay có độ rộng nhưng đường may hơi lượn nhẹ ở nách. | Ống tay bóp hẹp sát cổ tay (biến dạng sang Áo chẽn) hoặc may bó sát cánh tay. | Cả hai tay giấu hoàn toàn sau lưng hoặc bị đồ vật che khuất. |
| `five_panels_inner_flap` | **Cấu trúc 5 thân & vạt con**<br>`strongly_characteristic` | VERIFIED<br>SRC-04, SRC-05 | Cấu trúc 5 thân ghép dọc có vạt con che chắn kín đáo. | Đường may thân áo ẩn dưới lớp vải gấm dày. | Thân áo liền mảnh kiểu áo choàng hiện đại. | Không nhìn thấy lớp trong khi chụp chính diện $\rightarrow$ `NOT_ASSESSABLE`. |
| `five_buttons_right` | **Hàng 5 khuy cài**<br>`strongly_characteristic` | VERIFIED<br>SRC-04, SRC-05 | Hệ 5 khuy cài chữ quảng góc nách và sườn phải. | Nhìn rõ 3–4 khuy do góc chụp. | Dùng khóa kéo zipper hiện đại hoặc không có khuy. | Độ phân giải không đủ nét. |
| `ceremonial_long_silhouette` | **Phom buông rộng qua gối**<br>`strongly_characteristic` | VERIFIED<br>SRC-04, SRC-05 | Tà áo dài rộng quá gối trang nghiêm, phom dáng phóng khoáng lễ phục. | Tà áo chỉ chạm vừa đến gối. | Tà áo cắt ngắn ngang hông kiểu áo khoác jacket. | Bị che khuất thân dưới. |
| `sleeves_length_past_fingertips` | **Chiều dài tay qua ngón tay**<br>`strongly_characteristic` | PROBABLE<br>SRC-04 | Ống tay buông dài qua đầu ngón tay khoảng 1 tấc khi buông thõng. | Ống tay chạm vừa ngang đầu ngón tay. | Ống tay may ngắn trên cổ tay làm hở toàn bộ cẳng tay. *(Lưu ý: Không dùng làm căn cứ hard-failure do là PROBABLE)*. | Tay co gập chắp trước ngực không buông thẳng $\rightarrow$ `NOT_ASSESSABLE`. |
| `wide_flowing_hem` | **Tà áo xòe rộng buông dài**<br>`supporting` | VERIFIED<br>SRC-04 | Độ xòe tà lớn tạo dáng vẻ mực thước khi đứng hoặc di chuyển. | Độ xòe tà vừa phải. | Tà áo bó cụp ôm sát chân. | Bị che khuất. |
| `folded_hem_border` | **Nẹp tà may gập viền lớn**<br>`supporting` | VERIFIED<br>SRC-04 | Nẹp viền tà lớn dày dặn tôn nét trang trọng lễ nghi. | Nẹp viền may nhỏ hơn tiêu chuẩn. | Tà áo vắt sổ không có nẹp viền. | Ảnh quá mờ ở gấu áo. |
| `ceremonial_color` | **Màu sắc lễ nghi**<br>`variable` | VERIFIED<br>SRC-04 | Màu sắc chuẩn xác theo bản phối chỉ định. | Lệch sắc độ nhẹ do ánh sáng. | Màu sắc bị đảo lộn hoàn toàn. | Không xác định. |
| `woven_silk_brocade` | **Chất liệu gấm/lụa/sa**<br>`variable` | VERIFIED<br>SRC-04, SRC-05 | Vải gấm dệt, sa lụa truyền thống có độ đứng phom tự nhiên. | Chất liệu vải dệt hiện đại giữ phom tốt. | Vải nilon phi bóng gắt phản quang. | Không nhìn rõ kết cấu. |

---

#### 2.3. ÁO TỨ THÂN (`ao_tu_than`)
*Tên lịch sử: Áo mở vạt đi váy đụp | Quy chế: Trang phục truyền thống phụ nữ Bắc Bộ*

| Mã đặc trưng (`traitId`) | Tên gọi & Phân tầng | Căn cứ lịch sử | Điều kiện `PASS` | Dấu hiệu `PARTIAL` | Điều kiện `FAIL` | Tình huống `NOT_ASSESSABLE` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `four_panels_structure` | **Cấu trúc 4 thân vải**<br>`essential` | VERIFIED<br>SRC-06 | 2 thân sau may liền kín sống lưng, 2 thân trước tách rời độc lập. | Thân sau ghép đôi khổ vải đúng chuẩn. | Thân áo liền 1 mảnh không có đường chia thân truyền thống. | Góc chụp không quan sát được sống lưng $\rightarrow$ `NOT_ASSESSABLE` nếu chỉ thấy mặt trước. |
| `front_open_no_chest_buttons` | **Thân trước mở vạt không khuy**<br>`essential` | VERIFIED<br>SRC-06 | Thân trước để mở tự nhiên hoặc buộc vạt trước bụng, không có hàng khuy cài ngực. | Hai vạt trước khép hờ tự nhiên không cài khuy. | May kín cúc ngực như áo ngũ thân hoặc dùng khóa kéo đóng kín ngực. | Bị vật thể che khuất hoàn toàn. |
| `front_flaps_hanging_or_tied` | **Vạt trước buông hoặc buộc**<br>`essential` | VERIFIED<br>SRC-06 | Hai vạt trước buông thả song song hoặc thắt nút duyên dáng trước bụng. | Vạt trước thắt lỏng nhẹ ngang eo. | Vạt áo bị may dính liền vào cạp váy/quần. | Bị che khuất bụng dưới. |
| `layered_inner_yem` | **Lớp yếm lót che ngực**<br>`strongly_characteristic` | VERIFIED<br>SRC-06 | Thấy rõ lớp áo yếm độc lập che ngực lộ ra sau thân áo mở. | Cổ yếm lộ thấp dưới lớp áo cánh. | Mặc áo ngực hiện đại lộ liễu không mặc yếm, hoặc may dính liền giả yếm vào thân áo ngoài. | Thân trước bị khăn quàng che phủ hoàn toàn. |
| `inner_camisole_layer` | **Lớp áo cánh mỏng lót giữa**<br>`supporting` | VERIFIED<br>SRC-06 | Nhìn thấy lớp áo cánh mỏng mặc lồng giữa yếm và áo tứ thân. | Không mặc áo cánh nhưng vẫn mặc yếm kín đáo. | Phối đồ xuyên thấu hở hang lệch chuẩn. | Góc chụp không phân biệt rõ các lớp trong. |
| `non_quai_thao_hat` | **Nón thúng quai thao**<br>`supporting` | VERIFIED<br>SRC-06 | Nón thúng quai thao tròn to bản cầm tay hoặc đội đầu. | Nón lá thông thường thay vì nón thúng. | Mũ lưỡi trai, mũ len hiện đại. | Bản phối không yêu cầu nón $\rightarrow$ `NOT_ASSESSABLE`. |
| `khan_mo_qua_headscarf` | **Khăn mỏ quạ chít trán**<br>`supporting` | VERIFIED<br>SRC-06 | Khăn đen vấn tạo góc nhọn tam giác thanh tú trên trán. | Khăn vấn tròn không tạo góc nhọn mỏ quạ. | Khăn turban phương Tây quấn lệch. | Bản phối không yêu cầu khăn $\rightarrow$ `NOT_ASSESSABLE`. |
| `sash_belt` | **Dải thắt lưng/ruột tượng**<br>`variable` | VERIFIED<br>SRC-06 | Dải lụa thắt lưng màu hoa đào, xanh lục buộc duyên dáng quanh eo. | Thắt lưng vải đơn sắc giản dị. | Dắt thắt lưng da khóa kim loại hiện đại to bản. | Bị che khuất. |
| `lower_garment_skirt_or_pants` | **Hạ phục (váy đụp / quần lụa)**<br>`variable` | VERIFIED<br>SRC-06 | Váy đụp đen nguyên bản hoặc quần lụa đen ống rộng. | Chân váy dài cách tân thanh lịch. | Quần short ngắn hoặc váy ngắn trên gối. | Bị che khuất thân dưới. |
| `layered_layers_count` | **Số lượng lớp mặc**<br>`variable` | VERIFIED<br>SRC-06, SRC-07 | Phân tầng từ 2 lớp mộc mạc đến mớ ba mớ bảy rực rỡ. | Phân tầng 2 lớp gọn gàng. | Trang phục đơn lớp giả lập không có phân tầng. | Không nhìn rõ các lớp trong. |
| `color_and_yem_palette` | **Màu sắc áo & yếm**<br>`variable` | VERIFIED<br>SRC-06 | Hòa sắc áo ngoài trầm (nâu, đen, tím than) và yếm sáng màu (đỏ, hồng, điều). | Hòa sắc đơn sắc tối giản. | Màu sắc dạ quang phản quang lòe loẹt. | Không xác định. |

---

### 3. CÂY QUYẾT ĐỊNH PHÁN QUYẾT TỔNG THỂ (DETERMINISTIC AGGREGATION HIERARCHY)

Sau khi trích xuất bằng chứng thị giác, Server thực thi Cây Quyết Định Tất Định:

1. **Bước 1 — Lệch cấu trúc nhận diện (`CHANGES_CORE_IDENTIFICATION`):**
   - Có $\ge 1$ đặc trưng `essential` bị `FAIL` **VÀ** đặc trưng đó có `evidence_status === 'VERIFIED'`.
2. **Bước 2 — Góc ảnh chưa đủ cứ liệu (`INSUFFICIENT_EVIDENCE`):**
   - Không có lỗi Bước 1, nhưng tỷ lệ:
     $$\frac{\text{Số lượng essential đạt NOT\_ASSESSABLE}}{\text{Tổng số essential}} > 0.5$$
3. **Bước 3 — Nhận diện văn hóa bị mờ nhạt (`WEAKENS_RECOGNIZABILITY`):**
   - Có $\ge 1$ đặc trưng `essential` bị `PARTIAL` **HOẶC** $\ge 1$ đặc trưng `strongly_characteristic` bị `FAIL` **HOẶC** có biến dạng làm suy yếu nhận diện ở đặc trưng `strongly_characteristic` có bằng chứng `VERIFIED` (ví dụ: chiết eo phom suông, thiếu hàng khuy nách phải) **HOẶC** đặc trưng `essential` bị `FAIL` nhưng thuộc nhóm chưa xác thực vững chắc (`PROBABLE`/`APPROXIMATE`).
4. **Bước 4 — Hài hòa trong cách tân đương đại (`CONTEXT_SENSITIVE`):**
   - Toàn bộ `essential` quan sát được đều `PASS`, không có vi phạm làm mờ nhạt nhận diện, và có biến tấu thời trang đương đại chấp nhận được ở đặc trưng `strongly_characteristic` (PARTIAL mang tính ước lượng), hoặc `supporting`/`variable` phù hợp với bối cảnh đời sống hiện đại.
5. **Bước 5 — Bảo toàn nhận diện cổ phục (`PRESERVES_IDENTITY`):**
   - Toàn bộ đặc trưng `essential` quan sát được đều `PASS`, tỷ lệ `NOT_ASSESSABLE` $\le 0.5$, không có bất kỳ mâu thuẫn hay sai lệch kết cấu nào.
