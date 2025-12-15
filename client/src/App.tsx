import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import UnderConstruction from "@/pages/under-construction";

// تفعيل وضع "قيد الإنجاز" - غيّر إلى false لإظهار الموقع الكامل
const MAINTENANCE_MODE = true;

function App() {
  if (MAINTENANCE_MODE) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <UnderConstruction />
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // الكود الأصلي للموقع الكامل (معطل حالياً)
  return null;
}

export default App;