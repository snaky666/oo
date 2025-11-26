import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري التحقق من بريدك الإلكتروني...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('رابط التحقق غير صحيح أو مفقود');
      return;
    }

    // Here you would call Firebase to verify the email
    // For now, just show success
    setTimeout(() => {
      setStatus('success');
      setMessage('تم التحقق من بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.');
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">التحقق من البريد الإلكتروني</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader className="h-12 w-12 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-500" />
            )}
          </div>

          <p className="text-center text-lg text-gray-700">{message}</p>

          {status === 'success' && (
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full bg-amber-700 hover:bg-amber-800"
            >
              اذهب إلى صفحة التسجيل
            </Button>
          )}

          {status === 'error' && (
            <Button 
              onClick={() => setLocation('/')}
              className="w-full bg-amber-700 hover:bg-amber-800"
            >
              العودة إلى الصفحة الرئيسية
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
