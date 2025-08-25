import './index.css'
import React from "react";
import { Routes, Route } from 'react-router-dom'

import TravelTime from './travel_plan/travel_plan_time'
import TravelDate from './travel_plan/travel_plan_date'
import Selector from './travel_plan/Travel_Plan_Type_Selector'
import TravelPlace from './travel_plan/travel_plan_place'
import TravelAccommodation from'./travel_plan/travel_plan_accommodation'
import TravelRoute from './travel_plan/travel_plan_route'
import TravelCheck from './travel_plan/travel_plan_check'

import Login from './member/login'

import Main from './main/mainPage'

import MyPageMain from './main/mypage/MyPageMain'
import MyPageChemi from './main/mypage/MyPageChemi'
import MyPageReview from './main/mypage/MyPageReview'
import MypageItinerary from './main/mypage/MypageItinerary'

import ProfileSwitcher from './main/mypage/ProfileSwitcher'

import ChemiMain from './chemi/ChemiMain'
import ChemiQuiz from './chemi/ChemiQuiz'


const TravelPlanTimeStep: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Main/>} />

    <Route path="/date" element={<TravelDate />} />
    <Route path="/time" element={<TravelTime />} />
    <Route path="/select" element={<Selector/>} />
    <Route path="/place" element={<TravelPlace/>} />
    <Route path="/accommodation" element={<TravelAccommodation/>} />
    <Route path="/route" element={<TravelRoute/>} />
    <Route path="/check" element={<TravelCheck />} />           {/* 생성 모드 */}
    <Route path="/check/:travelPlanId" element={<TravelCheck />} />   {/* 수정 모드 */}

    <Route path="/login" element={<Login/>} />

    <Route path="/mypage" element={<MyPageMain/>} />
    <Route path="/mypage/chemi" element={<MyPageChemi/>} />
    <Route path="/mypage/review" element={<MyPageReview/>} />
    <Route path="/mypage/itinerary" element={<MypageItinerary/>} />

    <Route path="/mypage/profile" element={<ProfileSwitcher/>} />


    <Route path="/chemi/test" element={<ChemiMain/>} />
    <Route path="/chemi/quiz" element={<ChemiQuiz/>} />
  
    {/* 추가 라우트들 */}
  </Routes>
  );
};

export default TravelPlanTimeStep;

