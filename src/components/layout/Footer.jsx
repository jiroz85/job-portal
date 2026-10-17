import { Link } from "react-router-dom";
import { FaBriefcase, FaShieldAlt, FaUserCheck, FaBolt } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Mission */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <FaBriefcase className="text-base" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                JobPortal
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              A transparent, production-ready recruitment hub connecting verified companies with exceptional talent.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FaShieldAlt className="text-emerald-400" /> Verified Postings
              </span>
              <span className="inline-flex items-center gap-1">
                <FaBolt className="text-blue-400" /> Fast Response
              </span>
            </div>
          </div>

          {/* Job Seekers Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              For Job Seekers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/jobs" className="hover:text-blue-400 transition-colors">
                  Browse All Jobs
                </Link>
              </li>
              <li>
                <Link to="/jobs?type=Remote" className="hover:text-blue-400 transition-colors">
                  Remote Opportunities
                </Link>
              </li>
              <li>
                <Link to="/jobs?type=Full-time" className="hover:text-blue-400 transition-colors">
                  Full-Time Positions
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-blue-400 transition-colors">
                  Candidate Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              For Employers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/employer/post-job" className="hover:text-blue-400 transition-colors">
                  Post a Position
                </Link>
              </li>
              <li>
                <Link to="/employer" className="hover:text-blue-400 transition-colors">
                  Employer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400 transition-colors">
                  Create Employer Account
                </Link>
              </li>
              <li>
                <Link to="/employer/applicants" className="hover:text-blue-400 transition-colors">
                  Applicant Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Info */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Platform & Access
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="hover:text-blue-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400 transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-blue-400 transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-500">
                Operating with direct database integration & verified role authentication.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} JobPortal. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/jobs" className="hover:text-slate-400 transition-colors">
              Jobs
            </Link>
            <Link to="/login" className="hover:text-slate-400 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-400 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
