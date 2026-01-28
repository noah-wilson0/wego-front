import './index.css'
import React from "react";
import { Routes, Route } from 'react-router-dom'

import RequireAuth from './auth/RequireAuth';   // ✅ 수정: useAuth → RequireAuth import

import TravelTime from './travel_plan/travel_plan_time'
import TravelDate from './travel_plan/travel_plan_date'
import Selector from './travel_plan/Travel_Plan_Type_Selector'
import TravelPlace from './travel_plan/travel_plan_place'
import TravelAccommodation from'./travel_plan/travel_plan_accommodation'
import TravelRoute from './travel_plan/travel_plan_route'
import TravelCheck from './travel_plan/travel_plan_check'
import AiEditPage from './travl_plan_edit/ai_edit' 
import EditTravelPlan from './travl_plan_edit/EditTravelPlan'
import EditTravelPlanPlaceAddr from './travl_plan_edit/EditTravelPlanPlaceAdd'

import Login from './member/login'

import Main from './main/mainPage'
import Feed from './main/MainFeed'
import MainTravelAreasPage from './main/MainTravelAreasPage'

import TravelFeedDetail from "./feed/TravelFeedDetail";
import FeedCreatePage from "./feed/FeedCreatePage";

import MyPageMain from './myPage/MyPageMain'
import MyPageChemi from './myPage/MyPageChemi'
import MyPageReview from './myPage/MyPageReview'
import MypageItinerary from './myPage/MypageItinerary'

import ProfileSwitcher from './myPage/ProfileSwitcher'

import ChemiMain from './chemi/ChemiMain'
import ChemiQuiz from './chemi/ChemiQuiz'


const TravelPlanTimeStep: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Main/>} />
      <Route path="/feed" element={<Feed/>} />
      <Route path="/areas" element={<MainTravelAreasPage/>} />

      <Route path="/feed/:id" element={<TravelFeedDetail />} />

      {/* ✅ 보호: 피드 작성은 로그인 필요 */}
      <Route
        path="/feed/:id/new"
        element={
          <RequireAuth>
            <FeedCreatePage />
          </RequireAuth>
        }
      />
      
      <Route path="/date" element={<TravelDate />} />
      <Route path="/time" element={<TravelTime />} />
      <Route path="/select" element={<Selector/>} />
      <Route path="/place" element={<TravelPlace/>} />
      <Route path="/accommodation" element={<TravelAccommodation/>} />
      <Route path="/route" element={<TravelRoute/>} />
      <Route path="/check" element={<TravelCheck />} />           {/* 생성 모드 */}
      <Route path="/check/:travelPlanId" element={<TravelCheck />} />   {/* 수정 모드 */}
      <Route path="/check/t/:token" element={<TravelCheck />} />   {/* 동행자 수정 모드 */}

      <Route path="/ai-edit" element={<AiEditPage />} />

      <Route path="/edit-travel-plan" element={<EditTravelPlan />} />
      <Route path="/edit-travel-plan-place-add" element={<EditTravelPlanPlaceAddr />} />
      

      <Route path="/login" element={<Login/>} />

      {/* ✅ 보호: 마이페이지 관련 경로는 전부 로그인 필요 */}
      <Route
        path="/mypage"
        element={
          <RequireAuth>
            <MyPageMain/>
          </RequireAuth>
        }
      />
      <Route
        path="/mypage/chemi"
        element={
          <RequireAuth>
            <MyPageChemi/>
          </RequireAuth>
        }
      />
      <Route
        path="/mypage/feed"
        element={
          <RequireAuth>
            <MyPageReview/>
          </RequireAuth>
        }
      />
      <Route
        path="/mypage/itinerary"
        element={
          <RequireAuth>
            <MypageItinerary/>
          </RequireAuth>
        }
      />

      <Route
        path="/mypage/profile"
        element={
          <RequireAuth>
            <ProfileSwitcher/>
          </RequireAuth>
        }
      />

      <Route path="/chemi/test" element={<ChemiMain/>} />
      <Route path="/chemi/quiz" element={<ChemiQuiz/>} />
  
    {/* 추가 라우트들 */}
  </Routes>
  );
};

export default TravelPlanTimeStep;
