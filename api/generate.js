export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  const { vendingName, lat, lng } = req.body;
  if (!vendingName) {
    return res.status(400).json({ error: '자판기 정보가 필요합니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return res.status(500).json({ 
      error: 'API 키가 설정되지 않았습니다. api/generate.js 파일 내부의 apiKey 변수에 실제 키를 넣거나 Vercel 환경변수를 설정해 주세요.' 
    });
  }

  // 💡 자판기 위치 좌표에 따라 고정된 시드 느낌의 재고 목록을 생성하도록 지침 부여
  const prompt = `사용자가 선택한 전국 자판기: "${vendingName}" (위도: ${lat}, 경도: ${lng})
너는 이 자판기의 가상 관리 AI 시스템이야.

[응답 작성 지침]
- 위도(${lat})와 경도(${lng}) 좌표값을 고려하여 항상 거의 일관된 음료 및 스낵 재고 현황을 출력해줘.
- HTML 태그를 사용하여 깔끔하게 정리해줘.
- 음료 섹션과 간식(스낵) 섹션으로 나눠 표(<table>)나 리스트(<ul>/<li>) 형태 표현.
- 상태 표시: 🟢 여유 (5개 이상), 🟡 부족 (1~2개), 🔴 품절 (0개)
- 마지막에 자판기 관리 상태 메시지 1줄 추가.
- 마크다운 블록(\`\`\`html 등)은 제거하고 순수 HTML만 반환.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.',
      });
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '결과를 불러올 수 없습니다.';
    resultText = resultText.replace(/```html/g, '').replace(/```/g, '').trim();

    return res.status(200).json({ result: resultText });
  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
