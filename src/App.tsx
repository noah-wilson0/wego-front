import './index.css'
import React from "react";
import { Routes, Route } from 'react-router-dom'
import JejuTravelBooking from './travel_plan/jeju_travel_react'
import JejuTravelDate from './travel_plan/travel_plan_date'
const TravelPlanTimeStep: React.FC = () => {
  return (
    <Routes>
    <Route path="/" element={<JejuTravelDate />} />
    <Route path="/jeju" element={<JejuTravelBooking />} />
    {/* 추가 라우트들 */}
  </Routes>
  );
};

export default TravelPlanTimeStep;

