/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Full-Stack Server & Gemini Structured Reasoning Proxy
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Response Isolation & Marker Middleware
app.use('/api', (req, res, next) => {
  res.setHeader('X-AC-API-Response', '1');
  next();
});

app.use(express.static(path.resolve(__dirname, 'public')));

// Initialize GoogleGenAI client (user-agent 'aistudio-build' is mandatory)
const ai = new GoogleGenAI({
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const MODEL_NAME = 'gemini-3.8-flash';

// API Response Header Middleware: Ensure canonical X-AC-API-Response and Content-Type on all /api routes
app.use('/api', (req, res, next) => {
  res.setHeader('X-AC-API-Response', '1');
  res.setHeader('Content-Type', 'application/json');
  next();
});

/**
 * 1. Disambiguation Contextual Reasoning (Screen 2)
 * Constraints:
 * - 2 to 3 sentences in Vietnamese explaining suitability based on Occasion + Remix Intent.
 * - DO NOT force a single winner if both garments have valid contextual merits.
 */
app.post('/api/disambiguation-rationale', async (req, res) => {
  try {
    const { occasion, remix_intent, garments } = req.body;

    const prompt = `Bạn là chuyên gia thẩm định và phân tích Việt phục của hệ thống AC (AI Arena Vietnam 2026).
Dựa trên tài liệu gốc "AC — Research & Cultural Knowledge Master v1.0 FINAL":
Bối cảnh: ${occasion?.name} (${occasion?.solemnity}) - ${occasion?.tagline}.
Định hướng sáng tạo: ${remix_intent}.
Các dáng áo nền:
1. Áo ngũ thân tay chẽn (Trách tụ đoản y): Thường phục/tiện phục gọn gàng.
2. Áo tấc (Ngũ thân tay thụng / Khoán tụ): Lễ phục trang nghiêm quan-hôn-tang-tế.
3. Áo tứ thân: Trang phục truyền thống phụ nữ dân gian Bắc Bộ.

Yêu cầu:
- Viết 2–3 câu phân tích khách quan giải thích sự phù hợp của các dáng áo đối với bối cảnh và định hướng trên.
- TUYỆT ĐỐI KHÔNG ép buộc chỉ có duy nhất một áo "chuẩn nhất" nếu các áo đều có ưu thế riêng phù hợp bối cảnh (ví dụ: Áo tấc trang nghiêm cho lễ nghi, Áo chẽn linh hoạt cho dạo bước).
- Trả về JSON: {"rationale": "chuỗi phân tích 2-3 câu"}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rationale: { type: Type.STRING }
          },
          required: ['rationale']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error in /api/disambiguation-rationale:', error);
    return res.status(200).json({
      rationale:
        'Trong bối cảnh đã chọn, Áo tấc phát huy trọn vẹn sự trang nghiêm mực thước cho các nghi lễ cổ kính, trong khi Áo ngũ thân tay chẽn đem lại sự thanh thoát, linh hoạt cho hoạt động giao tế. Bạn có thể tự do chọn lựa dáng áo nền phù hợp nhất với phong thái mong muốn.'
    });
  }
});

/**
 * 2. Cultural Linter Evaluation (Screen 3)
 * Implements strict JSON Schema, Decoupling Principle, and Epistemic Humility.
 */
app.post('/api/evaluate-linter', async (req, res) => {
  const {
    request_id,
    state_version,
    context,
    garment_base,
    interaction_event,
    current_outfit_state,
    relevant_evidence_fragments
  } = req.body;

  try {
    const systemInstruction = `Bạn là Cultural Linter của hệ thống AC — Context-Aware Cultural Remix Co-pilot (AI Arena Vietnam 2026).
Nhiệm vụ: Thẩm định văn hóa cho một thay đổi cấu kiện (slot interaction) trong trang phục Việt phục.

HIẾN PHÁP NGUYÊN TẮC BẮT BUỘC:
1. NGUỒN CHUẨN: Chỉ sử dụng các bằng chứng được cung cấp từ Master v1.0. Không sáng tác thêm claim lịch sử hay biểu trưng triết lý ngoài nguồn.
2. NGUYÊN TẮC PHÂN TÁCH BẤT BIẾN (DECOUPLING PRINCIPLE):
   - CULTURAL IMPACT: 100% dựa trên giải phẫu học và quy chế lịch sử từ Master. Khách quan, trung tính.
   - CREATIVE SUGGESTION: 100% là CONTEMPORARY_STYLING_RECOMMENDATION. Tuyệt đối không biến gợi ý thời trang thành quy tắc lịch sử của người xưa. Trường này ĐƯỢC PHÉP null nếu không có gợi ý phù hợp hoặc khi thiếu bằng chứng.
3. KHIÊM TỐN TRI THỨC (EPISTEMIC HUMILITY):
   - Khi trạng thái là INSUFFICIENT_EVIDENCE:
     * reason_code: "EVIDENCE_INSUFFICIENT"
     * reasoning_basis: "UNKNOWN_OR_DISPUTED"
     * CẤM đoán mò xuất xứ ngoại lai (không tự gán là đồ Trung Quốc/Hàn Quốc/Nhật Bản).
     * creative_suggestion = null
     * alternative_action = null
     * Không đề xuất món đồ khác như thể món đó "chuẩn văn hóa hơn".
4. DEMO-CRITICAL CRITERIA:
   - Case 1: Áo tấc + Quần âu thụng + Loafer da đen trong Lễ Tết gia tộc -> PRESERVES_IDENTITY, reason_code NONE, reasoning_basis REASONABLE_INTERPRETATION.
   - Case 2: Đổi sang Chunky Sneaker trong Lễ Tết gia tộc -> CONTEXT_SENSITIVE, reason_code CONTEXT_FUNCTION_CONFLICT, reasoning_basis REASONABLE_INTERPRETATION (chỉ ra xung đột công năng lễ nghi).
   - Case 3: Đổi tay áo Áo tấc từ "Tay thụng rộng" sang "Tay chẽn bóp hẹp" -> CHANGES_CORE_IDENTIFICATION, reason_code CORE_TRAIT_CHANGED, reasoning_basis REASONABLE_INTERPRETATION (vì tay thụng là essential trait của Áo tấc, đổi sang tay chẽn làm biến dạng sang hệ Ngũ thân chẽn).
   - Case 4: Quạt cách điệu tua rua -> INSUFFICIENT_EVIDENCE, reason_code EVIDENCE_INSUFFICIENT, reasoning_basis UNKNOWN_OR_DISPUTED, creative_suggestion: null.

Output JSON BẮT BUỘC theo Schema quy định.`;

    const userPayload = JSON.stringify({
      request_id,
      state_version,
      context,
      garment_base,
      interaction_event,
      current_outfit_state,
      relevant_evidence_fragments
    }, null, 2);

    const callGemini = async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                enum: [
                  'PRESERVES_IDENTITY',
                  'CONTEXT_SENSITIVE',
                  'WEAKENS_RECOGNIZABILITY',
                  'CHANGES_CORE_IDENTIFICATION',
                  'INSUFFICIENT_EVIDENCE'
                ]
              },
              reason_code: {
                type: Type.STRING,
                enum: [
                  'NONE',
                  'CONTEXT_FUNCTION_CONFLICT',
                  'PERFORMANCE_COSTUME_ASSOCIATION',
                  'CORE_TRAIT_CHANGED',
                  'RECOGNIZABILITY_WEAKENED',
                  'EVIDENCE_INSUFFICIENT'
                ]
              },
              reasoning_basis: {
                type: Type.STRING,
                enum: [
                  'SOURCE_SUPPORTED_FACT',
                  'REASONABLE_INTERPRETATION',
                  'CONTEMPORARY_STYLING_RECOMMENDATION',
                  'UNKNOWN_OR_DISPUTED'
                ]
              },
              impacted_trait: { type: Type.STRING },
              trait_level: {
                type: Type.STRING,
                enum: ['essential', 'strongly_characteristic', 'supporting', 'variable', 'null']
              },
              cultural_impact: { type: Type.STRING },
              context_impact: { type: Type.STRING },
              evidence_status: {
                type: Type.STRING,
                enum: ['VERIFIED', 'PROBABLE', 'APPROXIMATE', 'DISPUTED', 'UNKNOWN']
              },
              evidence_anchors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              creative_suggestion: { type: Type.STRING },
              alternative_action: { type: Type.STRING },
              uncertainty_note: { type: Type.STRING }
            },
            required: [
              'status',
              'reason_code',
              'reasoning_basis',
              'impacted_trait',
              'trait_level',
              'cultural_impact',
              'context_impact',
              'evidence_status',
              'evidence_anchors'
            ]
          }
        }
      });
    };

    let response;
    try {
      response = await callGemini();
    } catch (firstErr) {
      console.warn('Gemini evaluation first attempt failed, retrying once...', firstErr);
      response = await callGemini(); // 1 retry attempt
    }

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Clean up 'null' strings from schema
    if (parsed.trait_level === 'null') parsed.trait_level = null;
    if (parsed.status === 'INSUFFICIENT_EVIDENCE') {
      parsed.creative_suggestion = null;
      parsed.alternative_action = null;
    }

    return res.status(200).json({
      request_id,
      state_version,
      evaluation: parsed
    });
  } catch (error) {
    console.error('Error during Linter Evaluation:', error);
    // Failure handling: return technical state EVALUATION_UNAVAILABLE
    // Non-blocking, neutral message, does not convert to PRESERVES_IDENTITY
    return res.status(200).json({
      request_id,
      state_version,
      evaluation: {
        status: 'EVALUATION_UNAVAILABLE',
        reason_code: 'NONE',
        reasoning_basis: 'UNKNOWN_OR_DISPUTED',
        impacted_trait: interaction_event?.option_metadata?.display_name || 'Cấu kiện vừa chọn',
        trait_level: null,
        cultural_impact: 'AC hiện chưa thể kiểm định thay đổi này do gián đoạn kết nối. Bạn vẫn có thể tiếp tục phối đồ tự do.',
        context_impact: 'Chưa có dữ liệu kiểm định cho bối cảnh hiện tại.',
        evidence_status: 'UNKNOWN',
        evidence_anchors: [],
        creative_suggestion: null,
        alternative_action: null,
        uncertainty_note: 'Hệ thống đang hoạt động ở chế độ ngoại tuyến tạm thời.'
      }
    });
  }
});

/**
 * 3. Dossier Synthesis (Screen 4)
 * SYNTHESIS ONLY:
 * - Exactly the 8 locked components
 * - Synthesizes only from final_outfit_state + active_evaluations + context + evidence_anchors
 * - NO obsolete alerts from evaluation_history
 * - NO invented attributes
 * - NO hyperbolic superlative praise
 */
app.post('/api/synthesize-dossier', async (req, res) => {
  const { final_outfit_state, active_evaluations, context, evidence_anchors } = req.body;

  try {
    const prompt = `Bạn là động cơ tổng hợp hồ sơ phục trang (Cultural Styling Dossier) của hệ thống AC.
BẢN CHẤT: SYNTHESIS ONLY.
Bạn CHỈ ĐƯỢC TỔNG HỢP từ dữ liệu thực tế sau đây, tuyệt đối không bịa đặt thêm phụ kiện hay chất liệu mà người dùng chưa chọn, không dùng thán từ sáo rỗng ("hoàn hảo tuyệt đối", "chuẩn mực nhất").

DỮ LIỆU HIỆN HÀNH:
- Bối cảnh: ${context?.occasion_name} (${context?.occasion_id}), Định hướng: ${context?.remix_intent}
- Áo nền: ${final_outfit_state?.garment_name} (${final_outfit_state?.garment_id})
- Cấu hình thực tế:
  * Phom dáng: ${final_outfit_state?.silhouette}
  * Tay áo: ${final_outfit_state?.sleeves}
  * Khuy cài: ${final_outfit_state?.closure}
  * Lớp ngực/yếm: ${final_outfit_state?.inner_chest}
  * Hạ phục: ${final_outfit_state?.bottom}
  * Chất liệu: ${final_outfit_state?.material_finish}
  * Giày dép: ${final_outfit_state?.footwear}
  * Áo khoác: ${final_outfit_state?.outerwear}
  * Phụ kiện: ${final_outfit_state?.accessories}
- Active Validated Evaluations (ĐÃ LOẠI BỎ HẾT CÁC CẢNH BÁO ĐÃ REVERT TRONG LỊCH SỬ):
${JSON.stringify(active_evaluations, null, 2)}
- Evidence Anchors: ${JSON.stringify(evidence_anchors)}

Yêu cầu xuất JSON chứa đúng 8 thành phần cấu trúc đã khóa:
1. visual_outfit_summary: tóm tắt cấu hình trang phục.
2. overall_cultural_status: PRESERVES_IDENTITY, CONTEXT_SENSITIVE, WEAKENS_RECOGNIZABILITY, CHANGES_CORE_IDENTIFICATION, hoặc INSUFFICIENT_EVIDENCE (tính từ active_evaluations hiện có).
3. what_you_kept: mảng các đặc trưng truyền thống được bảo toàn.
4. what_you_remixed: mảng các yếu tố đương đại đã biến tấu.
5. cultural_impact_summary: 1 đoạn văn phân tích tác động văn hóa dựa trên Master v1.0.
6. contemporary_styling_rationale: 1 đoạn văn giải thích lý do phối kiểu đương đại (CONTEMPORARY_STYLING_RECOMMENDATION).
7. evidence_anchors: mảng các mã nguồn (SRC-03 đến SRC-07).
8. context_note: lưu ý thực tế khi mặc trong dịp này.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visual_outfit_summary: {
              type: Type.OBJECT,
              properties: {
                garment_name: { type: Type.STRING },
                silhouette_label: { type: Type.STRING },
                sleeves_label: { type: Type.STRING },
                closure_label: { type: Type.STRING },
                inner_chest_label: { type: Type.STRING },
                bottom_label: { type: Type.STRING },
                material_finish_label: { type: Type.STRING },
                footwear_label: { type: Type.STRING },
                outerwear_label: { type: Type.STRING },
                accessories_label: { type: Type.STRING }
              },
              required: [
                'garment_name',
                'silhouette_label',
                'sleeves_label',
                'closure_label',
                'inner_chest_label',
                'bottom_label',
                'material_finish_label',
                'footwear_label',
                'outerwear_label',
                'accessories_label'
              ]
            },
            overall_cultural_status: {
              type: Type.STRING,
              enum: [
                'PRESERVES_IDENTITY',
                'CONTEXT_SENSITIVE',
                'WEAKENS_RECOGNIZABILITY',
                'CHANGES_CORE_IDENTIFICATION',
                'INSUFFICIENT_EVIDENCE'
              ]
            },
            what_you_kept: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            what_you_remixed: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            cultural_impact_summary: { type: Type.STRING },
            contemporary_styling_rationale: { type: Type.STRING },
            evidence_anchors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            context_note: { type: Type.STRING }
          },
          required: [
            'visual_outfit_summary',
            'overall_cultural_status',
            'what_you_kept',
            'what_you_remixed',
            'cultural_impact_summary',
            'contemporary_styling_rationale',
            'evidence_anchors',
            'context_note'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.status(200).json({ dossier: parsed });
  } catch (error) {
    console.error('Error in /api/synthesize-dossier:', error);
    return res.status(200).json({
      dossier: getFallbackDossier(final_outfit_state, active_evaluations, context, evidence_anchors)
    });
  }
});

// Fallback logic for offline or failed calls
function getFallbackLinterResult(garment_base: any, interaction_event: any, context: any) {
  const slot = interaction_event?.changed_slot;
  const newVal = interaction_event?.new_value;
  const occasionId = context?.occasion_id;

  // Case 3: sleeves trach_tu_fitted on ao_tac
  if (slot === 'sleeves' && newVal === 'trach_tu_fitted' && garment_base?.id === 'ao_tac') {
    return {
      status: 'CHANGES_CORE_IDENTIFICATION',
      reason_code: 'CORE_TRAIT_CHANGED',
      reasoning_basis: 'REASONABLE_INTERPRETATION',
      impacted_trait: 'Ống tay áo thụng rộng hình chữ nhật (khoán tụ)',
      trait_level: 'essential',
      cultural_impact: 'Ống tay thụng rộng là đặc trưng thiết yếu định danh Áo tấc trước Ngũ thân tay chẽn. Việc thu hẹp ống tay thành tay chẽn làm trang phục dịch chuyển hoàn toàn sang diện mạo Áo ngũ thân tay chẽn.',
      context_impact: 'Làm mất đi tư thế chắp tay giao thụng trang nghiêm của lễ phục thời Nguyễn.',
      evidence_status: 'VERIFIED',
      evidence_anchors: ['SRC-04', 'SRC-05'],
      creative_suggestion: 'Nếu bạn cần ống tay gọn gàng để cử động linh hoạt, hãy chọn trang phục nền là Áo ngũ thân tay chẽn (thường phục quy chuẩn).',
      alternative_action: 'Giữ ống tay thụng rộng chữ nhật để bảo toàn nhận diện Áo tấc.',
      uncertainty_note: null
    };
  }

  // Case 2: chunky_sneaker with ao_tac in tet_temple
  if (slot === 'footwear' && newVal === 'chunky_sneaker' && garment_base?.id === 'ao_tac' && occasionId === 'tet_temple') {
    return {
      status: 'CONTEXT_SENSITIVE',
      reason_code: 'CONTEXT_FUNCTION_CONFLICT',
      reasoning_basis: 'REASONABLE_INTERPRETATION',
      impacted_trait: 'Giày dép & Công năng bối cảnh',
      trait_level: null,
      cultural_impact: 'Áo tấc là lễ phục trang nghiêm trong nghi thức tế tự đình miếu và gia tộc. Giày sneaker hầm hố có phom dáng nặng nề xung đột trực tiếp với tính chất đoan chính, khiêm cung của không gian tâm linh.',
      context_impact: 'Có thể tạo cảm giác thiếu hòa hợp trong nghi lễ cúng bái gia tiên ngày Tết.',
      evidence_status: 'VERIFIED',
      evidence_anchors: ['SRC-04'],
      creative_suggestion: 'Nếu muốn êm chân khi di chuyển nhiều, bạn có thể chọn sneaker trắng tối giản đơn sắc hoặc giày loafer da cổ điển.',
      alternative_action: 'Thay bằng Loafer da đen hoặc Guốc mộc truyền thống.',
      uncertainty_note: null
    };
  }

  // Case 4: stylized_tassel_fan
  if (slot === 'accessories' && newVal === 'stylized_tassel_fan') {
    return {
      status: 'INSUFFICIENT_EVIDENCE',
      reason_code: 'EVIDENCE_INSUFFICIENT',
      reasoning_basis: 'UNKNOWN_OR_DISPUTED',
      impacted_trait: 'Quạt xếp cách điệu tua rua',
      trait_level: null,
      cultural_impact: 'Chưa tìm thấy tư liệu lịch sử hoặc hiện vật khảo cổ thời Nguyễn ghi nhận quy cách quạt xếp kèm tua rua dài này trong phục trang truyền thống.',
      context_impact: 'Có nguy cơ gây nhầm lẫn với phụ kiện phim ảnh cổ trang ngoại lai.',
      evidence_status: 'UNKNOWN',
      evidence_anchors: [],
      creative_suggestion: null,
      alternative_action: null,
      uncertainty_note: 'Hệ thống chưa đủ căn cứ chứng minh, không tự suy diễn xuất xứ.'
    };
  }

  // Case 1: Tailored trousers or loafer (Preserves identity)
  return {
    status: 'PRESERVES_IDENTITY',
    reason_code: 'NONE',
    reasoning_basis: 'REASONABLE_INTERPRETATION',
    impacted_trait: interaction_event?.option_metadata?.display_name || 'Hạ phục / Phụ kiện',
    trait_level: 'variable',
    cultural_impact: 'Cấu trúc cốt lõi của thân áo và cổ đứng được bảo toàn nguyên vẹn. Lựa chọn hạ phục/phụ kiện này giữ được độ buông suông trang nhã mà không làm sai lệch nhận diện lịch sử.',
    context_impact: 'Phù hợp với bối cảnh giao lưu và giữ được nét lịch thiệp, đĩnh đạc.',
    evidence_status: 'VERIFIED',
    evidence_anchors: ['SRC-04', 'SRC-05'],
    creative_suggestion: 'Phối màu đơn sắc giữa quần và giày giúp tôn lên đường nét của tà áo chính.',
    alternative_action: null,
    uncertainty_note: null
  };
}

function getFallbackDossier(finalState: any, activeEvals: any, context: any, anchors: any) {
  const evals = Object.values(activeEvals || {}) as any[];
  let overall: any = 'PRESERVES_IDENTITY';
  if (evals.some(e => e.status === 'CHANGES_CORE_IDENTIFICATION')) overall = 'CHANGES_CORE_IDENTIFICATION';
  else if (evals.some(e => e.status === 'WEAKENS_RECOGNIZABILITY')) overall = 'WEAKENS_RECOGNIZABILITY';
  else if (evals.some(e => e.status === 'CONTEXT_SENSITIVE')) overall = 'CONTEXT_SENSITIVE';
  else if (evals.some(e => e.status === 'INSUFFICIENT_EVIDENCE')) overall = 'INSUFFICIENT_EVIDENCE';

  return {
    visual_outfit_summary: {
      garment_name: finalState?.garment_name || 'Áo tấc (Ngũ thân tay thụng)',
      silhouette_label: finalState?.silhouette || 'Phom suông tự nhiên',
      sleeves_label: finalState?.sleeves || 'Tay thụng rộng chữ nhật',
      closure_label: finalState?.closure || 'Khuy cài nách phải',
      inner_chest_label: finalState?.inner_chest || 'Yếm rời truyền thống',
      bottom_label: finalState?.bottom || 'Quần âu thụng đứng',
      material_finish_label: finalState?.material_finish || 'Vải tự nhiên mộc/the',
      footwear_label: finalState?.footwear || 'Loafer da cổ điển',
      outerwear_label: finalState?.outerwear || 'Không khoác ngoài',
      accessories_label: finalState?.accessories || 'Không phụ kiện'
    },
    overall_cultural_status: overall,
    what_you_kept: [
      'Phom dáng thân áo ngũ thân cổ đứng (lập lĩnh) chuẩn mực thời Nguyễn',
      'Quy cách đóng mở hàng khuy cài nách phải hình chữ quảng',
      'Ống tay thụng rộng hình chữ nhật (khoán tụ) đặc trưng của lễ phục',
      'Chất liệu sợi tự nhiên mộc mạc tôn độ rủ trang nhã'
    ],
    what_you_remixed: [
      `Hạ phục: ${finalState?.bottom || 'Quần âu thụng đứng'} thay thế cho quần lụa trắng truyền thống`,
      `Giày: ${finalState?.footwear || 'Loafer da cổ điển'} phong cách đương đại`,
      finalState?.accessories && finalState.accessories !== 'Không phụ kiện' ? `Phụ kiện: ${finalState.accessories}` : 'Không sử dụng phụ kiện rườm rà'
    ],
    cultural_impact_summary:
      'Bản phối bảo toàn cấu trúc thân áo và quy cách nhận diện cốt lõi theo Master v1.0. Các biến tấu ở tầng hạ phục và giày da tạo điểm nhấn thanh lịch hiện đại mà không phá vỡ tính trang trọng của trang phục.',
    contemporary_styling_rationale:
      'Sự kết hợp giữa phom áo truyền thống và quần âu thụng cùng giày da tối giản mang lại sự thoải mái, thuận tiện cho người trẻ khi di chuyển trong các không gian sự kiện.',
    evidence_anchors: anchors && anchors.length > 0 ? anchors : ['SRC-04', 'SRC-05'],
    context_note: `Rất phù hợp cho ${context?.occasion_name || 'dịp sự kiện trang trọng'}, cân bằng hài hòa giữa bản sắc cội nguồn và phong cách cá nhân.`
  };
}

import {
  PALETTES,
  FABRICS,
  LOWER_GARMENTS,
  FOOTWEAR,
  ACCESSORIES,
  type PaletteOption
} from './src/data/canonicalCatalog';
import { routeGeminiTask } from './server/services/modelRouter';
import { TASK_A_MODEL_POOL, TASK_B_MODEL_POOL, TASK_C_MODEL_POOL } from './server/services/modelRegistry';
import { compileVisualPrompt } from './server/services/visualPromptCompiler';
import { GeminiImageProvider } from './server/services/geminiImageProvider';
import { OpenAIImageProvider } from './server/services/openAIImageProvider';
import { ephemeralImageStore } from './server/services/ephemeralImageStore';
import { computeOutfitFingerprint } from './src/shared/fingerprint';
import { ImageProviderError, ImageProvider } from './server/services/imageProvider';
import type { GenerateLookbookRequest, GenerateLookbookResponse, CulturalVisualQAOutput, RawTraitEvidence, RawOutfitFidelityEvidence, GarmentId, GenderPresentation } from './src/types/index';
import {
  CANONICAL_GARMENT_TRAITS,
  aggregateCulturalVisualQA,
  buildGroundedCorrectionPlan,
  QA_SCHEMA_VERSION,
  CULTURAL_KNOWLEDGE_VERSION,
  VISUAL_AUDIT_POLICY_VERSION
} from './server/services/visualQAAggregator';
import {
  validateAndEnforceRecommendationPolicy,
  getPolicyCompatibleAccessories,
  isFanRequestedExplicitly,
  isPearlRequestedExplicitly,
  extractContextPropsFromPrompt
} from './server/services/culturalPolicyService';
import {
  buildACChatGroundingContext,
  AC_CHAT_SYSTEM_INSTRUCTION,
  validateAndSanitizeACChatResponse,
  getOfflineACChatResponse
} from './server/services/acChatService';
import { globalActionRegistry } from './server/services/actionRegistry';
import type { ACChatRequestPayload, ACChatResponse, ACChatMutatePayload } from './src/types/index';

// ==========================================
// PHASE 2B & 2C CACHES & PROVIDER SETUP
// ==========================================
const providerType = (process.env.IMAGE_PROVIDER || 'gemini').toLowerCase();
const imageProvider: ImageProvider =
  providerType === 'openai' ? new OpenAIImageProvider() : new GeminiImageProvider();
const generationInFlightByFingerprint = new Map<string, Promise<GenerateLookbookResponse>>();
const serverVisualQACache = new Map<string, CulturalVisualQAOutput>();

// ==========================================
// PHASE 2A.5 RUNTIME STABILITY CONTROLS
// ==========================================

// Server In-Flight Promise Dedup with Multi-Consumer Abort Safety (Delta #9 & #10)
interface InFlightServerEntry<T> {
  promise: Promise<T>;
  consumers: Set<() => boolean>;
}
const serverInFlightCalls = new Map<string, InFlightServerEntry<any>>();

async function dedupeServerCall<T>(
  key: string,
  fn: (isTaskCurrent: () => boolean) => Promise<T>,
  isConsumerActive?: () => boolean
): Promise<T> {
  const consumerCheck = isConsumerActive || (() => true);
  let entry = serverInFlightCalls.get(key);

  if (entry) {
    entry.consumers.add(consumerCheck);
    try {
      return await entry.promise;
    } finally {
      entry.consumers.delete(consumerCheck);
    }
  }

  const consumers = new Set<() => boolean>([consumerCheck]);
  const isTaskCurrent = () => {
    // Returns true if at least one attached consumer is still active
    for (const check of consumers) {
      if (check()) return true;
    }
    return false;
  };

  const promise = (async () => {
    try {
      return await fn(isTaskCurrent);
    } finally {
      serverInFlightCalls.delete(key);
    }
  })();

  entry = { promise, consumers };
  serverInFlightCalls.set(key, entry);

  try {
    return await promise;
  } finally {
    entry.consumers.delete(consumerCheck);
  }
}

// Server Session Caches with Garment Verification (Model-Agnostic)
interface ServerBlueprintRecord {
  garmentId: string;
  requestKey: string;
  blueprint: any;
  createdAt: number;
}
const serverRecommendationCache = new Map<string, any>();
const serverBlueprintCache = new Map<string, ServerBlueprintRecord>();

/**
 * PHASE 2A.5: 2-CALL DECOUPLED PIPELINE WITH TASK-AWARE MULTI-MODEL ROUTER
 * 
 * CALL A: Garment Recommendation
 * Task: 'RECOMMENDATION'
 * Pool: TASK_A_MODEL_POOL (gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> gemini-3.5-flash)
 */
app.post('/api/recommend-garment', async (req, res) => {
  const { promptText, selectedOccasion, selectedStyle, traditionalRatio, genderPresentation } = req.body;
  const effectiveGender: GenderPresentation = genderPresentation || 'nam';

  const cacheKey = [
    (promptText || '').trim().toLowerCase(),
    selectedOccasion || 'tet',
    selectedStyle || 'tre_trung',
    typeof traditionalRatio === 'number' ? traditionalRatio : 50,
    effectiveGender
  ].join('|');

  // 1. Server Cache Check
  if (serverRecommendationCache.has(cacheKey)) {
    return res.status(200).json(serverRecommendationCache.get(cacheKey));
  }

  try {
    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });
    const isConsumerActive = () => !clientDisconnected;
    const result = await dedupeServerCall(cacheKey, async (isTaskCurrent) => {
      const systemInstruction = `Bạn là Chuyên gia Đề xuất Việt phục của hệ thống AC — Context-Aware Cultural Remix Co-pilot (AI Arena Vietnam 2026).
Nhiệm vụ: Phân tích bối cảnh và chọn ra dáng áo nền tảng phù hợp nhất trong đúng 3 dáng áo được hỗ trợ:
1. 'ngu_than_chen' (Áo ngũ thân tay chẽn / Trách tụ đoản y): Thường phục/tiện phục gọn gàng, tay bóp hẹp dần về cổ tay, tối ưu cho sinh hoạt, di chuyển linh hoạt, dạo phố kỷ niệm, lễ tốt nghiệp năng động. Có chứng cứ lịch sử xác thực cho cả nam và nữ.
2. 'ao_tac' (Áo tấc / Ngũ thân tay thụng / Khoán tụ): Lễ phục trang nghiêm quan-hôn-tang-tế, cúng đình miếu, tế tự tổ tiên, chúc Tết gia tộc, đám cưới nghi lễ trang trọng, ống tay may thụng rộng hình chữ nhật buông dài quá bàn tay. Có chứng cứ lịch sử xác thực cho cả nam và nữ. Tránh ưu tiên cho dạo phố thường nhật khi có trang phục khác tiện lợi hơn.
3. 'ao_tu_than' (Áo tứ thân): Trang phục truyền thống dân gian phụ nữ Bắc Bộ, 4 thân mở vạt trước buộc hoặc buông phối cùng yếm, mớ ba mớ bảy hội hè, chụp ảnh kỷ niệm nghệ thuật, giao lưu văn hóa dân gian.

QUY TẮC TƯƠNG THÍCH NGƯỜI MẶC (CULTURAL PRODUCT RULES V1.1):
- Ngũ thân tay chẽn: Tương thích cả Nam và Nữ khi bối cảnh phù hợp.
- Áo tấc: Tương thích cả Nam và Nữ cho bối cảnh trang nghiêm / lễ nghi.
- Áo tứ thân:
  * Nữ: Có chứng cứ lịch sử xác thực, tự động đề xuất khi phù hợp dịp/công năng.
  * Nam: Chưa xác lập quy chế mặc lịch sử mặc định trong tư liệu Bắc Bộ hiện có. TUYỆT ĐỐI KHÔNG tự động đề xuất áo tứ thân cho nam giới như trang phục lịch sử mặc định. Chỉ cho phép khi người dùng bày tỏ rõ ý định tiếp biến/cách tân đương đại, và phần rationale BẮT BUỘC ghi rõ đây là thể nghiệm tiếp biến đương đại.
  * 'neutral' (Không ưu tiên): Là trạng thái lựa chọn của người dùng, không phải tuyên bố phi giới tính lịch sử. Với bối cảnh truyền thống áo tứ thân, lấy hồ sơ trang phục phụ nữ Bắc Bộ làm căn cứ chuẩn mực.

Quy tắc phán quyết:
- primary: { garmentId, rationale } (1-2 câu giải thích khách quan theo công năng và bối cảnh).
- alternative: { garmentId, rationale } | null (CHỈ TRẢ VỀ KHI CÓ PHƯƠNG ÁN THỨ HAI THỰC SỰ HỢP LÝ; NẾU KHÔNG CÓ PHƯƠNG ÁN NÀO HỢP LÝ THÌ TRẢ VỀ NULL).
- Phản hồi định dạng JSON khớp chính xác schema.`;

      const userContent = JSON.stringify({
        promptText: promptText || '',
        selectedOccasion: selectedOccasion || 'tet',
        selectedStyle: selectedStyle || 'tre_trung',
        traditionalRatio: typeof traditionalRatio === 'number' ? traditionalRatio : 50,
        genderPresentation: effectiveGender
      });

      const routeResult = await routeGeminiTask({
        task: 'RECOMMENDATION',
        requestId: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        isStillCurrent: isTaskCurrent,
        executeWithModel: async (modelId) => {
          const response = await ai.models.generateContent({
            model: modelId,
            contents: userContent,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  primary: {
                    type: Type.OBJECT,
                    properties: {
                      garmentId: { type: Type.STRING, enum: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'] },
                      rationale: { type: Type.STRING }
                    },
                    required: ['garmentId', 'rationale']
                  },
                  alternative: {
                    type: Type.OBJECT,
                    nullable: true,
                    properties: {
                      garmentId: { type: Type.STRING, enum: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'] },
                      rationale: { type: Type.STRING }
                    },
                    required: ['garmentId', 'rationale']
                  }
                },
                required: ['primary']
              }
            }
          });

          const parsed = JSON.parse(response.text?.trim() || '{}');
          if (!parsed.primary || !parsed.primary.garmentId) {
            throw new Error('Invalid Gemini Recommendation schema response');
          }
          return parsed;
        }
      });

      // Deterministic Post-Model Cultural Product Rules v1.1 Validation & Enforcement
      const policyEnforced = validateAndEnforceRecommendationPolicy(routeResult.result, {
        wearer: effectiveGender,
        occasion: selectedOccasion,
        style: selectedStyle,
        traditionalRatio: typeof traditionalRatio === 'number' ? traditionalRatio : 50,
        promptText
      });

      return policyEnforced;
    });

    serverRecommendationCache.set(cacheKey, result);
    return res.status(200).json(result);
  } catch (error: any) {
    const status = error?.status || 503;
    const code = error?.code || 'NO_COMPATIBLE_MODEL_AVAILABLE';
    const message = error?.message || 'Dịch vụ AI đang tạm thời không khả dụng. Vui lòng thử lại sau.';
    const retryable = error?.retryable ?? true;
    console.error('Error in /api/recommend-garment:', code, error?.message || error);
    return res.status(status).json({ status, code, message, retryable });
  }
});

