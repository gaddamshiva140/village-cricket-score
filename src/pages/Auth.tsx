import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success('Account created! Check your email to confirm, or sign in if auto-confirm is enabled.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">🏏</div>
          <CardTitle className="text-2xl font-black">Village Cricket Pro</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 text-base"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 text-base"
              minLength={6}
              required
            />
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl">
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
