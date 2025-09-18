// /src\travel_plan\components\draftPlanMetaApi.ts
import axios from "axios";

const BASE_URL = "http://localhost:8080";

export interface DraftPlanMetaResponse {
    regionName: string;
    startDate: string;
    endDate: string;
  }
  
  /**
   * uuid 기반으로 여행 meta 데이터 조회
   */
  export async function getDraftPlanMeta(uuid: string): Promise<DraftPlanMetaResponse> {
    const res = await axios.get<DraftPlanMetaResponse>(`${BASE_URL}/draft-plans/${uuid}/meta`);
    return res.data;
  }