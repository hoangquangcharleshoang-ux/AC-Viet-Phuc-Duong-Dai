/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 3A: AC Chat Drawer Component
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Check
} from 'lucide-react';
import {
  ACChatMessage,
  ACChatEvidenceRef,
  ACChatRequestPayload,
  GarmentId,
  GenderPresentation,
  BlueprintOutput,
  GenerationSnapshot,
  VisualQAState,
  EvidenceStatus,
  ACChatAction
} from '../types/index';
import { GARMENTS, OCCASIONS } from '../data/culturalKnowledgePack';
import { sendACChatMessage, ACChatServiceError } from '../services/acChatService';

interface ACChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessionId: string;
  currentFingerprint?: string;
  currentGarmentId?: GarmentId;
  genderPresentation?: GenderPresentation;
  activeOccasion?: string;
  activeStyle?: string;
  traditionalRatio?: number;
  promptText?: string;
  blueprint?: BlueprintOutput | null;
  snapshot?: GenerationSnapshot | null;
  visualQAState?: VisualQAState;
  messages: ACChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ACChatMessage[]>>;
  onApplyAction?: (action: ACChatAction) => Promise<void> | void;
  onClearChat?: () => void;
}

export const ACChatDrawer: React.FC<ACChatDrawerProps> = ({
  isOpen,
  onClose,
  chatSessionId,
  currentFingerprint,
  currentGarmentId,
  genderPresentation,
  activeOccasion,
  activeStyle,
  traditionalRatio,
  promptText = '',
  blueprint,
  snapshot,
  visualQAState,
  messages,
  setMessages,
  onApplyAction,
  onClearChat
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [applyingActionId, setApplyingActionId] = useState<string | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const hasActiveLook = Boolean(blueprint && currentGarmentId);
  const garmentName = currentGarmentId ? (GARMENTS[currentGarmentId]?.canonical_name || currentGarmentId) : '';

  // Construct context state for API request
  const buildContextState = (): ACChatRequestPayload['contextState'] => {
    if (!hasActiveLook) {
      return undefined;
    }

    let bpSummary: NonNullable<ACChatRequestPayload['contextState']>['blueprintSummary'] = undefined;
    if (blueprint?.remixProposal) {
      const p = blueprint.remixProposal;
      const primaryColor = p.palette?.find(c => c.role === 'PRIMARY') || p.palette?.[0];
      bpSummary = {
        primaryColorName: primaryColor?.name,
        primaryColorHex: primaryColor?.hex,
        fabricName: p.fabricId,
        lowerGarmentName: p.lowerGarmentId,
        accessoryNames: p.accessoryIds,
        culturalReasoning: blueprint.contextCautions?.join(' ')
      };
    }

    let qaSummary: NonNullable<ACChatRequestPayload['contextState']>['visualQA'] = undefined;
    if (visualQAState?.status === 'success') {
      const q = visualQAState.result;
      const nonAssess = q.culturalIdentity.traits
        .filter(t => t.verdict === 'NOT_ASSESSABLE')
        .map(t => t.traitNameVi);
      const fails = q.culturalIdentity.traits
        .filter(t => t.verdict === 'FAIL')
        .map(t => t.traitNameVi);
      const partials = q.culturalIdentity.traits
        .filter(t => t.verdict === 'PARTIAL')
        .map(t => t.traitNameVi);

      qaSummary = {
        status: q.culturalIdentity.overallStatus,
        statusLabelVi: q.culturalIdentity.statusLabelVi,
        overallFidelity: q.outfitFidelity.overallFidelity,
        nonAssessableTraits: nonAssess,
        failedTraits: fails,
        partialTraits: partials,
        unexpectedAccessories: q.outfitFidelity.details.unexpectedAccessories
      };
    }

    return {
      garmentId: currentGarmentId,
      genderPresentation,
      occasion: activeOccasion,
      style: activeStyle,
      traditionalRatio,
      promptText,
      blueprint: blueprint || undefined,
      blueprintSummary: bpSummary,
      snapshot: snapshot ? {
        fingerprint: snapshot.boundFingerprint,
        activeAccessoryIds: snapshot.activeAccessoryIds
      } : undefined,
      visualQA: qaSummary
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessageId = `msg_user_${Date.now()}`;
    const userMessage: ACChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = newMessages
        .slice(0, -1)
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendACChatMessage(
        {
          message: text,
          chatSessionId,
          history,
          contextState: buildContextState()
        },
        controller.signal
      );

      const assistantMessage: ACChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
        responseMeta: {
          answerMode: response.answerMode,
          evidenceRefs: response.evidenceRefs,
          action: response.action,
          relatedCurrentState: response.relatedCurrentState
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      const errorMessage: ACChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: err.message || 'Không thể kết nối với trợ lý AC Chat. Vui lòng thử lại.',
        timestamp: Date.now(),
        error: true,
        retryable: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLast = () => {
    // Find last user message before the error
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;
    const realIndex = messages.length - 1 - lastUserIndex;
    const lastUserMsg = messages[realIndex];

    // Remove the error message and retry
    setMessages(prev => prev.slice(0, realIndex));
    handleSendMessage(lastUserMsg.content);
  };

  const handleClearChat = () => {
    setMessages([]);
    setExpandedEvidenceId(null);
    if (onClearChat) {
      onClearChat();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-stone-50 border-l border-stone-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-200/80 bg-white/90 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                  AC Chat
                </h2>
                <p className="text-xs text-stone-500">Hỏi về Việt phục, cách phối và bản phối hiện tại.</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                  title="Xóa hội thoại"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                title="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner: only shown when a real active Look exists */}
          {hasActiveLook && currentGarmentId && (
            <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/50 flex items-center justify-between text-xs text-stone-700">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-stone-500">Bản phối hiện tại:</span>
                <span className="font-semibold text-stone-900 truncate">
                  {garmentName}
                  {genderPresentation ? ` · ${genderPresentation === 'nam' ? 'Nam' : genderPresentation === 'nu' ? 'Nữ' : 'Linh hoạt'}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="py-6 px-2 space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900">Bắt đầu trò chuyện cùng AC</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                    Bạn có thể hỏi AC về kiểu áo, chi tiết văn hóa, cách phối hoặc bản phối hiện tại.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-1">
                    Gợi ý câu hỏi nhanh:
                  </p>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('Áo tấc khác gì Áo ngũ thân tay chẽn?')}
                      className="w-full text-left text-xs p-2.5 rounded-lg bg-white border border-stone-200/80 hover:border-amber-400/60 hover:bg-amber-50/30 text-stone-800 transition-all cursor-pointer shadow-2xs"
                    >
                      💡 Áo tấc khác gì Áo ngũ thân tay chẽn?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('Áo tứ thân có phải trang phục truyền thống của nam giới Bắc Bộ không?')}
                      className="w-full text-left text-xs p-2.5 rounded-lg bg-white border border-stone-200/80 hover:border-amber-400/60 hover:bg-amber-50/30 text-stone-800 transition-all cursor-pointer shadow-2xs"
                    >
                      📜 Áo tứ thân có trang phục lịch sử cho nam không?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('Vòng ngọc trai có phải phụ kiện truyền thống bắt buộc của áo tấc không?')}
                      className="w-full text-left text-xs p-2.5 rounded-lg bg-white border border-stone-200/80 hover:border-amber-400/60 hover:bg-amber-50/30 text-stone-800 transition-all cursor-pointer shadow-2xs"
                    >
                      📿 Vòng ngọc trai có phải phụ kiện truyền thống của Áo tấc?
                    </button>
                    {visualQAState?.status === 'success' && (
                      <button
                        type="button"
                        onClick={() => handleQuickPrompt('Giải thích đánh giá của AC Stylist và kết quả Visual QA cho bản phối hiện tại.')}
                        className="w-full text-left text-xs p-2.5 rounded-lg bg-white border border-amber-200/80 hover:border-amber-400 hover:bg-amber-50/50 text-amber-900 font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        ✨ Giải thích đánh giá của AC Stylist cho ảnh hiện tại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-amber-50/90 border border-amber-200/70 text-stone-800 px-4 py-2.5 text-xs leading-relaxed shadow-2xs">
                      {msg.content}
                    </div>
                  ) : msg.error ? (
                    <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">{msg.content}</div>
                      </div>
                      {msg.retryable && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleRetryLast}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-white border border-rose-300 rounded hover:bg-rose-100/50 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Thử lại</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[90%] space-y-2">
                      <div className="rounded-2xl rounded-tl-xs bg-white border border-stone-200/80 p-3.5 text-xs leading-relaxed text-stone-800 shadow-2xs space-y-2">
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Action Card (G3B Safe Mutations) */}
                        {msg.responseMeta?.action && blueprint && (() => {
                          const action = msg.responseMeta.action;
                          const isApplied = Boolean(action.isApplied);
                          const isApplying = applyingActionId === (action.actionId || `${msg.id}_act`);
                          const isCompatible = !action.actionId || true;

                          const handleCardClick = async () => {
                            if (isApplied || isApplying || !onApplyAction) return;
                            const currentId = action.actionId || `${msg.id}_act`;
                            setApplyingActionId(currentId);
                            try {
                              await onApplyAction(action);
                              // Mark applied in message state
                              setMessages(prev => prev.map(m => {
                                if (m.id === msg.id && m.responseMeta?.action) {
                                  return {
                                    ...m,
                                    responseMeta: {
                                      ...m.responseMeta,
                                      action: {
                                        ...m.responseMeta.action,
                                        isApplied: true
                                      }
                                    }
                                  };
                                }
                                return m;
                              }));
                            } catch (err) {
                              console.error('Failed to apply action:', err);
                            } finally {
                              setApplyingActionId(null);
                            }
                          };

                          return (
                            <div className={`mt-2.5 p-3 rounded-xl border shadow-2xs space-y-2 transition-all ${
                              isApplied
                                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                                : 'bg-amber-50/80 border-amber-200/80 text-stone-900'
                            }`}>
                              <div className="flex items-start gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                                  isApplied ? 'bg-emerald-500/20 text-emerald-800' : 'bg-amber-500/20 text-amber-800'
                                }`}>
                                  {isApplied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="font-semibold text-xs">
                                    {action.label}
                                  </div>
                                  <p className="text-[11px] text-stone-600 leading-relaxed">
                                    {action.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={isApplied || isApplying}
                                  onClick={handleCardClick}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1 ${
                                    isApplied
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default opacity-90'
                                      : isApplying
                                      ? 'bg-amber-600 text-white cursor-wait opacity-75'
                                      : 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer'
                                  }`}
                                >
                                  {isApplied ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Đã áp dụng</span>
                                    </>
                                  ) : isApplying ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Đang áp dụng...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Áp dụng gợi ý</span>
                                      <span>→</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Evidence References Collapsible */}
                        {msg.responseMeta?.evidenceRefs && msg.responseMeta.evidenceRefs.length > 0 && (
                          <div className="pt-2 border-t border-stone-100 mt-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedEvidenceId(expandedEvidenceId === msg.id ? null : msg.id)
                              }
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-900 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 text-amber-600" />
                              <span>Nguồn tham khảo ({msg.responseMeta.evidenceRefs.length})</span>
                              {expandedEvidenceId === msg.id ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {expandedEvidenceId === msg.id && (
                              <div className="mt-2 space-y-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200/60 animate-in fade-in duration-150">
                                {msg.responseMeta.evidenceRefs.map((ref, idx) => {
                                  const metaLine = [ref.author || ref.institution, ref.year].filter(Boolean).join(' · ');
                                  return (
                                    <div
                                      key={`${ref.sourceId}_${idx}`}
                                      className="text-[11px] text-stone-700 flex flex-col gap-0.5 pb-2 last:pb-0 border-b last:border-b-0 border-stone-200/50"
                                    >
                                      <div className="font-semibold text-stone-900 leading-snug">
                                        {ref.title || 'Nguồn tư liệu chuẩn'}
                                      </div>
                                      {metaLine && (
                                        <div className="text-[10px] text-stone-500">
                                          {metaLine}
                                        </div>
                                      )}
                                      {ref.url && (
                                        <a
                                          href={ref.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] text-amber-700 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                        >
                                          Xem tư liệu gốc →
                                        </a>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="rounded-2xl rounded-tl-xs bg-white border border-stone-200/80 p-3 text-xs text-stone-500 shadow-2xs flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>AC đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-stone-200 bg-white space-y-2">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="space-y-1.5"
            >
              <div className="relative flex items-center">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value.slice(0, 1000))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Hỏi AC về cấu trúc, lịch sử hoặc bản phối..."
                  rows={2}
                  disabled={isLoading}
                  className="w-full text-xs p-2.5 pr-10 rounded-xl bg-stone-50 border border-stone-200/90 focus:border-amber-500 focus:bg-white focus:outline-hidden resize-none transition-all placeholder:text-stone-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-amber-700 text-amber-50 hover:bg-amber-800 disabled:opacity-30 disabled:hover:bg-amber-700 transition-colors cursor-pointer"
                  title="Gửi câu hỏi"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {inputText.length >= 700 && (
                <div className="flex items-center justify-end text-[10px] text-stone-400 px-1">
                  <span className={inputText.length >= 950 ? 'text-amber-700 font-medium' : ''}>
                    {inputText.length}/1000
                  </span>
                </div>
              )}
            </form>

            {/* Subtle Disclaimer */}
            <p className="text-[10px] text-stone-400 text-center leading-tight">
              Thông tin từ AC mang tính tham khảo và có thể có sai sót. Hãy đối chiếu lại những thông tin quan trọng.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
