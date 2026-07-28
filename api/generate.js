export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  const { vendingName, lat, lng } = req.body;

  if (!vendingName) {
    return res.status(400).json({ error: '자판기 정보가 필요합니다.' });
  }

  // Vercel 환경변수 우선 적용, 없으면 지정한 키 사용
  const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY 환경변수가 설정되지 않았거나 올바른 API 키가 작성되지 않았습니다.' 
    });
  }

  const prompt = `사용자가 지도에서 선택한 자판기 이름: "${vendingName}" (위도: ${lat}, 경도: ${lng})
너는 위 자판기의 실시간 재고 현황을 알려주는 AI 가상 시스템이야.
이 자판기의 특징(이름에 어울리는 스낵 및 음료 4~5종류)을 설정하고, 현재 예상 재고 수량과 상태(여유/부족/품절)를 깔끔하고 보기 좋게 정리해서 한국어로 답변해줘.`;

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
    const resultText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '결과를 불러올 수 없습니다.';

    return res.status(200).json({ result: resultText });
  } catch (error) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