/**
 * CALL B: Blueprint Generation
 * Task: 'BLUEPRINT'
 * Pool: TASK_B_MODEL_POOL (gemini-3.8-flash -> gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash -> gemini-3.5-flash-lite)
 */
app.post('/api/generate-blueprint', async (req, res) => {
  const { selectedGarmentId, promptText, selectedOccasion, selectedStyle, traditionalRatio, genderPresentation } = req.body;
  const effectiveGender: GenderPresentation = genderPresentation || 'nam';
  const effectiveRatio = typeof traditionalRatio === 'number' ? traditionalRatio : 50;

  const cacheKey = [
    selectedGarmentId,
    (promptText || '').trim().toLowerCase(),
    selectedOccasion || 'tet',
    selectedStyle || 'tre_trung',
    effectiveRatio,
    effectiveGender
  ].join('|');

  // 1. Server Cache Check (Strict garmentId + requestKey match)
  const cached = serverBlueprintCache.get(cacheKey);
  if (cached && cached.garmentId === selectedGarmentId && cached.requestKey === cacheKey) {
    return res.status(200).json(cached.blueprint);
  }

  try {
    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });
    const isConsumerActive = () => !clientDisconnected;
    const result = await dedupeServerCall(cacheKey, async (isTaskCurrent) => {
      const compatibleAccessories = getPolicyCompatibleAccessories({
        garmentId: selectedGarmentId,
        wearer: effectiveGender,
        occasion: selectedOccasion,
        style: selectedStyle,
        traditionalRatio: effectiveRatio,
        promptText
      });

      const catalogContext = {
        PALETTES: PALETTES.map(p => ({ id: p.id, hex: p.hex, name: p.name })),
        FABRICS: FABRICS.map(f => ({ id: f.id, label: f.label })),
        LOWER_GARMENTS: LOWER_GARMENTS.map(l => ({ id: l.id, label: l.label })),
        FOOTWEAR: FOOTWEAR.map(f => ({ id: f.id, label: f.label })),
        ACCESSORIES: compatibleAccessories.map(a => ({ id: a.id, label: a.label }))
      };

      const systemInstruction = `Bạn là Chuyên gia Thiết kế Phối đồ (Blueprint Generator) của hệ thống AC (AI Arena Vietnam 2026).
Nhiệm vụ: Sinh bản phối thời trang đương đại cho CHÍNH XÁC dáng áo được chỉ định: "${selectedGarmentId}", người mặc: "${effectiveGender}".

QUY TẮC PHỐI MÀU (COHESIVE PALETTE & COLOR INTENT PARSING):
- Bảng màu trả về là MỘT BỘ HÒA SẮC gồm đúng 3 màu phối hợp hoàn chỉnh cho cả outfit:
  * role = 'PRIMARY': Màu chủ đạo
  * role = 'SUPPORTING': Màu phối cùng
  * role = 'ACCENT': Màu điểm nhấn
- origin: 'USER_REQUESTED' (nếu là màu do người dùng yêu cầu), 'AC_SUGGESTED' (nếu do AC đề xuất bổ trợ).
- Xử lý ý định màu sắc từ promptText của người dùng:
  * 0 màu (User không nhắc màu): Tự do đề xuất 3 màu hài hòa nhất từ PALETTES theo dáng áo, dịp và tỷ lệ truyền thống.
  * 1 màu (User nêu 1 màu, ví dụ "đỏ"): Khóa màu đó trong palette làm 'PRIMARY' (USER_REQUESTED), đề xuất thêm 2 màu 'SUPPORTING' và 'ACCENT' (AC_SUGGESTED).
  * 2 màu (User nêu 2 màu, ví dụ "xanh và trắng"): Khóa cả 2 màu (USER_REQUESTED), đề xuất thêm 1 màu thứ ba (AC_SUGGESTED).
  * Đúng 3 màu (User nêu 3 màu cụ thể): Khóa đủ 3 màu người dùng yêu cầu (USER_REQUESTED).
  * Trên 3 màu (User liệt kê > 3 màu): Tinh gọn về bộ 3 màu có vai trò rõ nhất (chủ đạo, phụ, điểm nhấn) và BẮT BUỘC bổ sung 1 câu lưu ý trong contextCautions giải thích rằng bảng phối đã được tinh gọn về 3 sắc thái hài hòa.
  * Ràng buộc phủ định ("Không dùng màu X", "Tránh màu X", ví dụ "không dùng màu đen"): BẮT BUỘC loại trừ hoàn toàn màu X khỏi palette đề xuất.
  * Tôn trọng từ khóa như "chủ đạo" (PRIMARY), "điểm nhấn" (ACCENT).

QUY TẮC LỰA CHỌN PHỤ KIỆN VÀ GIÀY DÉP (CULTURAL PRODUCT RULES V1.1):
- footwearId: Chọn DUY NHẤT 1 ID từ danh mục FOOTWEAR (ví dụ: 'leather_loafer', 'classic_oxford', 'guoc_moc_truyen_thong', 'chunky_sneaker', 'mule_minimalist', 'strappy_sandals'). TUYỆT ĐỐI KHÔNG đưa giày dép vào mảng phụ kiện.
- accessoryIds: BẮT BUỘC chỉ chọn từ danh mục ACCESSORIES đã được sàng lọc tương thích theo dáng áo, người mặc và bối cảnh ở trên.
  * Đề xuất từ 0 đến TỐI ĐA 2 phụ kiện. NẾU danh mục ACCESSORIES rỗng hoặc không có phụ kiện phù hợp, accessoryIds BẮT BUỘC là mảng rỗng [] (Ưu tiên không phụ kiện hơn là tự bịa phụ kiện).
  * TUYỆT ĐỐI KHÔNG tự tiện suy diễn trâm cài tóc cho nữ, ngọc bội cho nam áo tấc, hoặc biến chuỗi ngọc trai / quạt cầm tay thành trang phục truyền thống mặc định.

BẮT BUỘC chỉ chọn các Canonical ID từ danh mục Catalog được cung cấp:
${JSON.stringify(catalogContext, null, 2)}

Yêu cầu lựa chọn:
1. palette: Đúng 3 đối tượng màu [{ id, hex, name, role, origin }] tạo thành bộ hòa sắc thống nhất.
2. fabricId: Đúng 1 ID từ FABRICS.
3. lowerGarmentId: Đúng 1 ID từ LOWER_GARMENTS.
4. footwearId: Đúng 1 ID từ FOOTWEAR.
5. accessoryIds: Mảng từ 0 đến tối đa 2 IDs từ ACCESSORIES (tuyệt đối không chứa giày dép; [] nếu không có phụ kiện phù hợp).
6. contextCautions: Mảng 2-3 câu lưu ý sắc bén về bối cảnh di chuyển, nghi thức và nhận diện cốt lõi (do AI suy luận).

BẮT BUỘC trả về JSON theo schema.`;

      const userContent = JSON.stringify({
        selectedGarmentId,
        promptText: promptText || '',
        selectedOccasion: selectedOccasion || 'tet',
        selectedStyle: selectedStyle || 'tre_trung',
        traditionalRatio: effectiveRatio,
        genderPresentation: effectiveGender
      });

      const blueprintSchema = {
        type: Type.OBJECT,
        properties: {
          garmentId: { type: Type.STRING, enum: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'] },
          remixProposal: {
            type: Type.OBJECT,
            properties: {
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING, enum: ['PRIMARY', 'SUPPORTING', 'ACCENT'] },
                    origin: { type: Type.STRING, enum: ['USER_REQUESTED', 'AC_SUGGESTED'] }
                  },
                  required: ['id', 'hex', 'name', 'role']
                }
              },
              fabricId: { type: Type.STRING },
              lowerGarmentId: { type: Type.STRING },
              footwearId: { type: Type.STRING },
              accessoryIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['palette', 'fabricId', 'lowerGarmentId', 'footwearId', 'accessoryIds']
          },
          contextCautions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['garmentId', 'remixProposal', 'contextCautions']
      };

      const routeResult = await routeGeminiTask({
        task: 'BLUEPRINT',
        requestId: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        isStillCurrent: isTaskCurrent,
        executeWithModel: async (modelId) => {
          const response = await ai.models.generateContent({
            model: modelId,
            contents: userContent,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: blueprintSchema
            }
          });

          const parsed = JSON.parse(response.text?.trim() || '{}');
          if (!parsed.remixProposal) {
            const err: any = new Error('Invalid Gemini Blueprint schema response');
            err.rawOutput = response.text;
            throw err;
          }
          return sanitizeBlueprintOutput(selectedGarmentId, parsed, promptText, {
            wearer: effectiveGender,
            occasion: selectedOccasion,
            style: selectedStyle,
            traditionalRatio: effectiveRatio
          });
        },
        repairWithModel: async (modelId, rawOutput, errorMsg) => {
          const repairPrompt = `Lược đồ trả về trước đó bị lỗi cú pháp hoặc thiếu trường: ${errorMsg}. Vui lòng tạo lại JSON hợp lệ tuân thủ chính xác schema và danh mục canonical được cung cấp.`;
          const response = await ai.models.generateContent({
            model: modelId,
            contents: [
              { role: 'user', parts: [{ text: userContent }] },
              { role: 'model', parts: [{ text: typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput) }] },
              { role: 'user', parts: [{ text: repairPrompt }] }
            ],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: blueprintSchema
            }
          });

          const parsed = JSON.parse(response.text?.trim() || '{}');
          if (!parsed.remixProposal) {
            throw new Error('Repaired Blueprint output is still invalid');
          }
          return sanitizeBlueprintOutput(selectedGarmentId, parsed, promptText, {
            wearer: effectiveGender,
            occasion: selectedOccasion,
            style: selectedStyle,
            traditionalRatio: effectiveRatio
          });
        }
      });

      console.log('[BlueprintHTTP] ROUTER_RESULT_READY', {
        requestId: routeResult.routeMeta?.generatedByModel || 'bp_success',
        garmentId: selectedGarmentId
      });

      return routeResult.result;
    }, isConsumerActive);

    serverBlueprintCache.set(cacheKey, {
      garmentId: selectedGarmentId,
      requestKey: cacheKey,
      blueprint: result,
      createdAt: Date.now()
    });

    console.log('[BlueprintHTTP] RESPONSE_SEND', {
      garmentId: selectedGarmentId,
      status: 200
    });

    res.status(200).json(result);

    console.log('[BlueprintHTTP] RESPONSE_FINISHED', {
      garmentId: selectedGarmentId,
      writableEnded: res.writableEnded
    });
    return;
  } catch (error: any) {
    const status = error?.status || 503;
    const code = error?.code || 'NO_COMPATIBLE_MODEL_AVAILABLE';
    const message = error?.message || 'Dịch vụ AI đang tạm thời không khả dụng. Vui lòng thử lại sau.';
    const retryable = error?.retryable ?? true;
    console.error('Error in /api/generate-blueprint:', code, error?.message || error);
    return res.status(status).json({ status, code, message, retryable });
  }
});

