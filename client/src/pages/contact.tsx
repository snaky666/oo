import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { Mail, Phone, MapPin, Clock, Globe, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">تواصل معنا</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نحن هنا لمساعدتك. استخدم أحد طرق التواصل التالية للتواصل معنا
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Email */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <Mail className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">البريد الإلكتروني</h3>
                <p className="text-muted-foreground mb-4">
                  تواصل معنا عبر البريد الإلكتروني وسنرد عليك في أقرب وقت ممكن.
                </p>
                <a href="mailto:info@odhiyati.com" className="text-primary font-bold text-lg hover:underline">
                  info@odhiyati.com
                </a>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <Phone className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">الهاتف</h3>
                <p className="text-muted-foreground mb-4">
                  اتصل بنا مباشرة للحصول على الدعم الفوري والمساعدة المباشرة.
                </p>
                <a href="tel:+213123456789" className="text-primary font-bold text-lg hover:underline">
                  +213 (0) 123 456 789
                </a>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <MessageCircle className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">WhatsApp</h3>
                <p className="text-muted-foreground mb-4">
                  تواصل معنا عبر WhatsApp للمحادثة الفورية والرد السريع.
                </p>
                <a href="https://wa.me/213123456789" target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-lg hover:underline">
                  +213 (0) 123 456 789
                </a>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <MapPin className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">المقر الرئيسي</h3>
                <p className="text-muted-foreground mb-4">
                  يمكنك زيارتنا في مقرنا الرئيسي للتعامل المباشر معنا.
                </p>
                <p className="text-primary font-bold text-lg">
                  الجزائر، الجزائر العاصمة
                </p>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <Clock className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">ساعات العمل</h3>
                <p className="text-muted-foreground mb-4">
                  فريقنا متاح على مدار السنة لمساعدتك في أي وقت.
                </p>
                <p className="text-primary font-bold text-lg">
                  24/7 متاح دائماً
                </p>
              </CardContent>
            </Card>

            {/* Website */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <Globe className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">الموقع الإلكتروني</h3>
                <p className="text-muted-foreground mb-4">
                  زر موقعنا الإلكتروني للحصول على مزيد من المعلومات والمساعدة.
                </p>
                <a href="https://odhiyati.com" target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-lg hover:underline">
                  odhiyati.com
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card */}
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">الدعم الفني</h3>
                <p className="text-muted-foreground">
                  فريقنا الفني مختص وجاهز للرد على جميع استفساراتك واستشاراتك المتعلقة بالمنصة.
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">الرد السريع</h3>
                <p className="text-muted-foreground">
                  نعمل على رد جميع الاستفسارات في غضون 24 ساعة، ومعظمها يتم الرد عليه في أقل من ساعات معدودة.
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">التواصل المباشر</h3>
                <p className="text-muted-foreground">
                  يمكنك استخدام أي من الطرق المذكورة أعلاه للتواصل المباشر معنا بدون وسيط.
                </p>
              </div>
            </CardContent>
          </Card>
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
