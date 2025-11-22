import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Link } from "wouter";
import { 
  ShieldCheck, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Star,
  TrendingUp,
  Users,
  Award
} from "lucide-react";
import heroImage from "@assets/generated_images/arabic_sheep_farm_hero.png";
import trustImage from "@assets/generated_images/trust_verification_illustration.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {/* Hero Image with Dark Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="مزرعة أغنام"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full">
            <div className="max-w-3xl text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                منصة موثوقة لبيع وشراء الأغنام
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                تواصل آمن بين البائعين والمشترين مع إشراف إداري كامل
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" data-testid="button-register-buyer">
                  <Button size="lg" className="text-lg">
                    ابدأ الشراء
                  </Button>
                </Link>
                <Link href="/register" data-testid="button-register-seller">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  >
                    ابدأ البيع
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold mb-1">1000+</p>
                <p className="text-sm text-muted-foreground">مستخدم نشط</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold mb-1">500+</p>
                <p className="text-sm text-muted-foreground">عملية بيع</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold mb-1">100%</p>
                <p className="text-sm text-muted-foreground">معاملات آمنة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold mb-1">4.8</p>
                <p className="text-sm text-muted-foreground">تقييم المستخدمين</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              كيف يعمل أضحيتي؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ثلاث خطوات بسيطة للبدء في بيع أو شراء الأغنام بأمان
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">
                <Search className="inline-block h-5 w-5 ml-2" />
                تصفح واختر
              </h3>
              <p className="text-muted-foreground">
                تصفح مئات القوائم من الأغنام المعتمدة من قبل الإدارة واختر ما يناسبك
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">
                <ShieldCheck className="inline-block h-5 w-5 ml-2" />
                مراجعة إدارية
              </h3>
              <p className="text-muted-foreground">
                جميع القوائم تمر بمراجعة دقيقة من فريق الإدارة لضمان الجودة والمصداقية
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">
                <MessageSquare className="inline-block h-5 w-5 ml-2" />
                تواصل آمن
              </h3>
              <p className="text-muted-foreground">
                قدم طلب الشراء وسيتم التواصل معك من خلال الإدارة لإتمام العملية بأمان
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">لماذا نحن؟</Badge>
              <h2 className="text-3xl md:text-4xl font-semibold mb-6">
                منصة موثوقة مع إشراف كامل
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">مراجعة شاملة</h3>
                    <p className="text-muted-foreground">
                      كل قائمة تمر بمراجعة دقيقة من فريقنا للتأكد من جودة المحتوى والمصداقية
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">معاملات آمنة</h3>
                    <p className="text-muted-foreground">
                      نحن نشرف على جميع المعاملات لضمان حقوق البائع والمشتري
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">دعم مستمر</h3>
                    <p className="text-muted-foreground">
                      فريقنا متواجد دائماً لمساعدتك في أي استفسار أو مشكلة
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={trustImage}
                alt="ثقة وأمان"
                className="max-w-md w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            جاهز للبدء؟
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            انضم الآن إلى آلاف المستخدمين الذين يثقون في أضحيتي
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" data-testid="button-cta-register">
              <Button size="lg" className="text-lg">
                إنشاء حساب مجاني
              </Button>
            </Link>
            <Link href="/browse" data-testid="button-cta-browse">
              <Button size="lg" variant="outline" className="text-lg">
                تصفح الأغنام
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">أضحيتي</h3>
              <p className="text-sm text-muted-foreground">
                منصة موثوقة لبيع وشراء الأغنام مع إشراف إداري كامل
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                    تصفح الأغنام
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                    إنشاء حساب
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    تسجيل الدخول
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">تواصل معنا</h3>
              <p className="text-sm text-muted-foreground">
                info@odhiyati.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 أضحيتي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
