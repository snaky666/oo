import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertAdSchema, Ad } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function AdminAdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertAdSchema),
    defaultValues: {
      image: "",
      link: "",
      description: "",
    },
  });

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const response = await fetch("/api/ads");
      return response.json() as Promise<Ad[]>;
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create ad");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم إضافة الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إضافة الإعلان", variant: "destructive" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete ad");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم حذف الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف الإعلان", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    createAdMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">إدارة الإعلانات</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ad">
              <Plus className="ml-2 h-4 w-4" />
              إضافة إعلان
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة إعلان جديد</DialogTitle>
              <DialogDescription>
                أضف إعلان جديد للعرض على الصفحة الرئيسية
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط صورة الإعلان (ImgBB)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://i.ibb.co/..."
                          {...field}
                          data-testid="input-ad-image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الإعلان</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل وصف الإعلان أو نص الشركة"
                          {...field}
                          data-testid="input-ad-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط موقع الشركة (اختياري)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                          data-testid="input-ad-link"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createAdMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-ad"
                >
                  {createAdMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إضافة الإعلان
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </CardContent>
        </Card>
      ) : ads.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            لا توجد إعلانات حتى الآن
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4 space-y-3">
                <img
                  src={ad.image}
                  alt="إعلان"
                  className="w-full h-40 object-cover rounded-md"
                />
                <p className="text-sm line-clamp-2">{ad.description}</p>
                {ad.link && ad.link !== "" && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline block truncate"
                  >
                    {ad.link}
                  </a>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteAdMutation.mutate(ad.id)}
                  disabled={deleteAdMutation.isPending}
                  className="w-full"
                  data-testid={`button-delete-ad-${ad.id}`}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
