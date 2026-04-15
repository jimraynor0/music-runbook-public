import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import LoginPageView from './components/LoginPageView';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      if (error instanceof Error) {
          setError(error.message || 'Failed to sign in with Google');
      } else {
          setError('An unknown error occurred: ' + error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginPageView
      loading={loading}
      error={error}
      onSignIn={signInWithGoogle}
    />
  );
}

export default LoginPage;