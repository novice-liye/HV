// ============================================================
// NovelReader - 小说阅读器
// 支持上传小说、按章节拆分、搜索、点击跳转
// ============================================================

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface Chapter {
  id: number;
  title: string;
  lines: string[];
}

export const NovelReader: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [lineOffsets, setLineOffsets] = useState<Map<number, number>>(new Map());
  const [searchResults, setSearchResults] = useState<{ chapterId: number; lineIndex: number; text: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 章节拆分：支持多种章节格式
  const parseChapters = useCallback((text: string): Chapter[] => {
    const lines = text.split(/\r?\n/);
    const chapterPatterns = [
      /^第[零一二三四五六七八九十百千万\d]+[章节回卷集篇部]/,
      /^Chapter\s+\d+/i,
      /^卷[零一二三四五六七八九十百千万\d]+/,
      /^【第[零一二三四五六七八九十百千万\d]+[章节回卷集篇部]】/,
      /^\d+[、.．]\s*.+/,
    ];

    const result: Chapter[] = [];
    let currentChapter: Chapter | null = null;

    for (const line of lines) {
      const isChapterStart = chapterPatterns.some(p => p.test(line.trim()));
      if (isChapterStart) {
        if (currentChapter) result.push(currentChapter);
        currentChapter = { id: result.length, title: line.trim(), lines: [] };
      } else if (currentChapter) {
        if (line.trim()) currentChapter.lines.push(line.trim());
      } else {
        // 正文在第一个章节之前，归入"序章"
        if (line.trim()) {
          if (!currentChapter) {
            currentChapter = { id: result.length, title: '序章', lines: [] };
          }
          currentChapter.lines.push(line.trim());
        }
      }
    }
    if (currentChapter) result.push(currentChapter);
    if (result.length === 0 && text.trim()) {
      result.push({ id: 0, title: '全文', lines: lines.filter(l => l.trim()) });
    }
    return result;
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseChapters(text);
      setChapters(parsed);
      setActiveChapter(parsed.length > 0 ? 0 : null);
      setSearchText('');
      setSearchResults([]);
      setShowSearchResults(false);
    };
    reader.readAsText(file, 'UTF-8');
  }, [parseChapters]);

  // 搜索
  const handleSearch = useCallback(() => {
    if (!searchText.trim() || isComposing) return;
    const keyword = searchText.trim().toLowerCase();
    const results: { chapterId: number; lineIndex: number; text: string }[] = [];
    chapters.forEach(ch => {
      ch.lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(keyword)) {
          results.push({ chapterId: ch.id, lineIndex: idx, text: line });
        }
      });
    });
    setSearchResults(results);
    setShowSearchResults(true);
  }, [searchText, isComposing, chapters]);

  // 跳转到指定章节和行
  const jumpToPosition = useCallback((chapterId: number, lineIndex: number) => {
    setActiveChapter(chapterId);
    setShowSearchResults(false);
    // 等待渲染后滚动
    setTimeout(() => {
      const el = document.getElementById(`line-${chapterId}-${lineIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('novel-line--highlight');
        setTimeout(() => el.classList.remove('novel-line--highlight'), 2000);
      }
    }, 100);
  }, []);

  // 记录行偏移量用于虚拟滚动定位
  useEffect(() => {
    if (!contentRef.current || activeChapter === null) return;
    const container = contentRef.current;
    const offsets = new Map<number, number>();
    const lineElements = container.querySelectorAll('[data-line-index]');
    lineElements.forEach(el => {
      const idx = parseInt(el.getAttribute('data-line-index') || '0');
      offsets.set(idx, (el as HTMLElement).offsetTop);
    });
    setLineOffsets(offsets);
  }, [activeChapter]);

  // 当前章节内容
  const currentChapter = activeChapter !== null ? chapters[activeChapter] : null;

  // 搜索结果按章节分组
  const groupedResults = useMemo(() => {
    const groups: Record<number, { chapterId: number; chapterTitle: string; matches: { lineIndex: number; text: string }[] }> = {};
    searchResults.forEach(r => {
      if (!groups[r.chapterId]) {
        groups[r.chapterId] = {
          chapterId: r.chapterId,
          chapterTitle: chapters[r.chapterId]?.title || '',
          matches: [],
        };
      }
      groups[r.chapterId].matches.push({ lineIndex: r.lineIndex, text: r.text });
    });
    return Object.values(groups);
  }, [searchResults, chapters]);

  // 统计
  const totalLines = useMemo(() => chapters.reduce((s, c) => s + c.lines.length, 0), [chapters]);

  return (
    <div className="novel-reader">
      {/* 顶部栏 */}
      <div className="novel-reader__header">
        <div className="novel-reader__header-left">
          <span className="novel-reader__icon">📖</span>
          <div>
            <div className="novel-reader__title">小说阅读器</div>
            <div className="novel-reader__subtitle">
              {fileName
                ? `${fileName} · ${chapters.length} 章 · ${totalLines} 行`
                : '上传小说文件开始阅读'}
            </div>
          </div>
        </div>
        <div className="novel-reader__header-right">
          {chapters.length > 0 && (
            <div className="novel-reader__search-box">
              <input
                type="text"
                className="novel-reader__search-input"
                placeholder="搜索内容..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setShowSearchResults(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => { setIsComposing(false); setTimeout(handleSearch, 0); }}
              />
              <button className="novel-reader__search-btn" onClick={handleSearch}>🔍</button>
              {searchResults.length > 0 && showSearchResults && (
                <div className="novel-reader__search-results">
                  <div className="novel-reader__search-summary">
                    找到 {searchResults.length} 条结果
                  </div>
                  {groupedResults.slice(0, 20).map(group => (
                    <div key={group.chapterId} className="novel-reader__search-group">
                      <div className="novel-reader__search-group-title">{group.chapterTitle}</div>
                      {group.matches.slice(0, 3).map((m, i) => (
                        <div
                          key={i}
                          className="novel-reader__search-result-item"
                          onClick={() => jumpToPosition(group.chapterId, m.lineIndex)}
                        >
                          <span className="novel-reader__search-result-line">第{m.lineIndex + 1}行</span>
                          <span className="novel-reader__search-result-text">
                            {highlightText(m.text, searchText)}
                          </span>
                        </div>
                      ))}
                      {group.matches.length > 3 && (
                        <div
                          className="novel-reader__search-result-more"
                          onClick={() => jumpToPosition(group.chapterId, group.matches[0].lineIndex)}
                        >
                          共 {group.matches.length} 条，点击查看
                        </div>
                      )}
                    </div>
                  ))}
                  {groupedResults.length > 20 && (
                    <div className="novel-reader__search-result-more">
                      还有更多结果...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button className="novel-reader__upload-btn" onClick={() => fileInputRef.current?.click()}>
            📁 上传小说
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.text,.novel"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* 主体 */}
      {chapters.length === 0 ? (
        <div className="novel-reader__empty">
          <div className="novel-reader__empty-icon">📚</div>
          <div className="novel-reader__empty-title">上传小说文件</div>
          <div className="novel-reader__empty-desc">
            支持 .txt 格式，自动按章节拆分<br />
            支持的章节格式：第X章、第X节、第X回、卷X 等
          </div>
          <button className="novel-reader__empty-btn" onClick={() => fileInputRef.current?.click()}>
            选择文件
          </button>
        </div>
      ) : (
        <div className="novel-reader__body">
          {/* 左侧章节目录 */}
          <div className="novel-reader__sidebar">
            <div className="novel-reader__sidebar-title">章节目录</div>
            <div className="novel-reader__chapter-list">
              {chapters.map(ch => (
                <div
                  key={ch.id}
                  className={`novel-reader__chapter-item ${activeChapter === ch.id ? 'novel-reader__chapter-item--active' : ''}`}
                  onClick={() => { setActiveChapter(ch.id); setShowSearchResults(false); }}
                >
                  <div className="novel-reader__chapter-name">{ch.title}</div>
                  <div className="novel-reader__chapter-count">{ch.lines.length} 行</div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="novel-reader__content" ref={contentRef}>
            {currentChapter && (
              <>
                <div className="novel-reader__content-title">{currentChapter.title}</div>
                <div className="novel-reader__content-lines">
                  {currentChapter.lines.map((line, idx) => (
                    <div
                      key={idx}
                      id={`line-${currentChapter.id}-${idx}`}
                      data-line-index={idx}
                      className="novel-reader__line"
                      onClick={() => {
                        // 点击行可以复制或做标记
                      }}
                    >
                      <span className="novel-reader__line-number">{idx + 1}</span>
                      <span className="novel-reader__line-text">{line}</span>
                    </div>
                  ))}
                </div>
                {activeChapter !== null && activeChapter < chapters.length - 1 && (
                  <button
                    className="novel-reader__next-btn"
                    onClick={() => {
                      setActiveChapter(activeChapter + 1);
                      contentRef.current?.scrollTo(0, 0);
                    }}
                  >
                    下一章：{chapters[activeChapter + 1].title} →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 搜索高亮
function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  const idx = lower.indexOf(kw);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#c9a96e', fontWeight: 600 }}>{text.slice(idx, idx + keyword.length)}</span>
      {text.slice(idx + keyword.length)}
    </>
  );
}
