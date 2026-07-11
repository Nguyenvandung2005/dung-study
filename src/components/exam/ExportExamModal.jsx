import React, { useState, useEffect } from 'react';
import './ExportExamModal.css';

export default function ExportExamModal({ isOpen, onClose, exam }) {
  if (!isOpen || !exam) return null;

  // Detect exam type
  const getInitialExamType = () => {
    const questions = exam.questions || [];
    const hasMCQ = questions.some(q => q.type === 'SINGLE_CHOICE');
    const hasEssay = questions.some(q => q.type === 'ESSAY');
    if (hasMCQ && hasEssay) return 'Trắc nghiệm + Tự luận';
    if (hasEssay) return 'Tự luận';
    return 'Trắc nghiệm';
  };

  const [headerState, setHeaderState] = useState({
    schoolName: 'TRƯỜNG ĐẠI HỌC LUẬT TP. HCM',
    department: 'KHOA...',
    examTitle: 'ĐỀ THI KẾT THÚC HỌC PHẦN',
    semesterYear: 'HỌC KỲ..., NĂM HỌC 20...-20...',
    examType: getInitialExamType(),
    subject: exam.subject || 'Tên môn học',
    examNo: '01',
    timeLimit: String(exam.timeLimit || 60),
    note: '(Không sử dụng tài liệu)',
    examCode: '101'
  });

  // 'all' | 'questions' | 'answers'
  const [exportMode, setExportMode] = useState('all');

  useEffect(() => {
    setHeaderState(prev => ({
      ...prev,
      subject: exam.subject || 'Tên môn học',
      timeLimit: String(exam.timeLimit || 60),
      examType: getInitialExamType()
    }));
  }, [exam]);

  const handleChange = (field, value) => {
    setHeaderState(prev => ({ ...prev, [field]: value }));
  };

  // Generate full HTML for Word / PDF export
  const generateExamHtml = () => {
    const questions = exam.questions || [];
    const mcqQuestions = questions.filter(q => q.type === 'SINGLE_CHOICE');
    const essayQuestions = questions.filter(q => q.type === 'ESSAY');

    // 1. Header HTML
    const headerHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-family: 'Times New Roman', serif;">
        <tr>
          <td style="width: 48%; text-align: center; vertical-align: top; padding: 4px;">
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">${headerState.schoolName}</div>
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 2px;">${headerState.department}</div>
          </td>
          <td style="width: 52%; text-align: center; vertical-align: top; padding: 4px;">
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">${headerState.examTitle}</div>
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 2px;">${headerState.semesterYear}</div>
          </td>
        </tr>
        <tr>
          <td style="width: 48%; vertical-align: top; padding: 10px 4px 4px 4px; font-size: 12pt;">
            <div style="margin-bottom: 4px;"><b>Hình thức thi:</b> ${headerState.examType}</div>
            <div style="margin-bottom: 4px;"><b>MÔN HỌC:</b> ${headerState.subject}</div>
            <div><b>ĐỀ THI SỐ:</b> <span style="text-decoration: underline; font-weight: bold;">${headerState.examNo}</span></div>
          </td>
          <td style="width: 52%; text-align: center; vertical-align: top; padding: 10px 4px 4px 4px; font-size: 12pt;">
            <div style="margin-bottom: 4px;"><b>Thời gian làm bài:</b></div>
            <div style="margin-bottom: 4px;">(${headerState.note})</div>
            <div><b>MÃ ĐỀ THI:</b> <span style="text-decoration: underline; font-weight: bold;">${headerState.examCode}</span></div>
          </td>
        </tr>
      </table>
    `;

    // 2. Candidate Info HTML
    const candidateInfoHtml = `
      <div style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 18px; border-bottom: 1px dashed #444; padding-bottom: 12px;">
        <span style="display: inline-block; width: 60%;"><b>Họ và tên thí sinh:</b> ..............................................................</span>
        <span style="display: inline-block; width: 38%;"><b>Số báo danh:</b> ..........................</span>
      </div>
    `;

    // 3. Questions section HTML
    let questionsHtml = '';
    if (exportMode === 'all' || exportMode === 'questions') {
      questions.forEach((q, idx) => {
        // Format options
        let optionsHtml = '';
        if (q.type === 'SINGLE_CHOICE' && Array.isArray(q.options) && q.options.length > 0) {
          const formattedOptions = q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const text = typeof opt === 'object' ? opt.text : opt;
            return { letter, text };
          });

          // Check if any option is long
          const isLong = formattedOptions.some(o => (o.text || '').length > 40);

          if (isLong) {
            optionsHtml = `
              <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 10px; font-size: 12pt;">
                ${formattedOptions.map(o => `
                  <tr>
                    <td style="padding: 3px 0; vertical-align: top;"><b>${o.letter}.</b> ${o.text}</td>
                  </tr>
                `).join('')}
              </table>
            `;
          } else {
            // 2 columns layout
            optionsHtml = `
              <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 10px; font-size: 12pt;">
                <tr>
                  <td style="width: 50%; padding: 3px 0; vertical-align: top;"><b>A.</b> ${formattedOptions[0]?.text || ''}</td>
                  <td style="width: 50%; padding: 3px 0; vertical-align: top;"><b>B.</b> ${formattedOptions[1]?.text || ''}</td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 3px 0; vertical-align: top;"><b>C.</b> ${formattedOptions[2]?.text || ''}</td>
                  <td style="width: 50%; padding: 3px 0; vertical-align: top;"><b>D.</b> ${formattedOptions[3]?.text || ''}</td>
                </tr>
              </table>
            `;
          }
        } else if (q.type === 'ESSAY') {
          optionsHtml = `
            <div style="margin-top: 10px; margin-bottom: 16px; font-style: italic; color: #555;">
              (Học sinh làm phần tự luận vào giấy thi)
            </div>
          `;
        }

        const imageHtml = q.imageUrl ? `
          <div style="margin: 8px 0; text-align: center;">
            <img src="${q.imageUrl}" style="max-width: 420px; max-height: 280px; object-fit: contain; border: 1px solid #ccc;" alt="" />
          </div>
        ` : '';

        questionsHtml += `
          <div style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 14px; line-height: 1.4;">
            <div style="margin-bottom: 4px;">
              <b>Câu ${idx + 1} (${q.points || 1} điểm):</b> ${q.content}
            </div>
            ${imageHtml}
            ${optionsHtml}
          </div>
        `;
      });
    }

    // 4. Answers section HTML
    let answersHtml = '';
    if (exportMode === 'all' || exportMode === 'answers') {
      const pageBreak = exportMode === 'all' ? '<div style="page-break-before: always;"></div>' : '';

      // MCQ Answer Key Table (Grid table)
      let mcqTableHtml = '';
      if (mcqQuestions.length > 0) {
        // Create rows of 5 pairs: [Câu, Đáp án] * 5
        const numCols = 5;
        let rowsHtml = '';
        for (let i = 0; i < mcqQuestions.length; i += numCols) {
          let cellsHtml = '';
          for (let j = 0; j < numCols; j++) {
            const qObj = mcqQuestions[i + j];
            if (qObj) {
              const qIndex = questions.indexOf(qObj) + 1;
              // correctAnswer can be ['A'] or 'A' or index
              let ansLetter = '';
              if (Array.isArray(qObj.correctAnswer) && qObj.correctAnswer.length > 0) {
                ansLetter = qObj.correctAnswer[0];
              } else if (typeof qObj.correctAnswer === 'string') {
                ansLetter = qObj.correctAnswer;
              }
              cellsHtml += `
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${qIndex}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; color: #b91c1c; font-weight: bold;">${ansLetter || '-'}</td>
              `;
            } else {
              cellsHtml += `
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
              `;
            }
          }
          rowsHtml += `<tr>${cellsHtml}</tr>`;
        }

        mcqTableHtml = `
          <div style="font-family: 'Times New Roman', serif; margin-bottom: 24px;">
            <h3 style="font-size: 13pt; margin-bottom: 10px; text-transform: uppercase;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11pt; border: 1.5px solid #000;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  ${[1, 2, 3, 4, 5].map(() => `
                    <th style="border: 1px solid #000; padding: 6px;">Câu</th>
                    <th style="border: 1px solid #000; padding: 6px;">Đáp án</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }

      // Essay / Detailed Explanations Table
      let detailedTableHtml = '';
      if (questions.length > 0) {
        const rows = questions.map((q, idx) => {
          let ansText = '';
          if (q.type === 'SINGLE_CHOICE') {
            const ansLetter = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
            ansText = `<b>Đáp án đúng: ${ansLetter || '-'}</b>`;
            if (q.explanation) ansText += `<div style="margin-top: 4px; font-weight: normal;"><i>Giải thích:</i> ${q.explanation}</div>`;
          } else {
            ansText = q.explanation || 'Hướng dẫn chấm theo thang điểm tự luận của bộ môn.';
          }

          return `
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; vertical-align: top;">Câu ${idx + 1}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: top;">${q.points || 1} đ</td>
              <td style="border: 1px solid #000; padding: 8px; vertical-align: top; line-height: 1.4;">${ansText}</td>
            </tr>
          `;
        }).join('');

        detailedTableHtml = `
          <div style="font-family: 'Times New Roman', serif; margin-bottom: 24px;">
            <h3 style="font-size: 13pt; margin-bottom: 10px; text-transform: uppercase;">II. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT TỪNG CÂU</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11pt; border: 1.5px solid #000;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #000; padding: 8px; width: 12%;">Câu</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 12%;">Điểm</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 76%;">Đáp án / Hướng dẫn chấm / Lời giải chi tiết</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }

      answersHtml = `
        ${pageBreak}
        <div style="font-family: 'Times New Roman', serif; text-align: center; font-weight: bold; font-size: 14pt; margin-top: 20px; margin-bottom: 16px; text-transform: uppercase;">
          ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM - MÃ ĐỀ: ${headerState.examCode}
        </div>
        ${mcqTableHtml}
        ${detailedTableHtml}
      `;
    }

    return `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${exam.title || 'Đề thi'}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            color: #000;
            background: #fff;
            line-height: 1.35;
            margin: 0;
            padding: 20px;
          }
          table { border-collapse: collapse; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${headerHtml}
        ${(exportMode === 'all' || exportMode === 'questions') ? candidateInfoHtml : ''}
        ${questionsHtml}
        ${answersHtml}
      </body>
      </html>
    `;
  };

  // Export to Word (.doc)
  const handleExportWord = () => {
    const html = generateExamHtml();
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title || 'De_Thi'}_Ma${headerState.examCode}_${exportMode}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to PDF / Print
  const handleExportPDF = () => {
    const html = generateExamHtml();
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      alert('Vui lòng cho phép popup để in/lưu PDF');
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    // Trigger print automatically after load
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  return (
    <div className="modal-overlay">
      <div className="export-modal-container glass-card">
        {/* Modal Header */}
        <div className="export-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>📑</span>
            <div>
              <h2 className="export-modal-title">Xuất Đề Thi & Đáp Án Chuẩn Định Dạng</h2>
              <p className="export-modal-subtitle">Xuất file Word (.doc) hoặc PDF theo chuẩn cấu trúc đề thi kết thúc học phần</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Đóng">✕</button>
        </div>

        {/* Modal Body: Left Controls, Right Preview */}
        <div className="export-modal-body">
          {/* Controls Panel */}
          <div className="export-controls">
            <div className="control-section">
              <label className="control-label">1. CHỌN NỘI DUNG XUẤT</label>
              <div className="mode-toggle-group">
                <button 
                  type="button"
                  className={`mode-btn ${exportMode === 'all' ? 'active' : ''}`}
                  onClick={() => setExportMode('all')}
                >
                  📑 Đề thi + Đáp án
                </button>
                <button 
                  type="button"
                  className={`mode-btn ${exportMode === 'questions' ? 'active' : ''}`}
                  onClick={() => setExportMode('questions')}
                >
                  📝 Chỉ Đề bài
                </button>
                <button 
                  type="button"
                  className={`mode-btn ${exportMode === 'answers' ? 'active' : ''}`}
                  onClick={() => setExportMode('answers')}
                >
                  🎯 Chỉ Đáp án
                </button>
              </div>
            </div>

            <div className="control-section">
              <label className="control-label">2. TÙY CHỈNH HEADER ĐỀ THI</label>
              
              <div className="form-row-2">
                <div className="form-group-mini">
                  <span>Tên Trường</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.schoolName}
                    onChange={e => handleChange('schoolName', e.target.value)}
                  />
                </div>
                <div className="form-group-mini">
                  <span>Tên Khoa/Tổ</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.department}
                    onChange={e => handleChange('department', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-mini">
                  <span>Tên kỳ thi</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.examTitle}
                    onChange={e => handleChange('examTitle', e.target.value)}
                  />
                </div>
                <div className="form-group-mini">
                  <span>Học kỳ / Năm học</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.semesterYear}
                    onChange={e => handleChange('semesterYear', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-mini">
                  <span>Tên Môn học</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                  />
                </div>
                <div className="form-group-mini">
                  <span>Hình thức thi</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.examType}
                    onChange={e => handleChange('examType', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group-mini">
                  <span>Đề thi số</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.examNo}
                    onChange={e => handleChange('examNo', e.target.value)}
                  />
                </div>
                <div className="form-group-mini">
                  <span>Mã đề thi</span>
                  <input 
                    type="text" 
                    className="input-mini" 
                    value={headerState.examCode}
                    onChange={e => handleChange('examCode', e.target.value)}
                  />
                </div>
                <div className="form-group-mini">
                  <span>Thời gian (phút)</span>
                  <input 
                    type="number" 
                    className="input-mini" 
                    value={headerState.timeLimit}
                    onChange={e => handleChange('timeLimit', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-mini" style={{ marginTop: 8 }}>
                <span>Ghi chú tài liệu</span>
                <input 
                  type="text" 
                  className="input-mini" 
                  value={headerState.note}
                  onChange={e => handleChange('note', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Live Preview Paper */}
          <div className="export-preview-panel">
            <div className="preview-toolbar">
              <span>👁️ Xem trước giao diện Đề thi</span>
              <span className="preview-badge">Chuẩn A4 - Times New Roman</span>
            </div>
            <div className="paper-container">
              <iframe 
                title="Exam Preview"
                srcDoc={generateExamHtml()}
                className="paper-iframe"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="export-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-primary" onClick={handleExportWord} style={{ background: '#2563eb' }}>
              📄 Tải file Word (.doc)
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportPDF} style={{ background: '#dc2626' }}>
              🖨️ In / Lưu PDF (.pdf)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
