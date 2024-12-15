import { AuthForm } from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};

export default Auth;