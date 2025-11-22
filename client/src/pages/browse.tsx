import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, Query, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sheep, algeriaCities } from "@shared/schema";
import Header from "@/components/Header";
import SheepCard from "@/components/SheepCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";

export default function BrowseSheep() {
  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 48]);
  const [weightRange, setWeightRange] = useState<[number, number]>([0, 100]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchSheep();
  }, []);

  const fetchSheep = async () => {
    setLoading(true);
    try {
      const sheepQuery = query(
        collection(db, "sheep"),
        where("status", "==", "approved")
      );
      
      const snapshot = await getDocs(sheepQuery);
      let sheepData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sheep[];
      
      // Sort by createdAt in descending order on client side
      sheepData = sheepData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setSheep(sheepData);
    } catch (error) {
      console.error("Error fetching sheep:", error);
      setSheep([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSheep = sheep.filter(s => {
    if (s.price < priceRange[0] || s.price > priceRange[1]) return false;
    if (s.age < ageRange[0] || s.age > ageRange[1]) return false;
    if (s.weight < weightRange[0] || s.weight > weightRange[1]) return false;
    if (selectedCities.length > 0 && !selectedCities.includes(s.city)) return false;
    return true;
  });

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setAgeRange([0, 48]);
    setWeightRange([0, 100]);
    setSelectedCities([]);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Price Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">السعر (DA)</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">من</Label>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]])}
              min={0}
              max={10000}
              placeholder="0"
              data-testid="input-price-min"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">إلى</Label>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Math.min(10000, parseInt(e.target.value) || 10000)])}
              min={0}
              max={10000}
              placeholder="10000"
              data-testid="input-price-max"
            />
          </div>
        </div>
      </div>

      {/* Age Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">العمر (شهر)</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">من</Label>
            <Input
              type="number"
              value={ageRange[0]}
              onChange={(e) => setAgeRange([Math.max(0, parseInt(e.target.value) || 0), ageRange[1]])}
              min={0}
              max={48}
              placeholder="0"
              data-testid="input-age-min"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">إلى</Label>
            <Input
              type="number"
              value={ageRange[1]}
              onChange={(e) => setAgeRange([ageRange[0], Math.min(48, parseInt(e.target.value) || 48)])}
              min={0}
              max={48}
              placeholder="48"
              data-testid="input-age-max"
            />
          </div>
        </div>
      </div>

      {/* Weight Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">الوزن (كجم)</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">من</Label>
            <Input
              type="number"
              value={weightRange[0]}
              onChange={(e) => setWeightRange([Math.max(0, parseInt(e.target.value) || 0), weightRange[1]])}
              min={0}
              max={100}
              placeholder="0"
              data-testid="input-weight-min"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">إلى</Label>
            <Input
              type="number"
              value={weightRange[1]}
              onChange={(e) => setWeightRange([weightRange[0], Math.min(100, parseInt(e.target.value) || 100)])}
              min={0}
              max={100}
              placeholder="100"
              data-testid="input-weight-max"
            />
          </div>
        </div>
      </div>

      {/* Cities Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">المدينة</Label>
        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
          {algeriaCities.map(city => (
            <div key={city} className="flex items-center gap-2">
              <Checkbox
                id={`city-${city}`}
                checked={selectedCities.includes(city)}
                onCheckedChange={() => toggleCity(city)}
                data-testid={`checkbox-city-${city}`}
              />
              <Label
                htmlFor={`city-${city}`}
                className="text-sm font-normal cursor-pointer"
              >
                {city}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={clearFilters}
        data-testid="button-clear-filters"
      >
        <X className="ml-2 h-4 w-4" />
        مسح الفلاتر
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold mb-2">تصفح الأغنام</h1>
            <p className="text-muted-foreground">
              {loading ? "جاري التحميل..." : `${filteredSheep.length} خروف متاح`}
            </p>
          </div>

          {/* Mobile Filter Button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden" data-testid="button-open-filters">
                <Filter className="ml-2 h-4 w-4" />
                الفلاتر
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>الفلاتر</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>الفلاتر</CardTitle>
              </CardHeader>
              <CardContent>
                <FiltersContent />
              </CardContent>
            </Card>
          </aside>

          {/* Sheep Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSheep.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-lg text-muted-foreground mb-4">
                    لا توجد أغنام متاحة حالياً
                  </p>
                  <Button onClick={clearFilters} variant="outline" data-testid="button-clear-filters-empty">
                    مسح الفلاتر
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSheep.map(s => (
                  <SheepCard key={s.id} sheep={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
