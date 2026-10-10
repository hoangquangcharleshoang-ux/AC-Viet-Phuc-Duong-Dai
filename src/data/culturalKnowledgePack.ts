/**
 * AC — Cultural Knowledge Pack v1.0
 * Canonical Machine-Readable Projection derived directly from:
 * "AC — Research & Cultural Knowledge Master v1.0 FINAL"
 * 
 * NOTICE: Mọi cultural claims bắt buộc phải dựa vào các nguồn văn hóa lịch sử
 * phù hợp trong Master (SRC-03 đến SRC-07). SRC-01 (User Survey N=61) và
 * SRC-02 (Qualitative n=1) là dữ liệu nghiên cứu người dùng, KHÔNG PHẢI
 * là căn cứ thẩm quyền văn hóa lịch sử.
 */

import {
  GarmentKnowledge,
  OccasionInfo,
  RemixIntentInfo,
  CuratedOption,
  SourceCitation,
  EvidenceFragment,
  GarmentId,
  SlotId,
  OccasionId,
  RemixIntent
} from '../types/index';

export const SOURCES_CATALOG: Record<string, SourceCitation> = {
  'SRC-03': {
    id: 'SRC-03',
    title: 'Quốc phục - Áo dài ngũ thân truyền thống Việt Nam',
    author: 'Võ Vinh Quang',
    type: 'Khảo cứu lịch sử di sản',
    institution: 'Tạp chí Sông Hương',
    year: '2020',
    locator: 'Chuyên đề Nghiên cứu Văn hóa & Di sản Huế',
    supportedClaims: 'Quy chế cải cách y phục thời Nguyễn (1744, 1827, 1837), cấu trúc trách tụ đoản y, ngũ thân lập lĩnh.',
    reliability: 'Khảo cứu lịch sử di sản có trích dẫn thư tịch cổ (Đại Nam Thực Lục); độ tin cậy học thuật cao.'
  },
  'SRC-04': {
    id: 'SRC-04',
    title: 'Áo tấc - cổ phục quý đang hồi sinh',
    author: 'TS. Phan Thanh Hải',
    type: 'Chuyên luận di sản Cố đô',
    institution: 'Sở Văn hóa & Thể thao Thừa Thiên Huế / Báo Thừa Thiên Huế',
    year: '2021',
    locator: 'Chuyên mục Nghiên cứu Cổ phục Triều Nguyễn',
    supportedClaims: 'Khái niệm Áo tấc, cấu trúc tay thụng hình chữ nhật, thông số khảo sát hiện vật (30–50 cm theo khảo sát hiện vật), buông thừa 1 tấc (ước lượng dân gian), bối cảnh lễ phục quan-hôn-tang-tế.',
    reliability: 'Chuyên luận của chuyên gia di sản Cố đô Huế; độ tin cậy thực chứng cao.'
  },
  'SRC-05': {
    id: 'SRC-05',
    title: 'Hồ sơ hiện vật "Y phục thời Nguyễn"',
    author: 'Phòng Trưng bày & Quản lý Hiện vật',
    type: 'Hồ sơ hiện vật bảo tàng',
    institution: 'Bảo tàng Lịch sử Quốc gia (Hà Nội)',
    locator: 'Bộ sưu tập trang phục Cung đình & Dân gian triều Nguyễn',
    supportedClaims: 'Hiện vật áo ngũ thân tay chẽn, áo tấc lễ phục, bổ phục may theo áo tấc. Cấu trúc 5 thân, khuy nách phải chữ quảng, phom suông.',
    reliability: 'Hiện vật bảo tàng gốc (Physical Ground Truth); xác thực danh mục phân loại hiện vật.'
  },
  'SRC-06': {
    id: 'SRC-06',
    title: 'Áo tứ thân - Trang phục truyền thống của phụ nữ Việt',
    author: 'Phòng Nghiên cứu Dân tộc học',
    type: 'Tài liệu dân tộc học bảo tàng',
    institution: 'Bảo tàng Phụ nữ Việt Nam',
    locator: 'Chuyên đề Trang phục Nữ truyền thống Đồng bằng Bắc Bộ',
    supportedClaims: 'Cấu trúc 4 thân vải, thân trước mở buộc vạt không khuy, phân tầng yếm, dải thắt lưng, hạ phục váy đụp bản địa hoặc quần lụa tiếp biến cuối TK19.',
    reliability: 'Tư liệu bảo tàng dân tộc học; độ tin cậy cao về trang phục truyền thống phụ nữ Bắc Bộ.'
  },
  'SRC-07': {
    id: 'SRC-07',
    title: 'Giá trị thẩm mỹ và văn hóa của trang phục quan họ xưa và nay',
    author: 'Ban Biên tập Tạp chí Văn hóa Nghệ thuật',
    type: 'Nghiên cứu mỹ thuật & sân khấu',
    institution: 'Bộ Văn hóa, Thể thao và Du lịch',
    locator: 'Số chuyên đề Nghiên cứu Di sản Dân ca & Phục trang Sân khấu',
    supportedClaims: 'Sự phân hóa giữa trang phục dân gian lịch sử (sợi tự nhiên, yếm rời) và phục trang sân khấu biểu diễn nửa sau TK20 (phi bóng, yếm dính liền giả).',
    reliability: 'Tạp chí chuyên ngành Bộ VHTTDL; độ tin cậy học thuật cao về ranh giới phục trang sân khấu.'
  }
};