/**
 * PHASE 2D: GUIDED EXPLORATION BLUEPRINT GENERATION
 * Endpoint: POST /api/generate-exploration
 */
app.post('/api/generate-exploration', async (req, res) => {
  const { selectedGarmentId, parentBlueprint, parentOutfitFingerprint, explorationIntent, context } = req.body;
  if (!selectedGarmentId || !parentBlueprint || !parentOutfitFingerprint || !explorationIntent) {
    return res.status(400).json({ code: 'INVALID_EXPLORATION_REQUEST', message: 'Thiếu thông tin yêu cầu khám phá.' });
  }

  try {
    const result = await routeGeminiTask({
      task: 'EXPLORATION',
      requestId: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      executeWithModel: async (modelId) => {
        const effectiveExpGender: GenderPresentation = context?.genderPresentation || parentBlueprint?.wearerGender || 'nam';
        const effectiveExpRatio = typeof context?.traditionalRatio === 'number' ? context.traditionalRatio : 50;

        const compatibleAccessories = getPolicyCompatibleAccessories({
          garmentId: selectedGarmentId,
          wearer: effectiveExpGender,
          occasion: context?.selectedOccasion,
          style: context?.selectedStyle,
          traditionalRatio: effectiveExpRatio,
          promptText: context?.promptText,
          isExploration: true,
          explorationIntent
        });

        const catalogContext = {
          PALETTES: PALETTES.map(p => ({ id: p.id, hex: p.hex, name: p.name })),
          FABRICS: FABRICS.map(f => ({ id: f.id, label: f.label })),
          LOWER_GARMENTS: LOWER_GARMENTS.map(l => ({ id: l.id, label: l.label })),
          FOOTWEAR: FOOTWEAR.map(f => ({ id: f.id, label: f.label })),
          ACCESSORIES: compatibleAccessories.map(a => ({ id: a.id, label: a.label }))
        };

        const systemInstruction = `Bạn là Trợ lý Khám phá Phong cách (Exploration Co-pilot) của hệ thống AC (AI Arena Vietnam 2026).
Nhiệm vụ: Tạo một biến thể bản phối thời trang đương đại dựa trên Bản phối gốc của dáng áo "${selectedGarmentId}", người mặc: "${effectiveExpGender}" với hướng khám phá: "${explorationIntent}".
- MORE_TRADITIONAL: Gần truyền thống hơn, bảo toàn nhận diện cốt lõi, tăng cường tính nhận diện canonical, loại bỏ các phụ kiện biến tấu đương đại (như túi xách hiện đại, kính râm, chuỗi ngọc trai). Nếu không có phụ kiện truyền thống phù hợp thì accessoryIds BẮT BUỘC là mảng rỗng [].
- MORE_REMIXED: Biến tấu hơn, bảo toàn hoàn toàn đặc điểm nhận diện cốt lõi (essential traits), cho phép biến tấu đương đại an toàn (SAFE_CONTEMPORARY) ở bảng màu, chất liệu, giày dép và phụ kiện phù hợp, không phạm xung đột cốt lõi (CORE_CONFLICT).
- ALTERNATIVE: Khám phá phối khác, tạo ra phương án phối mới mẻ, khác biệt ý nghĩa so với bản gốc nhưng vẫn tương thích văn hóa và bảo toàn người mặc.

QUY TẮC LỰA CHỌN PHỤ KIỆN (CULTURAL PRODUCT RULES V1.1):
- accessoryIds: BẮT BUỘC chỉ chọn từ danh mục ACCESSORIES đã được sàng lọc tương thích theo hướng khám phá.
- NẾU danh mục ACCESSORIES rỗng hoặc không có phụ kiện phù hợp, accessoryIds BẮT BUỘC là mảng rỗng [] (Ưu tiên không phụ kiện hơn là tự bịa phụ kiện).
- TUYỆT ĐỐI KHÔNG đưa giày dép vào mảng phụ kiện.

BẮT BUỘC chỉ chọn các Canonical ID từ danh mục Catalog được cung cấp:
${JSON.stringify(catalogContext, null, 2)}

Trả về JSON theo schema yêu cầu gồm:
1. blueprint (gồm palette, fabricId, lowerGarmentId, footwearId, accessoryIds, contextCautions)
2. stylingRationale (câu lý giải ngắn gọn bằng tiếng Việt)
3. changesRelativeToOriginal (câu mô tả điểm thay đổi cốt lõi so với bản gốc bằng tiếng Việt)`;

        const userContent = JSON.stringify({
          selectedGarmentId,
          explorationIntent,
          parentBlueprint,
          context: context || {}
        });

        const explorationSchema = {
          type: Type.OBJECT,
          properties: {
            blueprint: {
              type: Type.OBJECT,
              properties: {
                garmentId: { type: Type.STRING, enum: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'] },
                remixProposal: {
                  type: Type.OBJECT,
                  properties: {
                    palette: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          hex: { type: Type.STRING },
                          name: { type: Type.STRING },
                          role: { type: Type.STRING, enum: ['PRIMARY', 'SUPPORTING', 'ACCENT'] },
                          origin: { type: Type.STRING, enum: ['USER_REQUESTED', 'AC_SUGGESTED'] }
                        },
                        required: ['id', 'hex', 'name', 'role']
                      }
                    },
                    fabricId: { type: Type.STRING },
                    lowerGarmentId: { type: Type.STRING },
                    footwearId: { type: Type.STRING },
                    accessoryIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['palette', 'fabricId', 'lowerGarmentId', 'footwearId', 'accessoryIds']
                },
                contextCautions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['garmentId', 'remixProposal', 'contextCautions']
            },
            stylingRationale: { type: Type.STRING },
            changesRelativeToOriginal: { type: Type.STRING }
          },
          required: ['blueprint', 'stylingRationale', 'changesRelativeToOriginal']
        };

        const response = await ai.models.generateContent({
          model: modelId,
          contents: userContent,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: explorationSchema
          }
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        if (!parsed.blueprint || !parsed.blueprint.remixProposal) {
          throw new Error('Invalid exploration blueprint response schema');
        }

        const sanitizedBp = sanitizeBlueprintOutput(
          selectedGarmentId,
          parsed.blueprint,
          context?.promptText || '',
          {
            wearer: effectiveExpGender,
            occasion: context?.selectedOccasion,
            style: context?.selectedStyle,
            traditionalRatio: effectiveExpRatio,
            explorationIntent
          }
        );
        const resultingFingerprint = computeOutfitFingerprint({
          garmentId: selectedGarmentId,
          palette: sanitizedBp.remixProposal.palette,
          fabricId: sanitizedBp.remixProposal.fabricId,
          lowerGarmentId: sanitizedBp.remixProposal.lowerGarmentId,
          footwearId: sanitizedBp.remixProposal.footwearId,
          accessoryIds: sanitizedBp.remixProposal.accessoryIds,
          contextProps: sanitizedBp.remixProposal.contextProps || [],
          occasion: context?.selectedOccasion,
          style: context?.selectedStyle,
          traditionalRatio: context?.traditionalRatio,
          genderPresentation: effectiveExpGender
        });

        return {
          explorationId: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          explorationIntent,
          parentBlueprintFingerprint: parentOutfitFingerprint,
          resultingOutfitFingerprint: resultingFingerprint,
          blueprint: sanitizedBp,
          stylingRationale: parsed.stylingRationale || 'Gợi ý phối đồ theo hướng khám phá mới.',
          changesRelativeToOriginal: parsed.changesRelativeToOriginal || 'Điều chỉnh bảng màu và phụ kiện so với bản gốc.',
          wearerGender: effectiveExpGender
        };
      }
    });

    if (result.result.resultingOutfitFingerprint === parentOutfitFingerprint) {
      return res.status(422).json({
        code: 'EXPLORATION_NO_DIVERGENCE',
        message: 'Bản phối khám phá chưa tạo ra khác biệt với bản phối gốc.'
      });
    }

    return res.status(200).json(result.result);
  } catch (err: any) {
    console.error('Error in /api/generate-exploration:', err);
    return res.status(503).json({
      code: 'EXPLORATION_GENERATION_FAILED',
      message: err?.message || 'Không thể tạo hướng phối khám phá lúc này. Vui lòng thử lại sau.'
    });
  }
});

/**
 * PHASE 2B: REALISTIC LOOKBOOK IMAGE GENERATION
 * Endpoint: POST /api/generate-lookbook
 * 
 * Pipeline:
 * Validated Effective Blueprint -> Recompute Fingerprint (409 if stale)
 * -> Ephemeral Cache Check -> In-Flight Dedup -> VisualPromptCompiler
 * -> ImageProvider (OpenAI) -> EphemeralImageStore -> Response
 */
app.post('/api/generate-lookbook', async (req, res) => {
  const {
    garmentId,
    remixProposal,
    context,
    outfitFingerprint,
    forceRegenerate,
    revisionIndex,
    parentGenerationId,
    groundedCorrectionPlan,
    genderPresentation
  } = req.body || {};

  const effectiveGender = genderPresentation || context?.genderPresentation || 'nam';
  const isRevision = typeof revisionIndex === 'number' && revisionIndex > 0;
  if (typeof revisionIndex === 'number' && revisionIndex > 2) {
    return res.status(400).json({
      code: 'REVISION_LIMIT_EXCEEDED',
      message: 'Hệ thống giới hạn tối đa 2 lần tinh chỉnh theo thẩm định (v1, v2) cho mỗi luồng trang phục.'
    });
  }
  const effectiveForceRegenerate = forceRegenerate || isRevision;
  const inFlightKey = isRevision ? `${outfitFingerprint}_rev_${revisionIndex}` : outfitFingerprint;

  // 1. Strict Validation of Input Garment & Blueprint (Section 5)
  const validGarments = ['ngu_than_chen', 'ao_tac', 'ao_tu_than'];
  if (!garmentId || !validGarments.includes(garmentId)) {
    return res.status(400).json({
      code: 'INVALID_OUTFIT_STATE',
      message: 'Dáng áo không thuộc danh mục hỗ trợ chuẩn.'
    });
  }

  if (
    !remixProposal ||
    !Array.isArray(remixProposal.palette) ||
    remixProposal.palette.length !== 3
  ) {
    return res.status(400).json({
      code: 'INVALID_OUTFIT_STATE',
      message: 'Bảng màu phải có đúng 3 sắc thái tạo thành bộ hòa sắc thống nhất.'
    });
  }

  // Validate palette items
  const validRoles = ['PRIMARY', 'SUPPORTING', 'ACCENT'];
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  for (const item of remixProposal.palette) {
    if (!item || !item.id || !item.name || !item.hex || !hexRegex.test(item.hex) || !validRoles.includes(item.role)) {
      return res.status(400).json({
        code: 'INVALID_OUTFIT_STATE',
        message: 'Thông số màu trong bảng màu không hợp lệ.'
      });
    }
  }

  // Validate fabricId
  if (!remixProposal.fabricId || !FABRICS.some(f => f.id === remixProposal.fabricId)) {
    return res.status(400).json({
      code: 'INVALID_OUTFIT_STATE',
      message: 'Chất liệu vải không thuộc danh mục chuẩn.'
    });
  }

  // Validate lowerGarmentId
  if (!remixProposal.lowerGarmentId || !LOWER_GARMENTS.some(l => l.id === remixProposal.lowerGarmentId)) {
    return res.status(400).json({
      code: 'INVALID_OUTFIT_STATE',
      message: 'Hạ phục không thuộc danh mục chuẩn.'
    });
  }

  // Validate footwearId (must be from FOOTWEAR)
  if (!remixProposal.footwearId || !FOOTWEAR.some(f => f.id === remixProposal.footwearId)) {
    return res.status(400).json({
      code: 'INVALID_OUTFIT_STATE',
      message: 'Giày dép không thuộc danh mục chuẩn.'
    });
  }

  // Validate accessoryIds (must be from ACCESSORIES, max 2, never footwear)
  const accessoryIds = Array.isArray(remixProposal.accessoryIds) ? remixProposal.accessoryIds : [];
  if (accessoryIds.length > 2) {
    return res.status(400).json({
      code: 'INVALID_OUTFIT_STATE',
      message: 'Số lượng phụ kiện gợi ý tối đa là 2.'
    });
  }
  for (const accId of accessoryIds) {
    if (FOOTWEAR.some(f => f.id === accId)) {
      return res.status(400).json({
        code: 'INVALID_OUTFIT_STATE',
        message: 'Giày dép không được nằm trong danh mục phụ kiện.'
      });
    }
    if (!ACCESSORIES.some(a => a.id === accId)) {
      return res.status(400).json({
        code: 'INVALID_OUTFIT_STATE',
        message: `Phụ kiện "${accId}" không thuộc danh mục chuẩn.`
      });
    }
  }

  // 2. Recompute Fingerprint on Server (Section 3: Zero trust on client fingerprint)
  const recomputedFingerprint = computeOutfitFingerprint({
    garmentId,
    palette: remixProposal.palette,
    fabricId: remixProposal.fabricId,
    lowerGarmentId: remixProposal.lowerGarmentId,
    footwearId: remixProposal.footwearId,
    accessoryIds,
    contextProps: remixProposal.contextProps || [],
    occasion: context?.occasion,
    style: context?.style,
    traditionalRatio: context?.traditionalRatio,
    genderPresentation: effectiveGender
  });

  if (outfitFingerprint !== recomputedFingerprint) {
    console.warn(`[Phase 2B Fingerprint Mismatch Diagnostics]`, {
      clientFingerprint: outfitFingerprint,
      serverFingerprint: recomputedFingerprint,
      garmentId,
      paletteCount: remixProposal.palette?.length,
      fabricId: remixProposal.fabricId,
      lowerGarmentId: remixProposal.lowerGarmentId,
      footwearId: remixProposal.footwearId,
      accessoryCount: accessoryIds.length,
      contextPropsCount: (remixProposal.contextProps || []).length,
      genderPresentation: effectiveGender
    });
    return res.status(409).json({
      code: 'STALE_OUTFIT_STATE',
      message: 'Bản phối đã thay đổi. Vui lòng tạo ảnh lại từ phiên bản hiện tại.'
    });
  }

  // 3. Ephemeral Cache Check (Reuse unexpired image for identical fingerprint unless effectiveForceRegenerate)
  if (!forceRegenerate) {
    if (!isRevision) {
      try {
        const existing = await ephemeralImageStore.getByFingerprint(recomputedFingerprint);
        if (existing) {
          console.log(`[Phase 2B] Ephemeral Cache HIT for fingerprint ${recomputedFingerprint} -> ${existing.generationId}`);
          return res.status(200).json({
            generationId: existing.generationId,
            imageUrl: `/api/generated-images/${existing.generationId}`,
            outfitFingerprint: existing.outfitFingerprint,
            createdAt: existing.createdAt,
            expiresAt: existing.expiresAt,
            revisionIndex: existing.revisionIndex || 0,
            parentGenerationId: existing.parentGenerationId
          });
        }
      } catch (cacheErr) {
        console.warn('[Phase 2B] Error reading from ephemeral cache:', cacheErr);
      }
    }
  }

  // 4. In-Flight Request Deduplication (Section 23: Prevent double-click billings)
  if (generationInFlightByFingerprint.has(inFlightKey) || (!isRevision && generationInFlightByFingerprint.has(recomputedFingerprint))) {
    console.log(`[Phase 2B] In-flight deduplication attached to running task for key ${inFlightKey}`);
    try {
      const inFlightRes = await generationInFlightByFingerprint.get(inFlightKey)!;
      return res.status(200).json(inFlightRes);
    } catch (inFlightErr: any) {
      const status = inFlightErr?.status || 500;
      return res.status(status).json({
        code: inFlightErr?.code || 'IMAGE_GENERATION_FAILED',
        message: inFlightErr?.message || 'Không thể tạo hình ảnh lúc này. Vui lòng thử lại sau.'
      });
    }
  }

  // 5. Execution Pipeline
  const generationPromise = (async (): Promise<GenerateLookbookResponse> => {
    // A. Compile Grounded Visual Prompt
    const compiled = compileVisualPrompt({
      garmentId,
      remixProposal: {
        ...remixProposal,
        accessoryIds
      },
      context: {
        ...(context || { occasion: 'tet', style: 'tre_trung', traditionalRatio: 50 }),
        genderPresentation: effectiveGender
      },
      genderPresentation: effectiveGender,
      outfitFingerprint: recomputedFingerprint,
      revisionIndex: isRevision ? revisionIndex : 0,
      parentGenerationId,
      groundedCorrectionPlan
    });

    console.log(`[Phase 2B/2C] Generating image via provider for ${garmentId} (fingerprint: ${recomputedFingerprint}, revision: ${isRevision ? revisionIndex : 0}, gender: ${effectiveGender})`);

    // B. Call Image Provider
    const imagePayload = await imageProvider.generate({
      prompt: compiled.prompt,
      outfitFingerprint: recomputedFingerprint,
      orientation: 'PORTRAIT_LOOKBOOK'
    });

    // C. Store Ephemeral Record (Retains actual image Buffer for Phase 2C)
    const record = ephemeralImageStore.createRecord(
      recomputedFingerprint,
      garmentId,
      imagePayload.bytes,
      imagePayload.mimeType,
      {
        garmentId,
        remixProposal,
        context: {
          ...(context || {}),
          genderPresentation: effectiveGender
        },
        genderPresentation: effectiveGender,
        compiledPrompt: compiled.prompt
      },
      isRevision ? revisionIndex : 0,
      parentGenerationId
    );
    await ephemeralImageStore.put(record);

    console.log(`[Phase 2B/2C] Image generated successfully -> generationId: ${record.generationId} (rev ${record.revisionIndex})`);

    return {
      generationId: record.generationId,
      imageUrl: `/api/generated-images/${record.generationId}`,
      outfitFingerprint: record.outfitFingerprint,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      revisionIndex: record.revisionIndex || 0,
      parentGenerationId: record.parentGenerationId
    };
  })();

  generationInFlightByFingerprint.set(inFlightKey, generationPromise);

  try {
    const result = await generationPromise;
    return res.status(200).json(result);
  } catch (err: any) {
    const status = err?.status || 500;
    const code = err?.code || 'IMAGE_GENERATION_FAILED';
    const message = err?.message || 'Không thể tạo hình ảnh lúc này. Vui lòng thử lại sau.';
    console.error(`[Phase 2B] Generation error [${code}]:`, message);
    return res.status(status).json({ code, message });
  } finally {
    generationInFlightByFingerprint.delete(inFlightKey);
  }
});

/**
 * PHASE 2B: SERVE EPHEMERAL GENERATED IMAGES
 * Endpoint: GET /api/generated-images/:generationId
 */
app.get('/api/generated-images/:generationId', async (req, res) => {
  try {
    const { generationId } = req.params;
    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const record = await ephemeralImageStore.get(generationId);

    if (!record) {
      return res.status(404).json({
        code: 'GENERATED_IMAGE_EXPIRED',
        message: 'Hình ảnh đã hết hạn lưu trữ tạm thời (15 phút). Vui lòng tạo lại ảnh mới.'
      });
    }

    if (isDownload) {
      const garmentSlug = record.garmentId ? String(record.garmentId).replace(/_/g, '-') : 'outfit';
      res.setHeader('Content-Disposition', `attachment; filename="AC-lookbook-${garmentSlug}.jpg"`);
    }

    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=900, immutable');
    return res.send(record.bytes);
  } catch (err) {
    console.error('Error serving generated image:', err);
    return res.status(500).json({
      code: 'IMAGE_SERVE_ERROR',
      message: 'Không thể truy xuất hình ảnh tạm thời.'
    });
  }
});

/**
 * PHASE 2C: CULTURAL VISUAL QA & AUDIT PIPELINE
 * Endpoint: POST /api/verify-lookbook
 *
 * Pipeline:
 * 1. Validate request (generationId, boundFingerprint)
 * 2. Build QA Identity Key: qa_${generationId}_${QA_SCHEMA_VERSION}_${CULTURAL_KNOWLEDGE_VERSION}_${VISUAL_AUDIT_POLICY_VERSION}
 * 3. Server Completed QA Cache Hit?
 *    - Check boundFingerprint: mismatch -> 409 Conflict, match -> return 200 immediately (0 Vision calls)
 * 4. EphemeralImageStore.get(generationId):
 *    - null / expired -> 410 Gone (code: 'EPHEMERAL_IMAGE_EXPIRED') (0 Vision calls)
 *    - exists -> verify record.outfitFingerprint === req.boundFingerprint: mismatch -> 409 Conflict (0 Vision calls)
 * 5. In-flight Deduplication (Ref-counted via dedupeServerCall)
 * 6. Gemini Vision Multimodal Call (Task C via ModelRouter)
 * 7. Deterministic Aggregation Engine
 * 8. Cache & return HTTP 200 CulturalVisualQAOutput
 */
app.post('/api/verify-lookbook', async (req, res) => {
  const { generationId, boundFingerprint } = req.body || {};

  if (!generationId || typeof generationId !== 'string' || !boundFingerprint || typeof boundFingerprint !== 'string') {
    return res.status(400).json({
      code: 'INVALID_QA_REQUEST',
      message: 'Thiếu thông tin generationId hoặc boundFingerprint.'
    });
  }

  const qaCacheKey = `qa_${generationId}_${QA_SCHEMA_VERSION}_${CULTURAL_KNOWLEDGE_VERSION}_${VISUAL_AUDIT_POLICY_VERSION}`;

  // 1. Server Completed QA Cache Check (Returns cached QA even if image buffer has expired!)
  if (serverVisualQACache.has(qaCacheKey)) {
    const cached = serverVisualQACache.get(qaCacheKey)!;
    if (cached.boundFingerprint !== boundFingerprint) {
      return res.status(409).json({
        code: 'FINGERPRINT_MISMATCH',
        message: 'Dấu vân bản phối yêu cầu không khớp với dữ liệu kiểm định đã lưu.'
      });
    }
    console.log(`[Phase 2C] Server Visual QA Cache HIT for ${qaCacheKey}`);
    return res.status(200).json(cached);
  }

  // 2. Ephemeral Image Store Check
  const imageRecord = await ephemeralImageStore.get(generationId);
  if (!imageRecord) {
    console.warn(`[Phase 2C] Ephemeral image expired or not found for generationId: ${generationId}`);
    return res.status(410).json({
      code: 'EPHEMERAL_IMAGE_EXPIRED',
      message: 'Hình ảnh đã hết hạn lưu trữ tạm thời trong bộ nhớ đệm (15 phút). Vui lòng tạo lại ảnh mới để tiếp tục kiểm định.'
    });
  }

  // 3. Binding Integrity Check
  if (imageRecord.outfitFingerprint !== boundFingerprint) {
    console.warn(`[Phase 2C] Fingerprint mismatch: record="${imageRecord.outfitFingerprint}" vs req="${boundFingerprint}"`);
    return res.status(409).json({
      code: 'FINGERPRINT_MISMATCH',
      message: 'Dấu vân bản phối của ảnh không khớp với yêu cầu kiểm định.'
    });
  }

  // 4. Safe Client Disconnection Lifecycle
  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
    }
  });
  const isConsumerActive = () => !clientDisconnected;

  try {
    const result = await dedupeServerCall(qaCacheKey, async (isTaskCurrent) => {
      const garmentId = (imageRecord.garmentId || 'ngu_than_chen') as GarmentId;
      const snapshot = imageRecord.effectiveBlueprintSnapshot || {};
      const traitsToObserve = CANONICAL_GARMENT_TRAITS[garmentId] || CANONICAL_GARMENT_TRAITS.ngu_than_chen;

      const visualQASystemInstruction = `Bạn là hệ thống kiểm định thị giác khách quan (Objective 2D Visual Perception Engine) của AC — Context-Aware Cultural Remix Co-pilot (AI Arena Vietnam 2026).
Nhiệm vụ: Phân tích ảnh phục trang 2D do AI tạo ra và trích xuất bằng chứng thị giác trực quan đối chiếu với tri thức cổ phục Việt Nam và thông số bản phối.

QUY TẮC QUAN SÁT THỊ GIÁC BẮT BUỘC (STRICT VISION AUDIT POLICY):
1. CAMERA BLIND SPOT (2D OBSERVATION ONLY):
- Bạn là máy quan sát ảnh 2D thuần túy. TUYỆT ĐỐI KHÔNG dùng kiến thức nền để suy diễn các cấu trúc bị che khuất.
- Chi tiết nằm ở lớp bên trong (vạt con, nội phục), mặt sau lưng, hoặc bị che khuất hoàn toàn bởi cánh tay/tư thế -> BẮT BUỘC trả về verdict: "NOT_ASSESSABLE".
- Ví dụ: Áo ngũ thân chụp chính diện không thấy thân thứ 5 (vạt con) -> trait five_panels_inner_flap = "NOT_ASSESSABLE".

2. LOCAL RESOLUTION GUARD:
- Trong ảnh 1152x1536 (Tỷ lệ 3:4), nếu các chi tiết nhỏ (số lượng chính xác của các khuy cài nhỏ, đường thêu vi mô, thớ dệt vải) không đủ độ phân giải điểm ảnh để khẳng định đúng/sai -> BẮT BUỘC trả về "NOT_ASSESSABLE".
- TUYỆT ĐỐI KHÔNG đánh "FAIL" chỉ vì chi tiết quá nhỏ không nhìn rõ.

3. VISIBLE VIOLATION EXCEPTION:
- Bị che khuất chỉ dẫn đến NOT_ASSESSABLE khi phần còn lại không đủ chứng minh đúng hay sai.
- NẾU PHẦN CÒN LỘ RA ĐÃ ĐỦ BẰNG CHỨNG CHỨNG MINH SỰ SAI LỆCH KẾT CẤU (ví dụ: cổ áo bị che một nửa nhưng nửa còn lại lộ rõ cổ bẻ nằm ngang kiểu âu phục, hoặc tay áo chẽn bị may thụng rộng xòe) -> BẮT BUỘC đánh giá "FAIL" hoặc "PARTIAL", TUYỆT ĐỐI KHÔNG ẩn mình sau NOT_ASSESSABLE.

4. ORIENTATION STANDARD:
- Mọi quy định về bên trái/phải (vạt cài sang nách phải, hướng khuy) BẮT BUỘC tính theo PHÍA CỦA NGƯỜI MẶC (wearer's right/left), KHÔNG PHẢI phía màn hình người xem.

5. AMBIENT LIGHTING DRIFT:
- Chấp nhận độ lệch màu nhẹ do ánh sáng nghệ thuật/bóng đổ. Chỉ đánh "FAIL" màu sắc khi có sự thay thế màu hoàn toàn.

6. UNEXPECTED ACCESSORIES DETECTION:
- Bóc tách mảng unexpectedAccessories. Chỉ ghi nhận các phụ kiện/vật thể ngoài dự kiến KHÔNG CÓ TRONG CẢ accessoryIds LẪN contextProps. các đạo cụ cầm tay/bối cảnh đã phê duyệt trong contextProps (như Lon Coca-Cola phiên bản Tết, bao lì xì, hoa đào) LÀ ĐẠO CỤ HỢP LỆ, TUYỆT ĐỐI KHÔNG ghi nhận vào unexpectedAccessories và TUYỆT ĐỐI KHÔNG yêu cầu loại bỏ.

7. PHÂN ĐỊNH TRÁCH NHIỆM:
- Bạn CHỈ trích xuất bằng chứng thô (verdict: PASS | PARTIAL | FAIL | NOT_ASSESSABLE, visualEvidence).
- TUYỆT ĐỐI KHÔNG tự tính overall status, không cho điểm số 0-100, không dùng ngôn ngữ khen ngợi cảm tính ("đẹp", "chuẩn mực 100%").

8. CONSERVATIVE SLEEVE EVALUATION (ĐỐI SOÁT ỐNG TAY CĂN CỨ THỊ GIÁC):
- Một ống tay hẹp/suông/thon gọn (slim/tubular) ĐƠN THUẦN KHÔNG ĐỦ CƠ SỞ để khẳng định đạt chuẩn tay chẽn truyền thống.
- PASS chỉ được đưa ra khi có ĐỦ BẰNG CHỨNG THỊ GIÁC RÕ RÀNG về hình thái tay chẽn (nhìn rõ dáng tay thuôn hẹp dần về cổ tay, không phải áo ôm hiện đại đơn thuần, không bị nếp gấp/góc chụp/tay gập che khuất hình học).
- Nếu chỉ thấy một phần hình thái hoặc dáng suông hẹp nhưng chưa đủ độ chắc chắn để khẳng định -> BẮT BUỘC đánh giá "PARTIAL".
- Nếu tay bị nếp gấp dày đặc, tư thế khoanh/gập tay, góc phối cảnh (foreshortening) hoặc bị che khuất khiến không thể đánh giá chính xác -> BẮT BUỘC đánh giá "NOT_ASSESSABLE".
- CHỈ đánh "FAIL" khi có mâu thuẫn hình thái học hiển hiện rõ ràng (ví dụ: tay may xòe thụng rộng hình chữ nhật to bản kiểu Áo tấc hoặc xòe cánh tiên).
- TUYỆT ĐỐI KHÔNG tự động coi ống tay thon suông là PASS; khi không chắc chắn giữa phán quyết kết cấu và dữ liệu không đủ rõ, BẮT BUỘC ƯU TIÊN "NOT_ASSESSABLE" hoặc "PARTIAL" thay vì vội vàng PASS hay FAIL.

9. APPROXIMATE & FOLK MEASUREMENTS GUARD (ĐỐI SOÁT CHIỀU DÀI TAY ÁO TẤC):
- Đối với Áo tấc (trait sleeves_length_past_fingertips): Chiều dài buông qua đầu ngón tay khoảng 1 tấc là ước lượng dân gian (PROBABLE/APPROXIMATE), KHÔNG PHẢI kích thước số học cứng nhắc.
- Nếu ống tay may thụng rộng thẳng hình chữ nhật (khoán tụ) đã rõ nét nhưng chiều dài buông không thể đo đạc chính xác bằng pixel, hoặc tay người mẫu đang ở tư thế gập/chắp/cầm đạo cụ -> BẮT BUỘC đánh giá "PASS" hoặc "NOT_ASSESSABLE".
- TUYỆT ĐỐI KHÔNG đánh "FAIL" cứng chỉ vì không thể chứng minh số đo chính xác 1 tấc buông qua ngón tay.

10. CONTEMPORARY STYLING & WEARER PRESENTATION:
- Các phụ kiện hiện đại (túi xách, kính mắt, trang sức tối giản, hoặc chuỗi ngọc trai khi có trong bản phối) là lớp styling đương đại (contemporary styling layer).
- Hãy đối chiếu theo Outfit Fidelity. Bạn chỉ quan sát thực tế hiển thị trong ảnh 2D, TUYỆT ĐỐI KHÔNG tự phán xét lịch sử hay quy chụp phụ kiện hiện đại được chỉ định là lỗi văn hóa.
- Với các nhánh tái diễn giải đương đại (ví dụ người mặc nam chọn áo tứ thân cách tân), kiểm định khách quan cấu trúc tà áo/thân áo theo thị giác trực quan, không gán ghép định kiến lịch sử.`;

      const promptText = `Hãy kiểm tra ảnh phục trang đính kèm:
Dáng áo: ${garmentId}
Thông số bản phối yêu cầu:
${JSON.stringify({
  palette: snapshot.remixProposal?.palette || [],
  fabricId: snapshot.remixProposal?.fabricId || '',
  lowerGarmentId: snapshot.remixProposal?.lowerGarmentId || '',
  footwearId: snapshot.remixProposal?.footwearId || '',
  accessoryIds: snapshot.remixProposal?.accessoryIds || [],
  contextProps: snapshot.remixProposal?.contextProps || snapshot.contextProps || []
}, null, 2)}

Danh sách đặc trưng nhận diện cần đối chiếu:
${JSON.stringify(traitsToObserve.map(t => ({ traitId: t.traitId, name: t.traitNameVi, category: t.category, description: t.descriptionVi })), null, 2)}

Trả về JSON cấu trúc đúng schema.`;

      const visualQASchema = {
        type: Type.OBJECT,
        properties: {
          traitEvaluations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                traitId: { type: Type.STRING },
                verdict: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
                visualEvidence: { type: Type.STRING },
                observedDeviation: { type: Type.STRING }
              },
              required: ['traitId', 'verdict', 'visualEvidence']
            }
          },
          outfitFidelity: {
            type: Type.OBJECT,
            properties: {
              palette: {
                type: Type.OBJECT,
                properties: {
                  primaryMatch: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
                  supportingMatch: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
                  accentMatch: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
                  notes: { type: Type.STRING }
                },
                required: ['primaryMatch', 'supportingMatch', 'accentMatch']
              },
              fabricMatch: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
              lowerGarmentMatch: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
              footwearMatch: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
              expectedAccessories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    accessoryId: { type: Type.STRING },
                    verdict: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE'] },
                    notes: { type: Type.STRING }
                  },
                  required: ['accessoryId', 'verdict']
                }
              },
              unexpectedAccessories: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['palette', 'fabricMatch', 'lowerGarmentMatch', 'footwearMatch', 'expectedAccessories', 'unexpectedAccessories']
          }
        },
        required: ['traitEvaluations', 'outfitFidelity']
      };

      const requestId = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      console.log(`[QA Correlation Trace] Invoked`, {
        generationId,
        boundFingerprint,
        qaCacheKey,
        requestId,
        imageSizeBytes: imageRecord.bytes.length,
        approxBase64KB: Math.round(imageRecord.bytes.length * 1.33 / 1024)
      });

      const routeResult = await routeGeminiTask({
        task: 'VISUAL_QA',
        requestId,
        isStillCurrent: () => !clientDisconnected && isTaskCurrent(),
        executeWithModel: async (modelId, isCanary, signal) => {
          const sdkStartTime = Date.now();
          const sdkPromise = ai.models.generateContent({
            model: modelId,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: imageRecord.bytes.toString('base64'),
                      mimeType: imageRecord.mimeType || 'image/jpeg'
                    }
                  },
                  {
                    text: promptText
                  }
                ]
              }
            ],
            config: {
              systemInstruction: visualQASystemInstruction,
              responseMimeType: 'application/json',
              responseSchema: visualQASchema,
              abortSignal: signal
            }
          });

          // Passive Ghost Execution Tracker (Section 2.2 - NO await, NO side-effects)
          sdkPromise.then(
            (res) => {
              const elapsedMs = Date.now() - sdkStartTime;
              console.log(`[Ghost Execution Tracker] Candidate SETTLED (RESOLVED)`, {
                requestId,
                modelId,
                elapsedMs,
                responseChars: res.text?.length || 0
              });
            },
            (err: any) => {
              const elapsedMs = Date.now() - sdkStartTime;
              console.warn(`[Ghost Execution Tracker] Candidate SETTLED (REJECTED)`, {
                requestId,
                modelId,
                elapsedMs,
                errName: err?.name || 'Error',
                errStatus: err?.status || err?.statusCode,
                errCode: err?.code || err?.cause?.code,
                errMessageSnippet: (err?.message || String(err)).slice(0, 150).replace(/\s+/g, ' ')
              });
            }
          );

          const raceWithSignal = async () => {
            if (!signal) return await sdkPromise;
            if (signal.aborted) {
              const err = new Error('Candidate execution aborted');
              err.name = 'AbortError';
              throw err;
            }
            return new Promise<any>((resolve, reject) => {
              const onAbort = () => {
                const err = new Error('Candidate execution aborted');
                err.name = 'AbortError';
                reject(err);
              };
              signal.addEventListener('abort', onAbort, { once: true });
              sdkPromise.then(
                res => {
                  signal.removeEventListener('abort', onAbort);
                  resolve(res);
                },
                err => {
                  signal.removeEventListener('abort', onAbort);
                  reject(err);
                }
              );
            });
          };

          try {
            const response = await raceWithSignal();
            const parsed = JSON.parse(response.text?.trim() || '{}');
            if (!parsed.traitEvaluations || !parsed.outfitFidelity) {
              throw new Error('Malformed Visual QA structured response');
            }

            const contextProps = snapshot.remixProposal?.contextProps || snapshot.contextProps || [];
            const agg = aggregateCulturalVisualQA(
              garmentId,
              parsed.traitEvaluations || [],
              parsed.outfitFidelity || {},
              generationId,
              boundFingerprint,
              contextProps
            );
            const plan = buildGroundedCorrectionPlan(garmentId, agg, snapshot);
            agg.groundedCorrectionPlan = plan;
            return agg;
          } catch (sdkErr: any) {
            console.error(`[VisualQA Sanitized SDK Error]`, {
              requestId,
              modelId,
              errName: sdkErr?.name,
              errStatus: sdkErr?.status || sdkErr?.statusCode,
              errCode: sdkErr?.code,
              causeCode: sdkErr?.cause?.code,
              errMessageSnippet: (sdkErr?.message || String(sdkErr)).slice(0, 200).replace(/\s+/g, ' ')
            });
            throw sdkErr;
          }
        }
      });

      return routeResult.result;
    }, isConsumerActive);

    serverVisualQACache.set(qaCacheKey, result);
    return res.status(200).json(result);
  } catch (error: any) {
    const status = error?.status || 503;
    const code = error?.code || 'VISUAL_QA_FAILED';
    const message = error?.message || 'Không thể hoàn tất thẩm định thị giác lúc này. Vui lòng thử lại sau.';
    const retryable = error?.retryable ?? true;
    console.error('Error in /api/verify-lookbook:', code, error?.message || error);
    return res.status(status).json({ status, code, message, retryable });
  }
});

