import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

export const Signup = () => {
  return (
    <AuthLayout
      headline="Create your account"
      subheading="Get started with Saanidhya AI for natural voice check-ins, medication tracking, and family connectivity."
      activeTab="signup"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;