export const OCCASIONS: Record<OccasionId, OccasionInfo> = {
  tet_temple: {
    id: 'tet_temple',
    name: 'Lễ Tết gia tộc & Đình miếu',
    tagline: 'Nghi lễ tế tự, chúc Tết gia tiên, không gian tâm linh cổ kính',
    solemnity: 'Cao (Trang nghiêm)',
    description: 'Bối cảnh trang nghiêm bậc nhất, đòi hỏi sự khiêm cung, tôn kính cội nguồn và bảo toàn tối đa tính đoan chính của trang phục truyền thống.',
    historical_context: 'Gắn liền với nghi lễ quan-hôn-tang-tế thời Nguyễn và phong tục tế tự đình làng dân tộc.',
    iconName: 'Building2'
  },
  ky_yeu: {
    id: 'ky_yeu',
    name: 'Kỷ yếu / tốt nghiệp',
    tagline: 'Lễ tốt nghiệp, chụp ảnh kỷ yếu, vinh danh tri thức trẻ',
    solemnity: 'Trung bình - Cao',
    description: 'Không gian tôn vinh tri thức, mốc son trưởng thành và sự giao hòa giữa truyền thống học thuật với tinh thần thế hệ trẻ.',
    historical_context: 'Tiếp thu truyền thống khoa cử, y phục triều cống và lễ phục học đường Việt Nam qua các thời kỳ.',
    iconName: 'GraduationCap'
  },
  cultural_wedding: {
    id: 'cultural_wedding',
    name: 'Sự kiện văn hóa & Đám cưới',
    tagline: 'Giao tế xã hội, lễ cưới hỏi truyền thống, ngày vui trọng đại',
    solemnity: 'Trung bình - Cao',
    description: 'Bối cảnh giao lưu văn hóa trang trọng nhưng rạng rỡ, cho phép hòa sắc tươi sáng và kết hợp các phụ kiện thanh lịch.',
    historical_context: 'Không gian lễ cưới hỏi cổ truyền hoặc ngày hội giao lưu di sản, đại sự cộng đồng.',
    iconName: 'HeartHandshake'
  },
  street_cafe: {
    id: 'street_cafe',
    name: 'Dạo phố cà phê & Chụp ảnh kỷ niệm',
    tagline: 'Đời sống hiện đại, dạo phố, thể hiện cá tính phong cách Gen Z',
    solemnity: 'Thường nhật',
    description: 'Bối cảnh năng động, cởi mở nhất để ứng dụng Việt phục vào đời sống thường nhật với các biến tấu thời trang đương đại.',
    historical_context: 'Tiếp nối tinh thần tiện phục, thường phục đô thị của Áo ngũ thân tay chẽn và trang phục dân gian.',
    iconName: 'Coffee'
  }
};

export const REMIX_INTENTS: Record<RemixIntent, RemixIntentInfo> = {
  traditional: {
    id: 'traditional',
    name: 'Truyền thống',
    tagline: 'Mực thước nguyên bản',
    description: 'Ưu tiên tối đa cấu hình nguyên bản lịch sử, màu sắc nhã nhặn và phụ kiện cổ truyền mực thước.',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
  },
  balanced: {
    id: 'balanced',
    name: 'Cân bằng',
    tagline: 'Giao thoa thanh lịch',
    description: 'Giữ vững phom dáng và cấu trúc cốt lõi của thân áo, kết hợp phụ kiện hiện đại thanh lịch, tinh tế.',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
  },
  expressive: {
    id: 'expressive',
    name: 'Phá cách',
    tagline: 'Đột phá đương đại',
    description: 'Tự do thử nghiệm layer độc đáo, phối màu tương phản cao và phụ kiện thời trang đường phố táo bạo.',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10'
  }
};

