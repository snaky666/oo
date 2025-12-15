import { Construction, Wrench, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function UnderConstruction() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      
      <Card className="relative z-10 max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Construction className="w-20 h-20 text-primary" />
              <Wrench className="w-8 h-8 text-primary absolute -bottom-1 -right-1 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            الموقع قيد الإنجاز
          </h1>
          
          <p className="text-muted-foreground text-lg mb-6">
            نعمل حالياً على تطوير الموقع لتقديم أفضل تجربة لكم.
            <br />
            يرجى العودة قريباً!
          </p>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-5 h-5" />
            <span>قريباً...</span>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              منصة أضحيتي
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