// Deterministic Helper for Call A
function getDeterministicGarmentRecommendation(
  occasion?: string,
  style?: string,
  ratio?: number,
  prompt?: string
) {
  const tRatio = typeof ratio === 'number' ? ratio : 50;
  const occ = (occasion || '').toLowerCase();
  const sty = (style || '').toLowerCase();
  const p = (prompt || '').toLowerCase();

  // Special test case / explicit request for null alternative
  if (p.includes('duy nhất') || p.includes('tuyệt đối không thay thế')) {
    return {
      primary: {
        garmentId: 'ao_tac' as const,
        rationale: 'Áo tấc là lễ phục mực thước chuẩn mực tối thượng cho nghi thức trang nghiêm này, không có phương án thứ hai tương đương.'
      },
      alternative: null
    };
  }

  if (occ.includes('tet') || occ.includes('dam_cuoi') || occ.includes('le_nghi')) {
    if (tRatio >= 50) {
      return {
        primary: {
          garmentId: 'ao_tac' as const,
          rationale: 'Áo tấc với cấu trúc tay thụng chữ nhật là lễ phục mực thước hàng đầu cho không gian trang nghiêm của lễ Tết gia tộc và nghi thức cưới hỏi.'
        },
        alternative: {
          garmentId: 'ngu_than_chen' as const,
          rationale: 'Áo ngũ thân tay chẽn đem lại sự thuận tiện linh hoạt hơn khi cần di chuyển chúc Tết hoặc giao tế xã hội nhiều nơi.'
        }
      };
    } else {
      return {
        primary: {
          garmentId: 'ngu_than_chen' as const,
          rationale: 'Áo ngũ thân tay chẽn tối ưu cho sự năng động và thoải mái trong ngày vui, giữ trọn nét thanh lịch cổ truyền.'
        },
        alternative: {
          garmentId: 'ao_tac' as const,
          rationale: 'Áo tấc vẫn là lựa chọn tôn nghiêm đáng cân nhắc cho các nghi thức bái gia tiên trọng thể.'
        }
      };
    }
  }

  if (occ.includes('ky_yeu') || occ.includes('tot_nghiep')) {
    return {
      primary: {
        garmentId: 'ngu_than_chen' as const,
        rationale: 'Áo ngũ thân tay chẽn gọn gàng, tôn dáng đĩnh đạc và tối ưu cho việc di chuyển nhận bằng cũng như chụp ảnh kỷ niệm năng động.'
      },
      alternative: {
        garmentId: 'ao_tac' as const,
        rationale: 'Áo tấc mang lại vẻ trang trọng uy nghi, tạo điểm nhấn ấn tượng trong các bức ảnh kỷ yếu tập thể.'
      }
    };
  }

  if (occ.includes('chup_anh') || occ.includes('le_hoi')) {
    if (sty.includes('nhe_nhang') || p.includes('nữ') || p.includes('dân gian')) {
      return {
        primary: {
          garmentId: 'ao_tu_than' as const,
          rationale: 'Áo tứ thân mang đậm nét duyên dáng dân gian Bắc Bộ, mềm mại và rạng rỡ cho các khung hình kỷ niệm hoặc ngày hội hè.'
        },
        alternative: {
          garmentId: 'ngu_than_chen' as const,
          rationale: 'Áo ngũ thân tay chẽn đem lại phong thái trang nhã, mực thước của thường phục đô thị thời Nguyễn.'
        }
      };
    } else {
      return {
        primary: {
          garmentId: 'ngu_than_chen' as const,
          rationale: 'Áo ngũ thân tay chẽn thích hợp cho dạo phố chụp ảnh hiện đại, thoải mái kết hợp cùng phụ kiện đương đại.'
        },
        alternative: {
          garmentId: 'ao_tu_than' as const,
          rationale: 'Áo tứ thân mang tới tinh thần dân gian mộc mạc và phong thái hoài niệm đặc sắc.'
        }
      };
    }
  }

  return {
    primary: {
      garmentId: 'ngu_than_chen' as const,
      rationale: 'Áo ngũ thân tay chẽn cân bằng hài hòa giữa cấu trúc chuẩn mực thời Nguyễn và khả năng ứng dụng linh hoạt trong đời sống thường nhật.'
    },
    alternative: {
      garmentId: 'ao_tac' as const,
      rationale: 'Áo tấc là lựa chọn gia tăng tính trang nghiêm mực thước cho các khoảnh khắc trọng thể.'
    }
  };
}

