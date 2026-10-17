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
      title: "Employer Reviews Application",
      description: "Employer views applicant profile and details",
      icon: FiEye,
      color: "bg-purple-500",
    },
    {
      step: 3,
      title: "Send Message",
      description: "Employer sends acknowledgment message",
      icon: FiMail,
      color: "bg-green-500",
    },
    {
      step: 4,
      title: "Mark as Under Review",
      description: "Application status changes to 'Under Review'",
      icon: FiClock,
      color: "bg-yellow-500",
    },
    {
      step: 5,
      title: "Schedule Interview",
      description: "Employer schedules phone screening",
      icon: FiCalendar,
      color: "bg-indigo-500",
    },
    {
      step: 6,
      title: "Applicant Notified",
      description: "Applicant receives status update and message",
      icon: FiMessageSquare,
      color: "bg-pink-500",
    },
    {
      step: 7,
      title: "Process Continues",
      description: "Continue until hire or rejection",
      icon: FiCheckCircle,
      color: "bg-emerald-500",
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
            <div className="bg-blue-50 p-6 rounded-lg mb-4">
              <FiUser className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                New Application Received!
              </h3>
              <p className="text-gray-600 mb-4">
                John Doe has applied for your "Senior React Developer" position
              </p>
              <div className="bg-white p-4 rounded-lg text-left">
                <p className="text-sm text-gray-500">Applied: 2 minutes ago</p>
                <p className="text-sm text-gray-500">Status: Pending Review</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <div className="bg-purple-50 p-6 rounded-lg mb-4">
              <FiEye className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Reviewing Application
              </h3>
              <p className="text-gray-600 mb-4">
                You can now view John's complete profile
              </p>
              <div className="bg-white p-4 rounded-lg text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Experience:</p>
                    <p className="text-gray-600">5 years</p>
                  </div>
                  <div>
                    <p className="font-medium">Location:</p>
                    <p className="text-gray-600">New York, NY</p>
                  </div>
                  <div>
                    <p className="font-medium">Skills:</p>
                    <p className="text-gray-600">React, JavaScript, Node.js</p>
                  </div>
                  <div>
                    <p className="font-medium">Email:</p>
                    <p className="text-gray-600">john.doe@email.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="bg-green-50 p-6 rounded-lg mb-4">
              <FiMail className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Send Message</h3>
              <p className="text-gray-600 mb-4">
                Send an acknowledgment to John
              </p>
              <div className="bg-white p-4 rounded-lg">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows="4"
                  defaultValue="Hi John, thanks for applying to our Senior React Developer position. We've received your application and will review it carefully. We'll get back to you within 3-5 business days."
                  readOnly
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="bg-yellow-50 p-6 rounded-lg mb-4">
              <FiClock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Mark as Under Review
              </h3>
              <p className="text-gray-600 mb-4">Update application status</p>
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Status: Pending</span>
                  <FiArrowRight className="text-gray-400" />
                  <span className="text-sm font-medium text-blue-600">
                    Under Review
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  John will be notified of this status change
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="bg-indigo-50 p-6 rounded-lg mb-4">
              <FiCalendar className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Schedule Interview</h3>
              <p className="text-gray-600 mb-4">
                Set up a phone screening with John
              </p>
              <div className="bg-white p-4 rounded-lg text-left">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> Phone Screening
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> Tomorrow, 2:00 PM
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> Phone Call
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center">
            <div className="bg-pink-50 p-6 rounded-lg mb-4">
              <FiMessageSquare className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Applicant Notified</h3>
              <p className="text-gray-600 mb-4">John receives your updates</p>
              <div className="bg-white p-4 rounded-lg text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FiMail className="text-green-500" />
                    <span className="text-sm">Message sent successfully</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiClock className="text-blue-500" />
                    <span className="text-sm">
                      Status updated to "Under Review"
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-indigo-500" />
                    <span className="text-sm">
                      Interview scheduled for tomorrow
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="text-center">
            <div className="bg-emerald-50 p-6 rounded-lg mb-4">
              <FiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Process Continues</h3>
              <p className="text-gray-600 mb-4">Continue the hiring process</p>
              <div className="bg-white p-4 rounded-lg text-left">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FiStar className="text-yellow-500" />
                    <span className="text-sm">
                      Shortlist promising candidates
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiUser className="text-blue-500" />
                    <span className="text-sm">Conduct interviews</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiCheckCircle className="text-green-500" />
                    <span className="text-sm">Make hiring decision</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Employer Workflow Demo
        </h2>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.step <= currentStep
                      ? step.color + " text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < workflowSteps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step.step < currentStep ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {workflowSteps.map((step) => (
              <div
                key={step.step}
                className="text-xs text-gray-600 text-center w-16"
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-md ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Previous
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {workflowSteps.length}
            </p>
          </div>

          <button
            onClick={handleNextStep}
            disabled={currentStep === workflowSteps.length}
            className={`px-4 py-2 rounded-md ${
              currentStep === workflowSteps.length
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {currentStep === workflowSteps.length ? "Complete" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerWorkflowDemo;
