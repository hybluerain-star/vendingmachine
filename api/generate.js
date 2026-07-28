export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  const { location } = req.body;

  if (!location) {
    return res.status(400).json({ error: '위치 정보가 필요합니다.' });
  }

  // 1순위: Vercel 환경변수 (GEMINI_API_KEY)
  // 2순위: 코드 직접 입력 키 (필요시 "YOUR_GEMINI_API_KEY_HERE" 부분에 직접 입력)
  const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY 환경변수가 설정되지 않았거나 올바른 API 키가 작성되지 않았습니다.' 
    });
  }

  const prompt = `사용자가 입력한 위치: "${location}"
너는 위 장소 근처 자판기의 가상 재고 현황을 안내해주는 AI 서비스야.
해당 위치에 어울리는 자판기 간식(음료 및 과자 종류) 4~5개를 임의로 설정하고, 각각의 현재 예상 재고 수량과 상태(여유/부족/품절)를 보기 좋게 정리해서 한국어로 답변해줘.`;

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