// Deterministic Helper for Call B
function getDeterministicBlueprint(
  garmentId: string,
  occasion?: string,
  style?: string,
  ratio?: number,
  prompt?: string
) {
  const tRatio = typeof ratio === 'number' ? ratio : 50;
  const occ = (occasion || '').toLowerCase();
  const p = (prompt || '').toLowerCase();

  const isTraditionalHigh = tRatio >= 65;
  const isModernHigh = tRatio <= 35;

  let fabricId = 'gam_hoa_chim';
  let lowerGarmentId = 'silk_pants_wide';
  let footwearId = 'leather_loafer';
  let accessoryIds: string[] = [];
  let contextCautions: string[] = [];

  // 1. Color Intent Parsing from promptText
  const isNoBlack = p.includes('không dùng màu đen') || p.includes('tránh màu đen') || p.includes('không đen') || p.includes('không có màu đen');
  const isNoRed = p.includes('không dùng màu đỏ') || p.includes('tránh màu đỏ');

  // Detect explicit color mentions
  const detectedColors: PaletteOption[] = [];
  const addDetected = (pal: PaletteOption | undefined) => {
    if (pal && !detectedColors.some(c => c.id === pal.id)) {
      if (pal.id === 'den_tuyen' && isNoBlack) return;
      if (pal.id === 'do_son_tram' && isNoRed) return;
      detectedColors.push(pal);
    }
  };

  if (p.includes('đỏ')) addDetected(PALETTES.find(c => c.id === 'do_son_tram'));
  if (p.includes('vàng')) addDetected(PALETTES.find(c => c.id === 'vang_hoang_cuc'));
  if (p.includes('xanh chàm') || p.includes('chàm')) addDetected(PALETTES.find(c => c.id === 'xanh_cham_co'));
  if (p.includes('xanh ngọc') || p.includes('ngọc bích')) addDetected(PALETTES.find(c => c.id === 'xanh_ngoc_bich'));
  if (p.includes('thiên thanh') || p.includes('xanh nhạt') || p.includes('xanh trời')) addDetected(PALETTES.find(c => c.id === 'xanh_thien_thanh'));
  else if (p.includes('xanh')) addDetected(PALETTES.find(c => c.id === 'xanh_cham_co'));
  if (p.includes('trắng') || p.includes('bạch ngọc')) addDetected(PALETTES.find(c => c.id === 'trang_nga_bach_ngoc'));
  if (p.includes('đen') && !isNoBlack) addDetected(PALETTES.find(c => c.id === 'den_tuyen'));
  if (p.includes('hồng') || p.includes('sen')) addDetected(PALETTES.find(c => c.id === 'hong_canh_sen'));
  if (p.includes('tím')) addDetected(PALETTES.find(c => c.id === 'tim_hue_hoa_ca'));
  if (p.includes('be') || p.includes('mộc') || p.includes('đũi')) addDetected(PALETTES.find(c => c.id === 'be_moc_linen'));

  let palette: PaletteOption[] = [];

  if (detectedColors.length > 3) {
    // Over 3 colors: Select top 3 and add contextual note
    palette = detectedColors.slice(0, 3);
    contextCautions.push('Bảng phối màu đã được tinh gọn về 3 sắc thái hài hòa (chủ đạo, phụ và điểm nhấn) phù hợp với bối cảnh xuất hiện.');
  } else if (detectedColors.length > 0) {
    // 1 to 3 colors requested
    palette = [...detectedColors];
    // Fill remaining up to 3 with harmonic colors
    const candidatePool = PALETTES.filter(c => {
      if (palette.some(p => p.id === c.id)) return false;
      if (c.id === 'den_tuyen' && isNoBlack) return false;
      if (c.id === 'do_son_tram' && isNoRed) return false;
      return true;
    });
    while (palette.length < 3 && candidatePool.length > 0) {
      palette.push(candidatePool.shift()!);
    }
  } else {
    // 0 colors requested: AC proposes 3 harmonic colors according to garment and occasion
    let basePool = PALETTES.filter(c => {
      if (c.id === 'den_tuyen' && isNoBlack) return false;
      if (c.id === 'do_son_tram' && isNoRed) return false;
      return true;
    });

    if (garmentId === 'ao_tac') {
      if (isTraditionalHigh || occ.includes('tet') || occ.includes('dam_cuoi')) {
        palette = [
          basePool.find(p => p.id === 'do_son_tram') || basePool[0],
          basePool.find(p => p.id === 'vang_hoang_cuc') || basePool[1],
          basePool.find(p => p.id === 'xanh_cham_co') || basePool[2]
        ];
      } else {
        palette = [
          basePool.find(p => p.id === 'xanh_thien_thanh') || basePool[0],
          basePool.find(p => p.id === 'be_moc_linen') || basePool[1],
          basePool.find(p => p.id === 'trang_nga_bach_ngoc') || basePool[2]
        ];
      }
    } else if (garmentId === 'ao_tu_than') {
      palette = [
        basePool.find(p => p.id === 'hong_canh_sen') || basePool[0],
        basePool.find(p => p.id === 'be_moc_linen') || basePool[1],
        basePool.find(p => p.id === 'xanh_cham_co') || basePool[2]
      ];
    } else {
      palette = [
        basePool.find(p => p.id === 'xanh_cham_co') || basePool[0],
        basePool.find(p => p.id === 'trang_nga_bach_ngoc') || basePool[1],
        basePool.find(p => p.id === 'vang_hoang_cuc') || basePool[2]
      ];
    }
  }

  // 2. Garment styling, Footwear & Accessories
  const isNoAccessories = p.includes('không phụ kiện') || p.includes('không dùng phụ kiện') || p.includes('không có phụ kiện');

  if (garmentId === 'ao_tac') {
    if (isTraditionalHigh || occ.includes('tet') || occ.includes('dam_cuoi')) {
      fabricId = 'gam_hoa_chim';
      lowerGarmentId = 'silk_pants_wide';
      footwearId = 'classic_oxford';
      const hasFan = isFanRequestedExplicitly(p);
      accessoryIds = isNoAccessories ? [] : (hasFan ? ['khan_dong_truyen_thong', 'quat_giay_tram_huong'] : ['khan_dong_truyen_thong']);
      contextCautions.push(
        'Áo tấc trong bối cảnh lễ Tết/đám cưới mang tính trang nghiêm cao; nên giữ tay thụng buông dài tự nhiên khi cử hành nghi thức.',
        'Hạ phục quần lụa trắng ống rộng giúp bảo toàn toàn vẹn tỷ lệ mực thước truyền thống của lễ phục thời Nguyễn.'
      );
    } else {
      fabricId = 'sa_to_mong';
      lowerGarmentId = 'tailored_trousers_straight';
      footwearId = 'leather_loafer';
      accessoryIds = isNoAccessories ? [] : ['tui_coton_theu_tay', 'kinh_ram_gong_tron'];
      contextCautions.push(
        'Ống tay thụng hình chữ nhật của Áo tấc buông dài quá bàn tay; khi dạo phố hoặc ngồi cà phê cần chú ý gấp nhẹ cổ tay áo để tránh vướng víu.',
        'Kết hợp quần tây ống đứng mang lại hơi thở đương đại nhưng vẫn tôn trọng cấu trúc 5 thân cổ đứng của áo.'
      );
    }
  } else if (garmentId === 'ao_tu_than') {
    fabricId = 'dui_moc_tu_nhien';
    lowerGarmentId = isTraditionalHigh ? 'vay_dup_den' : 'pleated_skirt_long';
    footwearId = isTraditionalHigh ? 'guoc_moc_truyen_thong' : 'mule_minimalist';
    accessoryIds = isNoAccessories ? [] : ['khan_mo_qua', 'non_thung_quai_thao'];
    contextCautions.push(
      'Áo tứ thân gắn liền với lớp yếm trong độc lập; không nên may liền yếm giả vào thân áo làm mất đi tính phân tầng tự nhiên.',
      'Vạt trước có thể buông thả song song hoặc buộc vạt tùy theo mức độ vận động trong ngày.'
    );
  } else {
    // ngu_than_chen
    if (isTraditionalHigh) {
      fabricId = 'to_tam_ha_dong';
      lowerGarmentId = 'silk_pants_wide';
      footwearId = 'leather_loafer';
      accessoryIds = isNoAccessories ? [] : ['khan_dong_truyen_thong'];
      contextCautions.push(
        'Áo ngũ thân tay chẽn cần ôm khít cổ đứng và cài đủ 5 khuy nách phải để giữ vẻ đĩnh đạc.',
        'Ống tay bóp hẹp gọn gàng giúp người mặc di chuyển linh hoạt mà không lo vướng víu.'
      );
    } else {
      fabricId = 'linen_cao_cap';
      lowerGarmentId = 'tailored_trousers_straight';
      footwearId = 'leather_loafer';
      const hasPearl = isPearlRequestedExplicitly(p);
      accessoryIds = isNoAccessories ? [] : (hasPearl ? ['tui_coton_theu_tay', 'chuoi_ngoc_trai_co'] : ['tui_coton_theu_tay']);
      contextCautions.push(
        'Phom dáng suông buông tự nhiên của áo ngũ thân không nên chiết eo bó sát phong cách áo dài tân thời.',
        'Kết hợp phụ kiện tối giản giúp tổng thể trang phục trẻ trung, hiện đại và ứng dụng cao.'
      );
    }
  }

  // Ensure maximum 2 accessories
  accessoryIds = accessoryIds.slice(0, 2);

  const enrichedPalette = buildEnrichedPalette(palette.slice(0, 3), p);

  return {
    garmentId: garmentId as 'ngu_than_chen' | 'ao_tac' | 'ao_tu_than',
    remixProposal: {
      palette: enrichedPalette,
      fabricId,
      lowerGarmentId,
      footwearId,
      accessoryIds
    },
    contextCautions
  };
}

