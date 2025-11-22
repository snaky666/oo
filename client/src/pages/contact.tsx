import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "تم استلام رسالتك",
        description: "شكراً لتواصلك معنا. سنرد عليك قريباً.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">تواصل معنا</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نحن هنا لمساعدتك. لا تتردد في الاتصال بنا في أي وقت
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* Email */}
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">البريد الإلكتروني</h3>
                <p className="text-sm text-muted-foreground">info@odhiyati.com</p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">الهاتف</h3>
                <p className="text-sm text-muted-foreground">+213 (0) 123 456 789</p>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">المقر الرئيسي</h3>
                <p className="text-sm text-muted-foreground">الجزائر، الجزائر العاصمة</p>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">ساعات العمل</h3>
                <p className="text-sm text-muted-foreground">24/7 متاح</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>أرسل لنا رسالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="أدخل اسمك الكامل"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="0X XX XX XX XX"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject">الموضوع</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="موضوع الرسالة"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message">الرسالة</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="اكتب رسالتك هنا..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات التواصل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">البريد الإلكتروني</h3>
                    <p className="text-muted-foreground">
                      يمكنك التواصل معنا عبر البريد الإلكتروني في أي وقت. سنرد على استفساراتك في أقرب وقت.
                    </p>
                    <p className="text-primary font-semibold mt-2">info@odhiyati.com</p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-2">الهاتف</h3>
                    <p className="text-muted-foreground">
                      اتصل بنا مباشرة للحصول على المساعدة الفورية.
                    </p>
                    <p className="text-primary font-semibold mt-2">+213 (0) 123 456 789</p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-2">ساعات العمل</h3>
                    <p className="text-muted-foreground">
                      فريقنا متاح 24/7 لمساعدتك في أي وقت وحل جميع استفساراتك ومشاكلك.
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-2">المقر الرئيسي</h3>
                    <p className="text-muted-foreground">
                      الجزائر، الجزائر العاصمة
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle>الأسئلة الشائعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">كم وقت الرد على الاستفسارات؟</h4>
                    <p className="text-sm text-muted-foreground">
                      نرد على جميع الاستفسارات في غضون 24 ساعة كحد أقصى.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">هل يمكنني التواصل معكم في عطلة نهاية الأسبوع؟</h4>
                    <p className="text-sm text-muted-foreground">
                      نعم، فريقنا متاح طوال الأسبوع بما في ذلك عطلة نهاية الأسبوع.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">ما هي أفضل طريقة للتواصل؟</h4>
                    <p className="text-sm text-muted-foreground">
                      يمكنك التواصل عبر البريد الإلكتروني أو الهاتف أو نموذج التواصل على الموقع.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 أضحيتي. جميع الحقوق محفوظة.</p>
            <p className="mt-2">Developed by <span className="font-semibold text-foreground">NovaWeb</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
