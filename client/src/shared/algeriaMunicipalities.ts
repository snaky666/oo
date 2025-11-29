// Algerian Municipalities Data Loader
export interface Municipality {
  id: number;
  commune_name: string;
  daira_name: string;
  wilaya_code: string;
  wilaya_name: string;
}

let municipalitiesCache: Municipality[] | null = null;

export async function loadMunicipalitiesData(): Promise<Municipality[]> {
  if (municipalitiesCache) {
    return municipalitiesCache;
  }

  try {
    // Try multiple paths for flexibility
    const paths = [
      '/data/municipalities.json',
      '/public/data/municipalities.json',
      './data/municipalities.json'
    ];
    
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    for (const path of paths) {
      try {
        response = await fetch(path);
        if (response.ok) break;
      } catch (err) {
        lastError = err as Error;
      }
    }
    
    if (!response?.ok) {
      throw lastError || new Error('Failed to fetch municipalities data');
    }
    
    const data = await response.json();
    municipalitiesCache = data;
    return data;
  } catch (error) {
    console.error('❌ Error loading municipalities:', error);
    // Return empty array but don't break the app
    return [];
  }
}

export async function getMunicipalitiesByWilaya(wilayaCode: string): Promise<Municipality[]> {
  const municipalities = await loadMunicipalitiesData();
  return municipalities
    .filter(m => m.wilaya_code === wilayaCode)
    .sort((a, b) => a.commune_name.localeCompare(b.commune_name));
}

export async function getAllWilayas(): Promise<Array<{ code: string; name: string }>> {
  const municipalities = await loadMunicipalitiesData();
  const wilayas = new Map<string, string>();
  
  municipalities.forEach(m => {
    if (!wilayas.has(m.wilaya_code)) {
      wilayas.set(m.wilaya_code, m.wilaya_name);
    }
  });

  return Array.from(wilayas.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMunicipalityByName(municipalityName: string): Promise<Municipality | undefined> {
  const municipalities = await loadMunicipalitiesData();
  return municipalities.find(m => m.commune_name === municipalityName);
}

export async function searchMunicipalities(query: string): Promise<Municipality[]> {
  const municipalities = await loadMunicipalitiesData();
  const lowerQuery = query.toLowerCase();
  
  return municipalities.filter(m =>
    m.commune_name.toLowerCase().includes(lowerQuery) ||
    m.daira_name.toLowerCase().includes(lowerQuery) ||
    m.wilaya_name.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}
