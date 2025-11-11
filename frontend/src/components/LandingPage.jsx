import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleUserTypeClick = (role) => {
    navigate('/auth', { state: { role } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-blue-800">ACAD-SYNC</h1>
          <button
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to ACAD-SYNC
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Your comprehensive digital platform for an enhanced college experience at Srinivas Institute of Technology.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition transform hover:scale-105"
            >
              Let's Get Started
            </button>
          </div>
          <div className="hidden md:block">
            {/* You can add an illustration or image here */}
            <div className="bg-blue-200 h-96 rounded-xl flex items-center justify-center">
              <span className="text-blue-800 text-xl">College Illustration</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Who Can Use ACAD-SYNC?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <UserTypeCard
              title="Students"
              description="Access your courses, assignments, grades, and attendance records. Stay updated with announcements and upcoming events."
              buttonText="Student Login"
              onClick={() => handleUserTypeClick('student')}
            />
            <UserTypeCard
              title="Parents"
              description="Monitor your child's academic progress, attendance, and upcoming events. Receive important announcements directly."
              buttonText="Parent Login"
              onClick={() => handleUserTypeClick('parent')}
            />
            <UserTypeCard
              title="Teachers"
              description="Manage courses, assignments, and grades. Track student attendance and create announcements for your classes and departments."
              buttonText="Teacher Login"
              onClick={() => handleUserTypeClick('teacher')}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose ACAD-SYNC?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Digital Campus"
            description="Access all campus resources and information from one centralized platform."
          />
          <FeatureCard
            title="Smart Learning"
            description="Enhanced learning experience with digital tools and resources."
          />
          <FeatureCard
            title="Stay Connected"
            description="Keep up with campus events, notices, and updates in real-time."
          />
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">About SIT</h3>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-600 mb-6">
              Srinivas Institute of Technology (SIT) is one of Karnataka's leading technical institutions, 
              established in 1963. Our institution is committed to excellence in education, research, and innovation.
            </p>
            <p className="text-gray-600">
              With state-of-the-art facilities and experienced faculty, we prepare students for successful careers
              in engineering and technology.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 ACAD-SYNC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
      <h4 className="text-xl font-semibold text-gray-900 mb-4">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const UserTypeCard = ({ title, description, buttonText, onClick }) => {
  return (
    <div className="bg-blue-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition">
      <h4 className="text-xl font-semibold text-gray-900 mb-4">{title}</h4>
      <p className="text-gray-600 mb-6">{description}</p>
      <button
        onClick={onClick}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default LandingPage; 