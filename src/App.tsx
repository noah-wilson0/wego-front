import './index.css'
import React from "react";
import { Routes, Route } from 'react-router-dom'
import TravelTime from './travel_plan/travel_plan_time'
import TravelDate from './travel_plan/travel_plan_date'

const TravelPlanTimeStep: React.FC = () => {
  return (
    <Routes>
    <Route path="/" element={<TravelDate />} />
    <Route path="/jeju" element={<TravelTime />} />
    {/* 추가 라우트들 */}
  </Routes>
  );
};

export default TravelPlanTimeStep;

