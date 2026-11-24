import type { LocationInput } from "../data/location";

// โครงสร้างข้อมูลสภาพอากาศ
export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  pm25: number; // ค่าฝุ่น PM2.5 หน่วย µg/m³ จาก Open-Meteo Air Quality API
  aqi: number;  // ดัชนีคุณภาพอากาศ AQI
}

// ข้อมูลสภาพอากาศพร้อมชื่ออำเภอ พิกัด และสถานที่ท่องเที่ยวสำคัญ
export interface LocationWeather extends WeatherData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  landmark: string;
  category: string;
  imageUrl: string;
  description: string;
}

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

interface OpenMeteoAirQualityResponse {
  current?: {
    pm2_5: number;
    us_aqi: number;
  };
}

// ฟังก์ชันดึงสภาพอากาศและค่าฝุ่น PM2.5 จากพิกัด
export async function fetchWeather(
  latitude = 18.7883,
  longitude = 98.9853
): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,us_aqi`;

  const [weatherRes, airQualityRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(airQualityUrl).catch(() => null),
  ]);

  if (!weatherRes.ok) {
    throw new Error(`Weather request failed with status ${weatherRes.status}`);
  }

  const weatherData: OpenMeteoWeatherResponse = await weatherRes.json();
  let pm25 = 18;
  let aqi = 60;

  if (airQualityRes && airQualityRes.ok) {
    const airData: OpenMeteoAirQualityResponse = await airQualityRes.json();
    if (airData.current) {
      pm25 = Math.round(airData.current.pm2_5);
      aqi = Math.round(airData.current.us_aqi);
    }
  }

  if (!weatherData.current) {
    throw new Error("Invalid weather response structure");
  }

  return {
    temperature: Math.round(weatherData.current.temperature_2m),
    humidity: weatherData.current.relative_humidity_2m,
    windSpeed: weatherData.current.wind_speed_10m,
    weatherCode: weatherData.current.weather_code,
    pm25,
    aqi,
  };
}

// รับหลายพิกัด แล้วดึงสภาพอากาศพร้อมค่าฝุ่นและสถานที่ท่องเที่ยว
export async function fetchWeatherList(
  locations: LocationInput[]
): Promise<LocationWeather[]> {
  const results = await Promise.all(
    locations.map(async (loc) => {
      const weather = await fetchWeather(loc.latitude, loc.longitude);
      return {
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        landmark: loc.landmark,
        category: loc.category,
        imageUrl: loc.imageUrl,
        description: loc.description,
        ...weather,
      };
    })
  );

  return results;
}