export const GARMENTS: Record<GarmentId, GarmentKnowledge> = {
  ngu_than_chen: {
    id: 'ngu_than_chen',
    canonical_name: 'Áo ngũ thân tay chẽn',
    historical_term: 'Trách tụ đoản y (quần chân áo chít/chiết)',
    heritage_term: 'Áo ngũ thân lập lĩnh tay chẽn',
    definition: 'Dạng thức thường phục và tiện phục truyền thống phổ biến thời Nguyễn dành cho cả nam và nữ, có cấu trúc 5 thân ghép dọc, cổ đứng lập lĩnh, cài khuy sang nách phải và ống tay thu gọn dần về cổ tay.',
    historical_function: 'Thường phục / Tiện phục trong công sở, học tập, buôn bán và sinh hoạt hằng ngày; lớp lót khi mặc đại lễ.',
    fixed_metadata: {
      collar_type: 'lap_linh_standing',
      collar_display: 'Cổ đứng lập lĩnh dựng vuông ôm khít chân cổ (2–5 cm)',
      body_panels: 5,
      closure_side: 'Nách phải hình chữ quảng'
    },
    traits: {
      essential: [
        'Cổ đứng lập lĩnh dựng ôm khít chân cổ',
        'Cài vạt chéo sang nách phải (khuy chữ quảng)',
        'Ống tay bóp hẹp thu dần về cổ tay (trách tụ)'
      ],
      strongly_characteristic: [
        'Cấu trúc 5 thân ghép khổ vải có vạt con bên trong',
        'Hàng 5 khuy cài cứng bố trí góc nách phải',
        'Phom dáng suông buông tự nhiên, không chiết eo'
      ],
      supporting: [
        'Đường sống áo trung phùng giữa lưng',
        'Chất liệu vải tơ tằm, gấm, sa, đũi mộc tự nhiên'
      ],
      variable: [
        'Màu sắc thân áo',
        'Hoa văn dệt chìm/nổi',
        'Chất liệu khuy cài (đồng, bạc, ngọc, gỗ)'
      ]
    },
    sources: ['SRC-03', 'SRC-04', 'SRC-05'],
    defaults: {
      silhouette: 'natural_straight',
      sleeves: 'trach_tu_fitted',
      closure: 'right_flap_buttons',
      inner_chest: 'yem_separate', // metadata only, don y white internally
      bottom: 'silk_pants_wide',
      material_finish: 'natural_matte_silk_linen',
      footwear: 'leather_loafer',
      outerwear: 'outerwear_none',
      accessories: 'accessories_none'
    },
    cultural_narrative: {
      short_definition: 'Áo ngũ thân tay chẽn là dạng thường phục và tiện phục phổ biến thời Nguyễn dành cho cả nam và nữ. Áo có cấu trúc năm thân, cổ đứng lập lĩnh, cài vạt sang nách phải và tay áo thu hẹp dần từ nách xuống cổ tay.',
      origin_context: 'Gắn với các mốc cải cách y phục từ năm 1744 đến các quy định năm 1827 và 1837 thời Nguyễn. Áo được sử dụng trong công sở, học tập, buôn bán và sinh hoạt hằng ngày, đồng thời có thể làm lớp mặc trong khi sử dụng các loại lễ phục lớn.',
      cultural_meaning: 'Áo ngũ thân tay chẽn gắn với thường phục và tiện phục trong đời sống thời Nguyễn. Dáng tay thu gọn hỗ trợ sinh hoạt và vận động, tạo nên sự cân bằng giữa vẻ chỉnh tề và tính thực dụng.',
      form_function: 'Ống tay thu hẹp dần từ nách xuống cổ tay giúp thao tác và vận động gọn hơn. Thân áo giữ phom suông, không chiết eo; cấu trúc năm thân có vạt con bên trong là một đặc điểm nhận diện mạnh của hệ ngũ thân.',
      quick_recognition: [
        'Cổ đứng lập lĩnh dựng ôm khít chân cổ',
        'Cài vạt lệch sang nách phải (khuy chữ quảng)',
        'Ống tay chẽn thu hẹp ở cổ tay (trách tụ)',
        'Phom dáng suông buông tự nhiên 5 thân'
      ],
      wearing_experience: 'Ống tay thu gọn hỗ trợ di chuyển và thao tác tay thuận tiện trong sinh hoạt hằng ngày; phom dáng suông buông tự nhiên tạo sự chỉn chu mà vẫn linh hoạt khi cử động.',
      contemporary_use: 'Phù hợp cho dịp lễ Tết, chụp ảnh kỷ yếu, sự kiện văn hóa và dạo phố nhờ sự cân bằng giữa nét trang nhã truyền thống và tính tiện dụng hiện đại.',
      uncertainties: 'Các diễn giải biểu tượng như 5 khuy tượng trưng cho ngũ thường/ngũ luân hay vạt con tượng trưng cho sự khiêm nhường là các diễn giải dân gian hoặc đương đại lan truyền về sau; thư tịch chính thống không ghi nhận các triết lý biểu trưng này. Thông số kích thước chi tiết cũng biến thiên theo từng vóc dáng và giai đoạn.'
    }
  },
  ao_tac: {
    id: 'ao_tac',
    canonical_name: 'Áo tấc (Ngũ thân tay thụng)',
    historical_term: 'Khoán tụ (áo thụng rộng / bổ phục khi có bổ tử)',
    heritage_term: 'Áo tấc / Áo ngũ thân tay thụng',
    definition: 'Dạng thức lễ phục phổ thông truyền thống thời Nguyễn dành cho cả nam và nữ, có cấu trúc 5 thân cổ đứng lập lĩnh, vạt rộng và ống tay may thụng dài hình chữ nhật buông quá đầu ngón tay.',
    historical_function: 'Lễ phục trang nghiêm trong nghi thức quan-hôn-tang-tế, cúng đình miếu, tế tự tổ tiên, chúc Tết gia tộc.',
    fixed_metadata: {
      collar_type: 'lap_linh_standing',
      collar_display: 'Cổ đứng lập lĩnh dựng vuông ôm khít chân cổ',
      body_panels: 5,
      closure_side: 'Nách phải hình chữ quảng'
    },
    traits: {
      essential: [
        'Cổ đứng lập lĩnh dựng ôm khít chân cổ',
        'Cài khuy sang nách phải (khuy chữ quảng)',
        'Ống tay may thụng rộng hình khối chữ nhật, không bóp hẹp ở cổ tay (khoán tụ)'
      ],
      strongly_characteristic: [
        'Cấu trúc 5 thân ghép vải có vạt con bên trong',
        'Hàng 5 khuy cài hình chữ quảng',
        'Phom dáng buông rộng thụng dài qua đầu gối mang tính lễ nghi'
      ],
      supporting: [
        'Tà áo xòe rộng buông dài qua gối',
        'Nẹp tà may gập viền lớn trang trọng'
      ],
      variable: [
        'Màu sắc (đỏ, xanh, vàng, tím, đen... theo nghi lễ)',
        'Chất liệu gấm, lụa, sa trơn hoặc thêu dệt hoa văn'
      ]
    },
    sources: ['SRC-04', 'SRC-05'],
    defaults: {
      silhouette: 'natural_straight',
      sleeves: 'khoan_tu_wide_box',
      closure: 'right_flap_buttons',
      inner_chest: 'yem_separate',
      bottom: 'silk_pants_wide',
      material_finish: 'natural_matte_silk_linen',
      footwear: 'leather_loafer',
      outerwear: 'outerwear_none',
      accessories: 'accessories_none'
    },
    cultural_narrative: {
      short_definition: 'Áo tấc, còn gọi là Áo ngũ thân tay thụng, là một dạng lễ phục phổ biến thời Nguyễn dành cho cả nam và nữ. Áo có cấu trúc năm thân, cổ đứng lập lĩnh và tay thụng rộng hình chữ nhật, buông quá đầu ngón tay.',
      origin_context: 'Trong thời Nguyễn, Áo tấc được dùng trong nhiều bối cảnh nghi lễ như cúng tế, lễ Tết gia tộc, hỉ sự và các dịp trang trọng của cộng đồng.',
      cultural_meaning: 'Áo tấc gắn với tính trang nghiêm và chuẩn mực của không gian nghi lễ. Một số diễn giải nghiên cứu liên hệ dáng tay thụng và tư thế chắp tay với vẻ khiêm cung, điềm đạm và trang trọng khi hành lễ.',
      form_function: 'Ống tay thụng rộng hình chữ nhật (khoán tụ) tạo nên diện mạo trang trọng đặc trưng của lễ phục. Thiết kế tay áo rộng không phục vụ lao động chân tay mà hướng tới tư thế hành lễ điềm đạc và khoan thai.',
      quick_recognition: [
        'Cổ đứng lập lĩnh',
        'Cài khuy lệch sang nách phải (khuy chữ quảng)',
        'Ống tay may thụng rộng hình chữ nhật (khoán tụ)',
        'Cấu trúc ngũ thân có vạt con bên trong',
        'Phom rộng, mang dáng lễ phục'
      ],
      wearing_experience: 'Ống tay rộng và tà dài đòi hỏi tư thế di chuyển đĩnh đạc, phù hợp với không gian nghi lễ và sự kiện trang trọng.',
      contemporary_use: 'Phù hợp cho đám cưới truyền thống, lễ Tết gia tộc, lễ hội di sản, sự kiện văn hóa và chụp ảnh kỷ niệm.',
      uncertainties: 'Nguồn gốc tên gọi "Áo tấc" chưa được xác định chắc chắn. Trong tư liệu thời Nguyễn, dạng tay rộng được mô tả bằng thuật ngữ "khoán tụ"; đây là thuật ngữ chỉ hình thái tay áo, không phải tên gọi lịch sử của riêng chiếc Áo tấc. Các cách giải thích tên "tấc" liên quan đến viền tà hoặc phần tay thừa ra một tấc hiện vẫn chủ yếu là diễn giải dân gian.'
    }
  },
  ao_tu_than: {
    id: 'ao_tu_than',
    canonical_name: 'Áo tứ thân',
    historical_term: 'Áo mở vạt đi váy đụp (trang phục phụ nữ Bắc Hà)',
    heritage_term: 'Áo tứ thân phụ nữ đồng bằng Bắc Bộ',
    definition: 'Áo tứ thân là trang phục truyền thống tiêu biểu của phụ nữ vùng đồng bằng Bắc Bộ, có cấu trúc từ 4 thân vải: 2 thân sau may liền theo sống lưng và 2 thân trước tách rời thành hai tà mở. Áo làm lớp khoác ngoài duyên dáng kết hợp cùng áo yếm bên trong; hai tà trước có thể buông thả ngực hoặc buộc vạt trước bụng tùy bối cảnh sinh hoạt hay lễ hội.',
    historical_function: 'Thường phục lao động hằng ngày của phụ nữ nông thôn Bắc Bộ; nâng tầm thành trang phục hội hè khi mặc lồng nhiều lớp (mớ ba mớ bảy).',
    fixed_metadata: {
      collar_type: 'v_neck_open',
      collar_display: 'Cổ vát chữ V hoặc cổ tròn thấp mở ngực (không khuy cài ngực)',
      body_panels: 4,
      closure_side: 'Mở vạt trước ngực (buộc vạt hoặc buông thả)'
    },
    traits: {
      essential: [
        'Cấu trúc 4 thân vải (2 thân sau may liền sống lưng, 2 thân trước buông thả ngực hoặc buộc vạt)',
        'Thân trước mở vạt, không có hàng khuy cài ngực',
        'Lớp áo khoác ngoài phối cùng áo yếm che ngực bên trong'
      ],
      strongly_characteristic: [
        'Hai vạt trước buông thả song song hoặc buộc vạt trước bụng tùy bối cảnh',
        'Dải thắt lưng hoặc ruột tượng quấn cố định ngang eo'
      ],
      supporting: [
        'Lớp áo cánh mỏng trung gian',
        'Khăn mỏ quạ chít nếp nhọn trán (đội đầu)',
        'Nón thúng quai thao to bản'
      ],
      variable: [
        'Hạ phục (váy đụp đen nguyên bản hoặc quần lụa đen tiếp biến cuối TK19)',
        'Màu sắc thân áo và lớp yếm',
        'Số lượng lớp mặc (từ 2 lớp mộc mạc đến mớ ba mớ bảy hội hè)'
      ]
    },
    sources: ['SRC-06', 'SRC-07'],
    defaults: {
      silhouette: 'natural_straight',
      sleeves: 'trach_tu_fitted',
      closure: 'front_tied',
      inner_chest: 'yem_separate',
      bottom: 'vay_dup_black',
      material_finish: 'natural_matte_silk_linen',
      footwear: 'guoc_moc',
      outerwear: 'outerwear_none',
      accessories: 'accessories_none'
    },
    cultural_narrative: {
      short_definition: 'Áo tứ thân là trang phục truyền thống tiêu biểu của phụ nữ vùng đồng bằng Bắc Bộ. Áo gồm bốn thân vải: hai thân sau may liền theo sống lưng và hai thân trước tách rời thành hai tà mở; thường mặc cùng áo yếm và dải thắt lưng.',
      origin_context: 'Áo tứ thân gắn với đời sống lao động và sinh hoạt của phụ nữ vùng đồng bằng Bắc Bộ, đặc biệt là Kinh Bắc và đồng bằng sông Hồng. Áo được dùng làm thường phục và có thể mặc nhiều lớp (mớ ba mớ bảy) trong hội hè.',
      cultural_meaning: 'Áo tứ thân gắn với đời sống lao động và sinh hoạt của phụ nữ đồng bằng Bắc Bộ. Cấu trúc 4 thân với hai tà trước mở cho phép buông, buộc hoặc túm gọn tùy hoạt động, tạo tính linh hoạt trong lao động và sinh hoạt. Trong hội hè, trang phục có thể được mặc nhiều lớp (mớ ba mớ bảy) với chất liệu và màu sắc phong phú hơn. Về sau, Áo tứ thân trở thành hình ảnh di sản gắn mạnh với Kinh Bắc, lễ hội và nghệ thuật dân gian.',
      form_function: 'Cấu trúc 4 thân với hai tà trước mở cho phép người mặc buông, buộc hoặc túm gọn tùy hoạt động. Áo mặc cùng áo yếm; dải thắt lưng cố định ngang eo và trong một số cách mặc có thể kết hợp cùng ruột tượng.',
      quick_recognition: [
        'Cấu trúc 4 thân: 2 thân sau may liền theo sống lưng, 2 thân trước tách rời thành hai tà mở',
        'Thân trước mở, không có hàng khuy cài khép ngực',
        'Mặc cùng áo yếm bên trong',
        'Hai tà trước có thể buông hoặc buộc',
        'Dải thắt lưng cố định ngang eo; trong một số cách mặc có thể kết hợp ruột tượng'
      ],
      wearing_experience: 'Cấu trúc mở vạt và dải thắt lưng giúp vận động linh hoạt, dễ điều chỉnh phù hợp với sinh hoạt lao động thường nhật cũng như khi tham gia hội hè.',
      contemporary_use: 'Phù hợp cho các chương trình biểu diễn nghệ thuật dân gian, lễ hội truyền thống Kinh Bắc và chụp ảnh di sản văn hóa.',
      uncertainties: 'Cách diễn giải "4 thân tượng trưng cho tứ thân phụ mẫu" là diễn giải khẩu truyền / dân gian lan truyền về sau, không có văn bản quy chế chính thức trong thư tịch lịch sử cổ. Trong phạm vi tư liệu lịch sử AC đang sử dụng, Áo tứ thân Bắc Bộ được ghi nhận là trang phục truyền thống của người phụ nữ. Vì vậy, grounded MVP của AC chỉ hỗ trợ cấu hình người mặc nữ cho Áo tứ thân.'
    }
  }
};

