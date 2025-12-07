import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-8 md:py-12 bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/request-ad">
              <Button variant="outline" size="sm" data-testid="button-footer-request-ad">
                <Megaphone className="ml-2 h-4 w-4" />
                اطلب إعلانك
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" data-testid="button-footer-contact">
                تواصل معنا
              </Button>
            </Link>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2025 أضحيتي. جميع الحقوق محفوظة.</p>
            <p className="mt-2">
              Developed by{" "}
              <a
                href="https://novawebdv.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                NovaWeb
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
