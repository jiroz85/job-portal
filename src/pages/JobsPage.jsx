import { Navigate, useLocation } from "react-router-dom";

const JobsPage = () => {
  const location = useLocation();
  // Preserve any search parameters when redirecting to home page browse section
  const searchStr = location.search ? `${location.search}` : "";
  return <Navigate to={`/${searchStr}#browse-jobs`} replace />;
};

export default JobsPage;