/**
 * 26 Curated Options matching Section 4.2 table of BUILD BRIEF FINAL
 */
export const CURATED_OPTIONS: CuratedOption[] = [
  // 1. natural_straight
  {
    option_id: 'natural_straight',
    display_name: 'Phom suông tự nhiên',
    slot: 'silhouette',
    compatible_garments: ['ngu_than_chen', 'ao_tac'],
    default_for_garments: 'ALL',
    relation_type: 'cultural_trait',
    trait_level: 'strongly_characteristic',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-05'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 2. waist_fitted
  {
    option_id: 'waist_fitted',
    display_name: 'Chiết eo ôm sát',
    slot: 'silhouette',
    compatible_garments: ['ngu_than_chen', 'ao_tac'],
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'strongly_characteristic',
    risk_flag: 'CORE_ANATOMY_ALTERATION',
    evidence_refs: ['SRC-05'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 3. trach_tu_fitted
  {
    option_id: 'trach_tu_fitted',
    display_name: 'Tay chẽn bóp hẹp',
    slot: 'sleeves',
    compatible_garments: ['ngu_than_chen', 'ao_tac'],
    default_for_garments: ['ngu_than_chen'],
    relation_type: 'cultural_trait',
    trait_level: 'essential',
    risk_flag: 'CORE_ANATOMY_ALTERATION', // when applied to ao_tac
    evidence_refs: ['SRC-03', 'SRC-04'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 4. khoan_tu_wide_box
  {
    option_id: 'khoan_tu_wide_box',
    display_name: 'Tay thụng rộng chữ nhật',
    slot: 'sleeves',
    compatible_garments: ['ao_tac', 'ngu_than_chen'],
    default_for_garments: ['ao_tac'],
    relation_type: 'cultural_trait',
    trait_level: 'essential',
    risk_flag: 'CORE_ANATOMY_ALTERATION', // when applied to ngu_than_chen
    evidence_refs: ['SRC-04', 'SRC-05'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 5. right_flap_buttons
  {
    option_id: 'right_flap_buttons',
    display_name: 'Khuy cài nách phải',
    slot: 'closure',
    compatible_garments: ['ngu_than_chen', 'ao_tac'],
    default_for_garments: ['ngu_than_chen', 'ao_tac'],
    relation_type: 'cultural_trait',
    trait_level: 'essential',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-03', 'SRC-05'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 6. front_tied
  {
    option_id: 'front_tied',
    display_name: 'Buộc vạt trước bụng',
    slot: 'closure',
    compatible_garments: ['ao_tu_than'],
    default_for_garments: ['ao_tu_than'],
    relation_type: 'cultural_trait',
    trait_level: 'essential',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 7. front_buttons_closed
  {
    option_id: 'front_buttons_closed',
    display_name: 'Đóng cúc ngực kín',
    slot: 'closure',
    compatible_garments: ['ao_tu_than'],
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'essential',
    risk_flag: 'CORE_ANATOMY_ALTERATION',
    evidence_refs: ['SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 8. yem_separate
  {
    option_id: 'yem_separate',
    display_name: 'Yếm rời truyền thống',
    slot: 'inner_chest',
    compatible_garments: ['ao_tu_than'],
    default_for_garments: ['ao_tu_than'],
    relation_type: 'cultural_trait',
    trait_level: 'strongly_characteristic',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 9. yem_attached_mock
  {
    option_id: 'yem_attached_mock',
    display_name: 'Yếm may dính liền giả',
    slot: 'inner_chest',
    compatible_garments: ['ao_tu_than'],
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'supporting',
    risk_flag: 'PERFORMANCE_COSTUME_FLAG',
    evidence_refs: ['SRC-07'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 10. inner_none
  {
    option_id: 'inner_none',
    display_name: 'Không mặc yếm',
    slot: 'inner_chest',
    compatible_garments: ['ao_tu_than'],
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'strongly_characteristic',
    risk_flag: 'RECOGNIZABILITY_CHECK',
    evidence_refs: ['SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 11. silk_pants_wide
  {
    option_id: 'silk_pants_wide',
    display_name: 'Quần lụa ống rộng',
    slot: 'bottom',
    compatible_garments: 'ALL',
    default_for_garments: ['ngu_than_chen', 'ao_tac'],
    relation_type: 'cultural_trait',
    trait_level: 'variable',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-03', 'SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 12. vay_dup_black
  {
    option_id: 'vay_dup_black',
    display_name: 'Váy đụp đen',
    slot: 'bottom',
    compatible_garments: ['ao_tu_than'],
    default_for_garments: ['ao_tu_than'],
    relation_type: 'cultural_trait',
    trait_level: 'variable',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 13. tailored_trousers_straight
  {
    option_id: 'tailored_trousers_straight',
    display_name: 'Quần âu thụng đứng',
    slot: 'bottom',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: true
  },
  // 14. skinny_pants
  {
    option_id: 'skinny_pants',
    display_name: 'Quần jean/tây bó sát',
    slot: 'bottom',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'CONTEXT_CONFLICT_CHECK',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: true
  },
  // 15. natural_matte_silk_linen
  {
    option_id: 'natural_matte_silk_linen',
    display_name: 'Vải tự nhiên mộc/the',
    slot: 'material_finish',
    compatible_garments: 'ALL',
    default_for_garments: 'ALL',
    relation_type: 'cultural_trait',
    trait_level: 'supporting',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-05', 'SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 16. industrial_satin_gloss
  {
    option_id: 'industrial_satin_gloss',
    display_name: 'Lụa phi bóng nhân tạo',
    slot: 'material_finish',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'variable',
    risk_flag: 'PERFORMANCE_COSTUME_FLAG',
    evidence_refs: ['SRC-07'],
    evidence_status: 'VERIFIED',
    requires_eval: true
  },
  // 17. minimalist_sneaker
  {
    option_id: 'minimalist_sneaker',
    display_name: 'Sneaker trắng tối giản',
    slot: 'footwear',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: true
  },
  // 18. chunky_sneaker
  {
    option_id: 'chunky_sneaker',
    display_name: 'Chunky sneaker hầm hố',
    slot: 'footwear',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'CONTEXT_CONFLICT_CHECK',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: true
  },
  // 19. leather_loafer
  {
    option_id: 'leather_loafer',
    display_name: 'Loafer da cổ điển',
    slot: 'footwear',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: true
  },
  // 20. guoc_moc
  {
    option_id: 'guoc_moc',
    display_name: 'Guốc mộc truyền thống',
    slot: 'footwear',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'variable',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-05', 'SRC-06'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 21. outerwear_none
  {
    option_id: 'outerwear_none',
    display_name: 'Không khoác ngoài',
    slot: 'outerwear',
    compatible_garments: 'ALL',
    default_for_garments: 'ALL',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: false
  },
  // 22. oversized_blazer
  {
    option_id: 'oversized_blazer',
    display_name: 'Blazer khoác ngoài',
    slot: 'outerwear',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: true
  },
  // 23. modern_leather_tote
  {
    option_id: 'modern_leather_tote',
    display_name: 'Túi da hiện đại',
    slot: 'accessories',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: false
  },
  // 24. khan_dong_van
  {
    option_id: 'khan_dong_van',
    display_name: 'Khăn đóng / khăn vấn',
    slot: 'accessories',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'cultural_trait',
    trait_level: 'supporting',
    risk_flag: 'NONE',
    evidence_refs: ['SRC-03', 'SRC-04'],
    evidence_status: 'VERIFIED',
    requires_eval: false
  },
  // 25. stylized_tassel_fan
  {
    option_id: 'stylized_tassel_fan',
    display_name: 'Quạt cách điệu tua rua',
    slot: 'accessories',
    compatible_garments: 'ALL',
    default_for_garments: 'NONE',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'UNKNOWN_EVIDENCE_FLAG',
    evidence_refs: null,
    evidence_status: 'UNKNOWN',
    requires_eval: true
  },
  // 26. accessories_none
  {
    option_id: 'accessories_none',
    display_name: 'Không phụ kiện',
    slot: 'accessories',
    compatible_garments: 'ALL',
    default_for_garments: 'ALL',
    relation_type: 'styling_space',
    trait_level: null,
    risk_flag: 'NONE',
    evidence_refs: null,
    evidence_status: null,
    requires_eval: false
  }
];

/**
 * Deterministic Evidence Lookup for Prompt Injection
 */
export function getRelevantEvidenceFragments(
  garment_id: GarmentId,
  changed_slot: SlotId,
  new_value: string
): EvidenceFragment[] {
  const fragments: EvidenceFragment[] = [];

  // Sleeves check
  if (changed_slot === 'sleeves') {
    if (garment_id === 'ao_tac') {
      fragments.push({
        trait_id: 'ao_tac_sleeves_shape',
        trait_level: 'essential',
        claim: 'Ống tay Áo tấc được may thụng rộng hình chữ nhật (khoán tụ), không bóp nách và không bóp cổ tay.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-04', 'SRC-05']
      });
      fragments.push({
        trait_id: 'ao_tac_sleeve_dims',
        trait_level: 'variable',
        claim: 'Chiều rộng ống tay dao động khoảng 30–50 cm theo khảo sát hiện vật và may đo Huế.',
        evidence_status: 'APPROXIMATE',
        source_refs: ['SRC-04']
      });
      fragments.push({
        trait_id: 'ao_tac_sleeve_length',
        trait_level: 'variable',
        claim: 'Chiều dài tay áo buông dài qua đầu ngón tay khoảng một tấc theo ước lượng dân gian.',
        evidence_status: 'PROBABLE',
        source_refs: ['SRC-04']
      });
    } else if (garment_id === 'ngu_than_chen') {
      fragments.push({
        trait_id: 'ngu_than_chen_sleeves_shape',
        trait_level: 'essential',
        claim: 'Ống tay áo ngũ thân chẽn được may thu hẹp dần từ nách xuống đến cổ tay (trách tụ), ôm vừa vặn mu bàn tay.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-03', 'SRC-05']
      });
    }
  }

  // Silhouette check
  if (changed_slot === 'silhouette') {
    fragments.push({
      trait_id: 'ngu_than_silhouette_straight',
      trait_level: 'strongly_characteristic',
      claim: 'Phom áo ngũ thân (cả Chẽn và Tấc) là phom dáng suông buông tự nhiên, không chiết eo. Chiết eo ôm sát là đặc trưng của Áo dài tân thời TK20.',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05']
    });
  }

  // Closure check
  if (changed_slot === 'closure') {
    if (garment_id === 'ao_tu_than') {
      fragments.push({
        trait_id: 'tu_than_closure_open',
        trait_level: 'essential',
        claim: 'Thân trước Áo tứ thân mở độc lập, không có hàng khuy cài ngực; định hình phom bằng cách buông vạt hoặc buộc vạt trước bụng.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-06']
      });
    } else {
      fragments.push({
        trait_id: 'ngu_than_closure_buttons',
        trait_level: 'essential',
        claim: 'Hệ ngũ thân sử dụng hàng 5 khuy cài chéo từ chân cổ sang nách và sườn phải theo hình chữ quảng.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-03', 'SRC-05']
      });
    }
  }

  // Inner chest check (Tu than)
  if (changed_slot === 'inner_chest') {
    fragments.push({
      trait_id: 'tu_than_inner_yem',
      trait_level: 'strongly_characteristic',
      claim: 'Áo yếm là lớp nội phục che ngực truyền thống gắn liền với áo tứ thân mở vạt.',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06']
    });
    if (new_value === 'yem_attached_mock') {
      fragments.push({
        trait_id: 'tu_than_stage_mock_yem',
        trait_level: 'supporting',
        claim: 'Yếm may dính liền giả vào vạt áo ngoài là giải pháp phục trang biểu diễn sân khấu nửa sau thế kỷ 20 nhằm tiện thay đồ nhanh, không phải quy cách trang phục dân gian truyền thống.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-07']
      });
    }
  }

  // Material finish check
  if (changed_slot === 'material_finish') {
    if (new_value === 'industrial_satin_gloss') {
      fragments.push({
        trait_id: 'material_performance_satin',
        trait_level: 'variable',
        claim: 'Chất liệu lụa phi bóng nhân tạo bắt sáng mạnh là đặc trưng của phục trang sân khấu biểu diễn từ nửa sau thế kỷ 20, khác biệt với vải sợi tự nhiên mộc, đũi, sa, the truyền thống.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-07']
      });
    } else {
      fragments.push({
        trait_id: 'material_natural_fibers',
        trait_level: 'supporting',
        claim: 'Chất liệu truyền thống sử dụng sợi tự nhiên: tơ tằm, gấm, sa, đũi mộc mạc có độ rủ tự nhiên.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-05', 'SRC-06']
      });
    }
  }

  // Footwear & Styling space
  if (changed_slot === 'footwear') {
    if (garment_id === 'ao_tac') {
      fragments.push({
        trait_id: 'ao_tac_solemnity_function',
        trait_level: 'essential',
        claim: 'Áo tấc là lễ phục trang nghiêm trong nghi thức quan-hôn-tang-tế và tế tự đình miếu, đòi hỏi sự đoan trang, tề chỉnh trong tổng thể trang phục.',
        evidence_status: 'VERIFIED',
        source_refs: ['SRC-04', 'SRC-05']
      });
    }
  }

  // Accessories check
  if (changed_slot === 'accessories' && new_value === 'stylized_tassel_fan') {
    fragments.push({
      trait_id: 'unknown_tassel_fan',
      trait_level: 'variable',
      claim: 'Quạt xếp cách điệu kèm tua rua dài không có cứ liệu xác thực trong các thư tịch hay hiện vật y phục thời Nguyễn; có thể là phụ kiện cổ trang/phim ảnh đương đại.',
      evidence_status: 'UNKNOWN',
      source_refs: []
    });
  }

  return fragments;
}