interface FormattedPaletteItem {
  id: string;
  hex: string;
  name: string;
  role: 'PRIMARY' | 'SUPPORTING' | 'ACCENT';
  origin: 'USER_REQUESTED' | 'AC_SUGGESTED';
}

function buildEnrichedPalette(
  rawPalette: Array<{ id: string; hex: string; name: string; role?: string; origin?: string }>,
  promptText: string
): FormattedPaletteItem[] {
  const p = promptText.toLowerCase();
  const result: FormattedPaletteItem[] = [];

  const isRedPrimary =
    p.includes('đỏ là chủ đạo') ||
    p.includes('đỏ chủ đạo') ||
    p.includes('chủ đạo với tone đỏ') ||
    p.includes('tone đỏ chủ đạo') ||
    p.includes('tone đỏ là chủ đạo');
  const isYellowAccent =
    p.includes('vàng làm điểm nhấn') ||
    p.includes('vàng điểm nhấn') ||
    p.includes('điểm nhấn màu vàng');

  for (let i = 0; i < rawPalette.length && i < 3; i++) {
    const item = rawPalette[i];
    let role: 'PRIMARY' | 'SUPPORTING' | 'ACCENT' =
      (item.role as any) || (i === 0 ? 'PRIMARY' : i === 1 ? 'SUPPORTING' : 'ACCENT');
    let origin: 'USER_REQUESTED' | 'AC_SUGGESTED' = (item.origin as any);

    const itemNameLower = item.name.toLowerCase();
    const isUserMentioned =
      (itemNameLower.includes('đỏ') && p.includes('đỏ')) ||
      (itemNameLower.includes('vàng') && p.includes('vàng')) ||
      (itemNameLower.includes('chàm') && (p.includes('chàm') || p.includes('xanh'))) ||
      (itemNameLower.includes('ngọc') && p.includes('ngọc')) ||
      (itemNameLower.includes('hồng') && p.includes('hồng')) ||
      (itemNameLower.includes('tím') && p.includes('tím')) ||
      (itemNameLower.includes('trắng') && p.includes('trắng')) ||
      (itemNameLower.includes('đen') && p.includes('đen')) ||
      (itemNameLower.includes('thanh') && (p.includes('thiên thanh') || p.includes('xanh nhạt'))) ||
      (itemNameLower.includes('be') && (p.includes('be') || p.includes('mộc')));

    if (!origin) {
      origin = isUserMentioned ? 'USER_REQUESTED' : 'AC_SUGGESTED';
    }

    if (isRedPrimary && itemNameLower.includes('đỏ')) {
      role = 'PRIMARY';
      origin = 'USER_REQUESTED';
    }
    if (isYellowAccent && itemNameLower.includes('vàng')) {
      role = 'ACCENT';
      origin = 'USER_REQUESTED';
    }

    result.push({
      id: item.id,
      hex: item.hex,
      name: item.name,
      role,
      origin
    });
  }

  // Ensure unique roles: one PRIMARY, one SUPPORTING, one ACCENT
  if (result.length === 3) {
    if (isYellowAccent) {
      const yellow = result.find(c => c.name.toLowerCase().includes('vàng'));
      if (yellow) yellow.role = 'ACCENT';
    }
    if (isRedPrimary) {
      const red = result.find(c => c.name.toLowerCase().includes('đỏ'));
      if (red) red.role = 'PRIMARY';
    }

    const roles: Array<'PRIMARY' | 'SUPPORTING' | 'ACCENT'> = ['PRIMARY', 'SUPPORTING', 'ACCENT'];
    const usedRoles = new Set<string>();
    for (const c of result) {
      if (usedRoles.has(c.role)) {
        const available = roles.find(r => !usedRoles.has(r));
        if (available) c.role = available;
      }
      usedRoles.add(c.role);
    }
  }

  return result;
}

