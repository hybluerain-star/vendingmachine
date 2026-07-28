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
      error: 'API 키가 설정되지 않았습니다. api/generate.js 파일 내부의 apiKey 변수에 실제 키를 넣어주세요.' 
    });
  }

  // 💡 픽앤뽑 전용 브랜드 톤앤매너 및 일관성 있는 재고 출력 가이드
  const prompt = `사용자가 선택한 자판기: "${vendingName}" (위도: ${lat}, 경도: ${lng})
너는 스마트 자판기 브랜드 '픽앤뽑(Pick & Pop)'의 실시간 재고 안내 AI야.

[응답 작성 지침]
- 위도(${lat})와 경도(${lng}) 좌표값을 바탕으로 항상 일관되고 자연스러운 재고 상태를 만들어줘.
- 실제 자판기처럼 다양한 인기 음료(콜라, 사이다, 이온음료, 캔커피, 차 종류 등 6~8종)와 간식(초코바, 과자, 젤리 등 2~3종)으로 풍부하게 구성해줘.
- 품절(0개) 항목은 가급적 최소화(0~1개 수준)하여 실제 작동 중인 자판기 느낌을 줘.
- 시원한 하늘색 디자인 테마와 잘 어울리는 깔끔한 HTML 스타일로 구성해줘.
- 상태 표시: 🟢 여유 (5개 이상), 🟡 부족 (1~2개), 🔴 품절 (0개)
- 마지막 줄에는 "픽앤뽑을 이용해 주셔서 감사합니다!" 형태의 친절한 인삿말 1줄을 추가해줘.
- 마크다운 블록(\`\`\`html 등)은 절대 사용하지 말고 순수 HTML 코드만 반환해줘.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
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
