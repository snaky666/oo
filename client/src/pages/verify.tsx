
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري التحقق من بريدك الإلكتروني...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const email = params.get('email');

        console.log('🔐 Starting verification...');
        console.log('Token:', token);
        console.log('Email:', email);

        if (!token || !email) {
          console.error('❌ Missing token or email');
          setStatus('error');
          setMessage('رابط التحقق غير صحيح أو مفقود');
          toast({
            title: 'خطأ',
            description: 'رابط التحقق غير صحيح',
            variant: 'destructive',
          });
          return;
        }

        console.log('📧 Sending verification request...');
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        });

        console.log('📬 Response status:', response.status);
        const result = await response.json();
        console.log('📋 Response data:', result);

        if (response.ok && result.success) {
          console.log('✅ Verification successful');
          setStatus('success');
          setMessage('تم التحقق من بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.');
          toast({
            title: 'نجح التحقق',
            description: 'تم تفعيل حسابك بنجاح',
          });
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            console.log('🔄 Redirecting to login...');
            setLocation('/login');
          }, 3000);
        } else {
          const errorMessage = result.error || 'فشل التحقق من البريد الإلكتروني';
          console.error('❌ Verification failed:', errorMessage);
          setStatus('error');
          setMessage(errorMessage);
          toast({
            title: 'فشل التحقق',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('❌ Verification error:', error);
        setStatus('error');
        setMessage('حدث خطأ أثناء التحقق من البريد');
        toast({
          title: 'خطأ',
          description: 'حدث خطأ غير متوقع',
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">
            التحقق من البريد الإلكتروني
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          <p className="text-center text-lg text-gray-700 font-medium">
            {message}
          </p>

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                سيتم توجيهك تلقائياً لصفحة تسجيل الدخول...
              </p>
              <Button 
                onClick={() => setLocation('/login')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                الذهاب لتسجيل الدخول الآن
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/register')}
                variant="outline"
                className="w-full"
              >
                العودة للتسجيل
              </Button>
              <Button 
                onClick={() => setLocation('/')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                الصفحة الرئيسية
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
