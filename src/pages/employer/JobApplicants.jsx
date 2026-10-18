import React from "react";
import { useParams } from "react-router-dom";
import ApplicantTracker from "../../components/employer/ApplicantTracker";

const JobApplicants = () => {
  const { jobId } = useParams();
  return <ApplicantTracker jobId={jobId} />;
};

export default JobApplicants;
