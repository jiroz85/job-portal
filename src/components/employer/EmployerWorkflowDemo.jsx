import React, { useState } from "react";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiArrowRight,
  FiEye,
  FiMessageSquare,
  FiClock,
  FiStar,
} from "react-icons/fi";

const EmployerWorkflowDemo = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const workflowSteps = [
    {
      step: 1,
      title: "Job Seeker Applies",
      description: "Application received and appears in dashboard",
      icon: FiUser,
      color: "bg-blue-500",
    },
    {
      step: 2,
      title: "Review Application",
      description: "Employer views applicant profile and details",
      icon: FiEye,
      color: "bg-purple-500",
    },
    {
      step: 3,
      title: "Send Message",
      description: "Employer sends acknowledgment message",
      icon: FiMail,
      color: "bg-emerald-500",
    },
    {
      step: 4,
      title: "Mark Under Review",
      description: "Application status changes to 'Under Review'",
      icon: FiClock,
      color: "bg-amber-500",
    },
    {
      step: 5,
      title: "Schedule Interview",
      description: "Employer sets up screening interview",
      icon: FiCalendar,
      color: "bg-indigo-500",
    },
    {
      step: 6,
      title: "Candidate Notified",
      description: "Applicant receives status update",
      icon: FiMessageSquare,
      color: "bg-pink-500",
    },
    {
      step: 7,
      title: "Hiring Decision",
      description: "Extend offer or close application",
      icon: FiCheckCircle,
      color: "bg-teal-500",
    },
  ];

  const handleNextStep = () => {
    if (currentStep < workflowSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-6 rounded-2xl mb-4">
              <FiUser className="w-14 h-14 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                New Application Received
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                A candidate submits an application with an attached resume.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-left space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Timestamp: Real-time via WebSocket / Polling</p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Status: Pending Review</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 p-6 rounded-2xl mb-4">
              <FiEye className="w-14 h-14 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Review Candidate Profile & Resume
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Inspect candidate contact info, cover note, and verified PDF resume.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-left">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Resume:</p>
                    <p className="text-gray-600 dark:text-gray-400">Direct binary download</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Authorization:</p>
                    <p className="text-gray-600 dark:text-gray-400">Job employer check</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 p-6 rounded-2xl mb-4">
              <FiMail className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Internal Notes & Communication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Log recruiter notes and screening feedback stored securely with the application.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                  "Candidate demonstrates strong technical background; proceed to initial screening."
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 p-6 rounded-2xl mb-4">
              <FiClock className="w-14 h-14 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Advance to Under Review
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Update status via PUT /api/applications/:id/status
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">pending</span>
                <FiArrowRight className="text-gray-400" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">under_review</span>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 p-6 rounded-2xl mb-4">
              <FiCalendar className="w-14 h-14 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Interview Scheduling
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Transition to interview_scheduled with meeting details logged in notes.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-left text-xs space-y-1">
                <p className="font-semibold text-gray-700 dark:text-gray-300">Stage: Technical & Culture Fit</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">Status: interview_scheduled</p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center">
            <div className="bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 p-6 rounded-2xl mb-4">
              <FiMessageSquare className="w-14 h-14 text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Candidate Pipeline Visibility
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                The candidate's dashboard reflects the updated pipeline stage immediately.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-left text-xs space-y-1">
                <p className="text-gray-600 dark:text-gray-300">✓ Timeline updated</p>
                <p className="text-gray-600 dark:text-gray-300">✓ Real-time status badge sync</p>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="text-center">
            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 p-6 rounded-2xl mb-4">
              <FiCheckCircle className="w-14 h-14 text-teal-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Final Decision & Offer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Advance candidate to offered / accepted or gracefully mark as rejected.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-left text-xs space-y-1">
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Valid final statuses: accepted, rejected, withdrawn</p>
                <p className="text-gray-500 dark:text-gray-400">All transitions recorded in backend database</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* Progress Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {workflowSteps.map((step, index) => (
            <div key={step.step} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setCurrentStep(step.step)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  step.step === currentStep
                    ? `${step.color} text-white shadow-md ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900`
                    : step.step < currentStep
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                }`}
                title={step.title}
              >
                <step.icon className="w-4 h-4" />
              </button>
              {index < workflowSteps.length - 1 && (
                <div
                  className={`w-6 sm:w-10 h-0.5 mx-1 transition-colors ${
                    step.step < currentStep
                      ? "bg-blue-500"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 px-1">
          <span>Apply</span>
          <span>Review</span>
          <span>Interview</span>
          <span>Offer</span>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-6">{renderStepContent()}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
            currentStep === 1
              ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          Previous
        </button>

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Step {currentStep} of {workflowSteps.length}
        </span>

        <button
          type="button"
          onClick={handleNextStep}
          disabled={currentStep === workflowSteps.length}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
            currentStep === workflowSteps.length
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          }`}
        >
          {currentStep === workflowSteps.length ? "Done" : "Next Step"}
        </button>
      </div>
    </div>
  );
};

export default EmployerWorkflowDemo;