// Sanitizer ensuring 100% Validated IDs and Strict Separation
function sanitizeBlueprintOutput(
  garmentId: string,
  output: any,
  promptText?: string,
  policyContext?: {
    wearer?: GenderPresentation;
    occasion?: string;
    style?: string;
    traditionalRatio?: number;
    explorationIntent?: string;
  }
) {
  const proposal = output.remixProposal || {};
  const p = (promptText || '').toLowerCase();
  const isNoBlack = p.includes('không dùng màu đen') || p.includes('tránh màu đen') || p.includes('không có màu đen');

  // Validate palette (keep custom requested colors if valid, or map to catalog)
  let rawPalette: Array<{ id: string; hex: string; name: string; role?: string; origin?: string }> = [];
  if (Array.isArray(proposal.palette)) {
    for (const item of proposal.palette) {
      if (item && item.hex && item.name) {
        if (isNoBlack && (item.id === 'den_tuyen' || item.name.toLowerCase().includes('đen'))) {
          continue; // strictly exclude black
        }
        rawPalette.push({
          id: item.id || `color_${item.hex.replace('#', '')}`,
          hex: item.hex,
          name: item.name,
          role: item.role,
          origin: item.origin
        });
      }
    }
  }

  if (rawPalette.length < 3) {
    const defaults = PALETTES.filter(c => !(isNoBlack && c.id === 'den_tuyen'));
    for (const d of defaults) {
      if (rawPalette.length >= 3) break;
      if (!rawPalette.some(c => c.id === d.id)) {
        rawPalette.push({
          id: d.id,
          hex: d.hex,
          name: d.name
        });
      }
    }
  }
  const enrichedPalette = buildEnrichedPalette(rawPalette.slice(0, 3), promptText || '');

  // Validate fabricId
  let fabricId = proposal.fabricId;
  if (!FABRICS.some(f => f.id === fabricId)) {
    fabricId = FABRICS[0].id;
  }

  // Validate lowerGarmentId
  let lowerGarmentId = proposal.lowerGarmentId;
  if (!LOWER_GARMENTS.some(l => l.id === lowerGarmentId)) {
    lowerGarmentId = LOWER_GARMENTS[0].id;
  }

  // Validate footwearId (Strictly single footwear from FOOTWEAR)
  let footwearId = proposal.footwearId;
  if (!FOOTWEAR.some(f => f.id === footwearId)) {
    footwearId = FOOTWEAR[0].id;
  }

  // Determine allowed accessories based on Cultural Product Rules v1.1 policy
  const effectiveRatio = typeof policyContext?.traditionalRatio === 'number' ? policyContext.traditionalRatio : 50;
  const allowedAccessories = getPolicyCompatibleAccessories({
    garmentId: garmentId as GarmentId,
    wearer: policyContext?.wearer || 'nam',
    occasion: policyContext?.occasion,
    style: policyContext?.style,
    traditionalRatio: effectiveRatio,
    promptText,
    explorationIntent: policyContext?.explorationIntent
  });
  const allowedIds = new Set(allowedAccessories.map(a => a.id));

  // Validate accessoryIds (Strictly 0 to 2 accessories, never footwear, strictly policy-compatible)
  let accessoryIds: string[] = [];
  if (Array.isArray(proposal.accessoryIds)) {
    accessoryIds = proposal.accessoryIds
      .filter((id: string) => allowedIds.has(id) && !FOOTWEAR.some(f => f.id === id))
      .slice(0, 2);
  }

  // If user requested no accessories, ensure empty
  if (p.includes('không phụ kiện') || p.includes('không dùng phụ kiện') || p.includes('không có phụ kiện')) {
    accessoryIds = [];
  }

  // Cautions
  const contextCautions = Array.isArray(output.contextCautions) && output.contextCautions.length > 0
    ? output.contextCautions
    : [
        'Bảo toàn phom dáng và cấu trúc cổ đứng lập lĩnh của trang phục truyền thống.',
        'Kết hợp phụ kiện hiện đại tạo điểm nhấn tinh tế mà không làm lu mờ nhận diện cội nguồn.'
      ];

  // Extract canonical context props from promptText or output
  const extractedProps = extractContextPropsFromPrompt(promptText, policyContext?.occasion);
  const rawContextProps = Array.isArray(proposal.contextProps) ? proposal.contextProps : [];
  const mergedContextProps = [...extractedProps];
  for (const prop of rawContextProps) {
    if (prop && prop.description && !mergedContextProps.some(p => p.description.toLowerCase() === prop.description.toLowerCase())) {
      mergedContextProps.push(prop);
    }
  }

  return {
    garmentId,
    remixProposal: {
      palette: enrichedPalette,
      fabricId,
      lowerGarmentId,
      footwearId,
      accessoryIds,
      contextProps: mergedContextProps
    },
    contextCautions
  };
}

