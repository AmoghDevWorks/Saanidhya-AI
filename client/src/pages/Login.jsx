import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export const Login = () => {
  return (
    <AuthLayout
      headline="A little care, every day."
      subheading="Sign in to connect with Saanidhya AI's daily wellness check-ins, medication logs, and family care circle."
      activeTab="login"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
