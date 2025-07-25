import './index.css'
import React from "react";
import { Routes, Route } from 'react-router-dom'
import TravelTime from './travel_plan/travel_plan_time'
import TravelDate from './travel_plan/travel_plan_date'
import Selector from './travel_plan/Travel_Plan_Type_Selector'
import TravelPlace from './travel_plan/travel_plan_place'
import TravelAccommodation from'./travel_plan/travel_plan_accommodation'

const TravelPlanTimeStep: React.FC = () => {
  return (
    <Routes>
    <Route path="/" element={<TravelDate />} />
    <Route path="/seoul" element={<TravelTime />} />
    <Route path="/select" element={<Selector/>} />
    <Route path="/place" element={<TravelPlace/>} />
    <Route path="/accommodation" element={<TravelAccommodation/>} />
    {/* 추가 라우트들 */}
  </Routes>
  );
};

export default TravelPlanTimeStep;