/**
 * PHASE 3A: Grounded AC Chat Assistant (Read-Only)
 * POST /api/ac-chat
 */
app.post('/api/ac-chat', async (req, res) => {
  const startTime = Date.now();
  const payload: ACChatRequestPayload = req.body || {};
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  // 1. Input validation
  if (!message) {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_CHAT_REQUEST',
      message: 'Tin nhắn không được để trống.',
      retryable: false
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      status: 400,
      code: 'MESSAGE_TOO_LONG',
      message: 'Tin nhắn quá dài (tối đa 1.000 ký tự).',
      retryable: false
    });
  }

  // Bound history to max 8 recent items
  const rawHistory = Array.isArray(payload.history) ? payload.history : [];
  const boundedHistory = rawHistory
    .slice(-8)
    .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
    .map(h => ({ role: h.role, content: h.content.trim().slice(0, 1000) }));

  const currentGarment = payload.contextState?.garmentId || 'ngu_than_chen';
  const requestId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });

    const groundingContext = buildACChatGroundingContext({
      message,
      history: boundedHistory,
      contextState: payload.contextState
    });

    const systemInstruction = `${AC_CHAT_SYSTEM_INSTRUCTION}

=== TÀI LIỆU CĂN CỨ VĂN HÓA & TRẠNG THÁI HIỆN TẠI (CLOSED-WORLD GROUNDING) ===
${groundingContext}`;

    // Construct Gemini contents array
    const contents: any[] = [];
    for (const item of boundedHistory) {
      contents.push({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const chatResponseSchema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING },
        answerMode: {
          type: Type.STRING,
          enum: ['CULTURAL_KNOWLEDGE', 'PRODUCT_GUIDANCE', 'CURRENT_LOOK_EXPLANATION', 'INSUFFICIENT_EVIDENCE']
        },
        evidenceRefs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceId: { type: Type.STRING },
              evidenceStatus: {
                type: Type.STRING,
                enum: ['VERIFIED', 'PROBABLE', 'APPROXIMATE', 'DISPUTED', 'UNKNOWN']
              },
              claimId: { type: Type.STRING }
            },
            required: ['sourceId', 'evidenceStatus']
          }
        },
        action: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['SET_FOOTWEAR', 'SET_FABRIC', 'ADD_ACCESSORY', 'SET_COLOR']
            },
            targetValue: { type: Type.STRING },
            targetValueName: { type: Type.STRING },
            label: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['type', 'targetValue', 'label', 'description']
        },
        relatedCurrentState: {
          type: Type.OBJECT,
          properties: {
            garmentId: { type: Type.STRING },
            fingerprint: { type: Type.STRING },
            generationId: { type: Type.STRING }
          }
        }
      },
      required: ['answer', 'answerMode', 'evidenceRefs']
    };

    const routeResult = await routeGeminiTask({
      task: 'AC_CHAT',
      requestId,
      deadlineMs: 18000,
      candidateTimeoutCapMs: 16000,
      isStillCurrent: () => !clientDisconnected,
      executeWithModel: async (modelId, isCanary, signal) => {
        const response = await ai.models.generateContent({
          model: modelId,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: chatResponseSchema
          }
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return validateAndSanitizeACChatResponse(parsed, currentGarment, payload.contextState);
      },
      repairWithModel: async (modelId, rawOutput, errorMsg, signal) => {
        const repairPrompt = `Lược đồ trả về trước đó bị lỗi hoặc thiếu trường: ${errorMsg}. Vui lòng tạo lại JSON hợp lệ tuân thủ đúng schema AC Chat.`;
        const response = await ai.models.generateContent({
          model: modelId,
          contents: [
            ...contents,
            { role: 'model', parts: [{ text: typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput) }] },
            { role: 'user', parts: [{ text: repairPrompt }] }
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: chatResponseSchema
          }
        });
        const parsed = JSON.parse(response.text?.trim() || '{}');
        return validateAndSanitizeACChatResponse(parsed, currentGarment, payload.contextState);
      }
    });

    const executionTimeMs = Date.now() - startTime;
    // Operational logging ONLY (no raw prompt/answer logged)
    console.log(`[AC Chat] Success: reqId=${requestId}, task=AC_CHAT, chars=${message.length}, history=${boundedHistory.length}, garment=${currentGarment}, mode=${routeResult.result.answerMode}, time=${executionTimeMs}ms`);

    const chatResult = routeResult.result;
    if (chatResult.action && payload.contextState?.blueprint && payload.chatSessionId) {
      const reg = globalActionRegistry.registerAction({
        chatSessionId: payload.chatSessionId,
        sourceBlueprint: payload.contextState.blueprint,
        action: chatResult.action,
        context: {
          occasion: payload.contextState.occasion,
          style: payload.contextState.style,
          traditionalRatio: payload.contextState.traditionalRatio,
          genderPresentation: payload.contextState.genderPresentation,
          promptText: payload.contextState.promptText
        }
      });
      chatResult.action.actionId = reg.actionId;
    }

    return res.status(200).json(chatResult);
  } catch (err: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error(`[AC Chat] Error: reqId=${requestId}, task=AC_CHAT, code=${err.code || 'CHAT_ERROR'}, time=${executionTimeMs}ms:`, err.message);

    // Provide fallback if possible rather than hard 500 error
    if (err.status === 429 || err.code === 'CANDIDATE_TIMEOUT' || err.status === 504) {
      return res.status(503).json({
        status: 503,
        code: 'CHAT_SERVICE_BUSY',
        message: 'Trợ lý AC Chat đang xử lý nhiều yêu cầu, vui lòng nhấn "Thử lại" sau giây lát.',
        retryable: true
      });
    }

    return res.status(err.status || 500).json({
      status: err.status || 500,
      code: err.code || 'CHAT_INFERENCE_ERROR',
      message: 'Không thể kết nối với dịch vụ AC Chat. Bạn có thể nhấn thử lại tin nhắn.',
      retryable: true
    });
  }
});

/**
 * PHASE 3B: Server-Authoritative Safe Mutation
 * POST /api/ac-chat/mutate
 * Accepts: { actionId, currentFingerprint, chatSessionId }
 */
app.post('/api/ac-chat/mutate', async (req, res) => {
  const payload: ACChatMutatePayload = req.body || {};
  const { actionId, currentFingerprint, chatSessionId } = payload;

  if (!actionId || typeof actionId !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_MUTATE_REQUEST',
      message: 'Thiếu actionId để áp dụng gợi ý.'
    });
  }

  if (!currentFingerprint || typeof currentFingerprint !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_MUTATE_REQUEST',
      message: 'Thiếu currentFingerprint để đối chiếu tính nhất quán.'
    });
  }

  if (!chatSessionId || typeof chatSessionId !== 'string') {
    return res.status(400).json({
      status: 400,
      code: 'INVALID_MUTATE_REQUEST',
      message: 'Thiếu chatSessionId để xác thực phiên làm việc.'
    });
  }

  const result = globalActionRegistry.applyAction({
    actionId,
    currentFingerprint,
    chatSessionId
  });

  if (result.status !== 200 || !result.data) {
    return res.status(result.status).json({
      status: result.status,
      code: result.code,
      message: result.message
    });
  }

  console.log(`[AC Chat Mutate] Applied actionId=${actionId}, session=${chatSessionId}, nextFingerprint=${result.data.nextFingerprint}`);
  return res.status(200).json(result.data);
});

// Express API Error Middleware: Guarantee JSON response and X-AC-API-Response header on all /api errors
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('X-AC-API-Response', '1');
  res.setHeader('Content-Type', 'application/json');
  const status = err.status || err.statusCode || 500;
  console.error(`[API Error Middleware] Uncaught error on ${req.method} ${req.path}:`, err.message || err);
  return res.status(status).json({
    status,
    code: err.code || 'API_SERVER_ERROR',
    message: err.message || 'Lỗi xử lý yêu cầu máy chủ.',
    retryable: true
  });
});

// Express API Guard: Catch any unmatched /api/* request and return typed JSON 404
app.all('/api/*', (req, res) => {
  console.warn(`[API Fallback] Unmatched API request: ${req.method} ${req.path}`);
  return res.status(404).json({
    code: 'API_ENDPOINT_NOT_FOUND',
    message: `API route ${req.method} ${req.path} không tồn tại.`,
    status: 404
  });
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AC Co-pilot] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
