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
      error: 'GEMINI_API_KEY 환경변수가 설정되지 않았거나 올바른 API 키가 작성되지 않았습니다.' 
    });
  }

  const prompt = `사용자가 지도에서 선택한 자판기 이름: "${vendingName}" (위도: ${lat}, 경도: ${lng})
너는 위 자판기의 실시간 재고 현황을 안내해주는 AI 가상 관리 시스템이야.

[응답 작성 지침]
- HTML 태그를 사용하여 한눈에 깔끔하게 볼 수 있도록 정리해줘.
- 음료 섹션과 간식(스낵) 섹션으로 나누어 항목별(이름, 수량, 상태 표시)로 표(HTML <table>)나 깔끔한 리스트(<ul>/<li>) 형태로 정돈해줘.
- 상태 표시 예시: 🟢 여유 (5개 이상), 🟡 부족 (1~2개), 🔴 품절 (0개)
- 마지막에 간단한 자판기 관리 상태 메시지 1줄을 추가해줘.
- 마크다운 블록(\`\`\`html 등)은 출력하지 말고 순수 HTML 태그 내용만 반환해줘.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
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
    let resultText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '결과를 불러올 수 없습니다.';

    // 백틱 코드블록 감싸진 부분 제거 처리
    resultText = resultText.replace(/```html/g, '').replace(/```/g, '').trim();

    return res.status(200).json({ result: resultText });
  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
