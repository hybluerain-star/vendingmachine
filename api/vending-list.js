export default async function handler(req, res) {
  // 환경 변수에서 공공데이터포털 API Key 참조
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  // API 키가 설정되어 있지 않으면 기본 샘플 데이터를 반환 (안전 처리)
  if (!apiKey || apiKey === "YOUR_DATA_GO_KR_API_KEY_HERE") {
    return res.status(200).json({
      source: "mock",
      message: "DATA_GO_KR_API_KEY 환경 변수가 설정되지 않아 샘플 데이터를 제공합니다.",
      data: getMockVendingMachines()
    });
  }

  try {
    const pageNo = req.query.pageNo || 1;
    const numOfRows = req.query.numOfRows || 30;

    // 행정안전부_식품_식품자동판매기업 조회서비스 Open API Endpoint
    const serviceUrl = `http://apis.data.go.kr/1741000/food_vending_machines/getfood_vending_machines`;
    const requestUrl = `${serviceUrl}?serviceKey=${encodeURIComponent(apiKey)}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`;

    const response = await fetch(requestUrl);
    
    if (!response.ok) {
      throw new Error(`공공데이터 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    const items = data?.response?.body?.items?.item || [];

    // 공공데이터 결과를 앱 규격으로 정제
    const vendingList = items.map((item, idx) => ({
      id: item.mgtNo || `data_go_${idx}`,
      name: item.bplcNm ? `픽앤뽑 (${item.bplcNm})` : `픽앤뽑 자판기 #${idx + 1}`,
      address: item.rdnWhlAddr || item.siteWhlAddr || "주소 정보 없음",
      status: item.trdStateNm || "영업중",
      lat: item.lat ? parseFloat(item.lat) : 37.4449 + (Math.random() - 0.02) * 0.04,
      lng: item.lng ? parseFloat(item.lng) : 127.1388 + (Math.random() - 0.02) * 0.04,
    }));

    return res.status(200).json({
      source: "api",
      totalCount: data?.response?.body?.totalCount || vendingList.length,
      data: vendingList
    });

  } catch (error) {
    console.error("공공데이터 API 연동 중 오류:", error);
    return res.status(200).json({
      source: "mock_fallback",
      message: "API 연동 중 오류가 발생하여 샘플 데이터로 대체되었습니다.",
      error: error.message,
      data: getMockVendingMachines()
    });
  }
}

function getMockVendingMachines() {
  return [
    { id: 1, name: "픽앤뽑 성남 모란역점", address: "경기도 성남시 중원구 성남대로 1137", lat: 37.4323, lng: 127.1292 },
    { id: 2, name: "픽앤뽑 성남 야탑광장점", address: "경기도 성남시 분당구 야탑로81번길 10", lat: 37.4114, lng: 127.1287 },
    { id: 3, name: "픽앤뽑 판교 테크노밸리점", address: "경기도 성남시 분당구 판교역로 235", lat: 37.4021, lng: 127.1086 },
    { id: 4, name: "픽앤뽑 성남시청점", address: "경기도 성남시 중원구 성남대로 997", lat: 37.4200, lng: 127.1266 },
    { id: 101, name: "픽앤뽑 서울역점", address: "서울특별시 용산구 한강대로 405", lat: 37.5555, lng: 126.9710 },
    { id: 102, name: "픽앤뽑 강남역점", address: "서울특별시 강남구 강남대로 396", lat: 37.4981, lng: 127.0276 },
    { id: 103, name: "픽앤뽑 홍대입구점", address: "서울특별시 마포구 양화로 160", lat: 37.5568, lng: 126.9238 },
    { id: 201, name: "픽앤뽑 부산 서면점", address: "부산광역시 부산진구 중앙대로 730", lat: 35.1578, lng: 129.0592 },
    { id: 301, name: "픽앤뽑 대구 동성로점", address: "대구광역시 중구 동성로 28", lat: 35.8694, lng: 128.5942 },
    { id: 401, name: "픽앤뽑 인천 부평역점", address: "인천광역시 부평구 광장로 16", lat: 37.4895, lng: 126.7233 },
    { id: 501, name: "픽앤뽑 광주 유스퀘어점", address: "광주광역시 서구 무진대로 904", lat: 35.1602, lng: 126.8794 },
    { id: 601, name: "픽앤뽑 대전역점", address: "대전광역시 동구 중앙로 215", lat: 36.3315, lng: 127.4332 },
    { id: 701, name: "픽앤뽑 제주공항점", address: "제주특별자치도 제주시 공항로 2", lat: 33.5066, lng: 126.4929 }
  ];
}
