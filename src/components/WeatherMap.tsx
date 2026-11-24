import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationWeather } from "../service/Weather";

interface WeatherMapProps {
  selectedDistricts: LocationWeather[];
  onSelectDistrict?: (districtId: string) => void;
  onRemoveDistrict?: (districtId: string) => void;
}

export default function WeatherMap({
  selectedDistricts,
  onSelectDistrict,
  onRemoveDistrict,
}: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // เก็บ ID ของการ์ดที่ถูกคลิกล่าสุด เพื่อให้ขึ้นมาอยู่บนสุด (Top Z-Index)
  const [activeDistrictId, setActiveDistrictId] = useState<string | null>(null);

  // เก็บ callback ลงใน ref เพื่อให้ event listener ใน HTML string เรียกใช้งานได้เสถียร
  const callbacksRef = useRef({ onSelectDistrict, onRemoveDistrict });
  useEffect(() => {
    callbacksRef.current = { onSelectDistrict, onRemoveDistrict };
  }, [onSelectDistrict, onRemoveDistrict]);

  // ตั้งค่า window helper เพื่อให้ปุ่มในการ์ดหมุด HTML เรียกฟังก์ชัน React ได้
  useEffect(() => {
    (window as any).__weatherMapActions = {
      removeDistrict: (id: string, e: Event) => {
        e.stopPropagation();
        // ลบ Marker ออกจากแผนที่ทันที
        if (markersRef.current[id]) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
        // แจ้ง parent component ให้ลบอำเภอนี้ออกจากรายการ
        callbacksRef.current.onRemoveDistrict?.(id);
      },
      navigateLocation: (lat: number, lng: number, name: string, e: Event) => {
        e.stopPropagation();
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}+(${encodeURIComponent(
            name
          )})`,
          "_blank"
        );
      },
      bringToFront: (id: string) => {
        setActiveDistrictId(id);
        if (markersRef.current[id]) {
          Object.values(markersRef.current).forEach((m) => m.setZIndexOffset(0));
          markersRef.current[id].setZIndexOffset(10000);
        }
      },
    };

    return () => {
      delete (window as any).__weatherMapActions;
    };
  }, []);

  // เริ่มต้นสร้างแผนที่ Leaflet เพียงครั้งเดียว
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // พิกัดใจกลางเชียงใหม่
    const map = L.map(mapContainerRef.current, {
      center: [18.795, 98.985],
      zoom: 10,
      zoomControl: false,
    });

    // ใช้ OpenStreetMap Tile มาตรฐาน ฟรี 100% ไม่มีลิขสิทธิ์ผูกมัด
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // วางปุ่ม Zoom ไว้มุมล่างขวา
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // วาด Marker ปักหมุดตามพิกัดอำเภอที่เลือกอย่างแม่นยำ
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // ลบ Marker เก่าก่อนวาดใหม่
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // แสดงการ์ดหมุดตาม selectedDistricts ทั้งหมด (Single Source of Truth)
    selectedDistricts.forEach((item) => {
      const isActive = activeDistrictId === item.id;

      // ปรับขนาดการ์ดหมุดให้กะทัดรัด (กว้าง 190px, รูปสูง 75px)
      const pinHtml = `
        <div 
          class="relative cursor-pointer transition-all duration-300 select-none group" 
          style="width: 190px;"
          onclick="window.__weatherMapActions.bringToFront('${item.id}')"
        >
          <!-- ตัวการ์ดสีขาวโค้งมน ขนาดกะทัดรัด -->
          <div 
            class="bg-white rounded-2xl shadow-xl border ${
              isActive
                ? "border-[#F0A6CA] ring-3 ring-[#EFC3E6]"
                : "border-[#F0A6CA] ring-2 ring-[#EFC3E6]/60"
            } overflow-hidden backdrop-blur-md"
            style="width: 190px;"
          >
            <!-- รูปภาพสถานที่ท่องเที่ยวประจำอำเภอ (ความสูง 75px) -->
            <div class="relative w-full h-[75px] bg-slate-100 overflow-hidden" style="width: 190px; height: 75px;">
              <img 
                src="${item.imageUrl}" 
                alt="${item.landmark}" 
                style="width: 190px; height: 75px; object-fit: cover; display: block;"
                class="transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              
              <!-- Badge หมวดหมู่ขนาดกะทัดรัด -->
              <div class="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[8px] font-bold text-[#4A3E56] shadow-xs uppercase truncate max-w-[130px]">
                ${item.category}
              </div>

              <!-- ปุ่มปิดกากบาท (ขวาบน) - คลิกแล้วลบอำเภอนี้ออกทันที -->
              <button 
                type="button" 
                onclick="window.__weatherMapActions.removeDistrict('${item.id}', event)"
                class="absolute top-1.5 right-1.5 w-5 h-5 bg-white/90 hover:bg-white text-[#9C89B8] hover:text-[#F0A6CA] rounded-full flex items-center justify-center text-[10px] shadow-xs transition-all cursor-pointer"
                title="ลบอำเภอนี้ออก"
              >
                ✕
              </button>
            </div>

            <!-- รายละเอียดสถานที่และข้อมูลสภาพอากาศ -->
            <div class="p-2.5 space-y-1.5" style="width: 190px;">
              <div>
                <h4 class="font-bold text-[#4A3E56] text-xs truncate leading-tight">${item.landmark}</h4>
                <p class="text-[10px] text-[#9C89B8] truncate leading-tight">${item.name}</p>
              </div>

              <!-- ข้อมูลสภาพอากาศและค่าฝุ่น PM2.5 แบบ Compact -->
              <div class="bg-[#F0E6EF]/50 rounded-xl p-1.5 border border-[#EFC3E6]/50 grid grid-cols-3 gap-0.5 text-center">
                <div>
                  <span class="block text-[8px] text-[#9C89B8]">อุณหภูมิ</span>
                  <strong class="text-[11px] text-[#4A3E56]">${item.temperature}°C</strong>
                </div>
                <div>
                  <span class="block text-[8px] text-[#9C89B8]">ความชื้น</span>
                  <strong class="text-[11px] text-[#4A3E56]">${item.humidity}%</strong>
                </div>
                <div>
                  <span class="block text-[8px] text-[#9C89B8]">PM2.5</span>
                  <strong class="text-[11px] text-[#d9669e]">${item.pm25}</strong>
                </div>
              </div>

              <!-- ปุ่ม Action นำทางกะทัดรัด -->
              <div class="pt-0.5">
                <button 
                  type="button"
                  onclick="window.__weatherMapActions.navigateLocation(${item.latitude}, ${item.longitude}, '${item.landmark}', event)"
                  class="w-full bg-[#9C89B8] hover:bg-[#8e79ab] text-white text-[10px] font-medium py-1 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>นำทาง</span>
                  <span class="text-[9px]">↗</span>
                </button>
              </div>
            </div>
          </div>

          <!-- หางแหลมสีขาวชี้ลงไปที่หมุดพิกัด -->
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-white mx-auto -mt-[1px] drop-shadow-sm"></div>

          <!-- จุดหมุดวงกลมสี Blush Pop (#F0A6CA) กะทัดรัด -->
          <div class="relative mx-auto mt-0.5 flex items-center justify-center w-4 h-4">
            <div class="absolute w-4 h-4 bg-[#EFC3E6] rounded-full opacity-60 animate-ping"></div>
            <div class="relative w-2.5 h-2.5 bg-[#F0A6CA] border-2 border-white rounded-full shadow-md"></div>
          </div>
        </div>
      `;

      // กำหนดขนาดและจุด Anchor ของ Icon ให้ตรงกับขนาดใหม่ (กว้าง 190px, สูง 225px)
      const customIcon = L.divIcon({
        html: pinHtml,
        className: "custom-weather-pin",
        iconSize: [190, 225],
        iconAnchor: [95, 220],
      });

      const marker = L.marker([item.latitude, item.longitude], {
        icon: customIcon,
        zIndexOffset: isActive ? 10000 : 0,
      }).addTo(map);

      // เมื่อคลิกที่ Marker ให้ขึ้นมาอยู่บนสุดและเรียก callback
      marker.on("click", () => {
        setActiveDistrictId(item.id);
        Object.values(markersRef.current).forEach((m) => m.setZIndexOffset(0));
        marker.setZIndexOffset(10000);

        if (onSelectDistrict) {
          onSelectDistrict(item.id);
        }
      });

      markersRef.current[item.id] = marker;
    });

    // ปรับมุมมองแผนที่ให้ครอบคลุมอำเภอที่เลือกทั้งหมดเมื่อมีการเปลี่ยนแปลง
    if (selectedDistricts.length > 0) {
      const group = L.featureGroup(
        selectedDistricts.map((d) => L.marker([d.latitude, d.longitude]))
      );
      map.fitBounds(group.getBounds(), {
        padding: [100, 100],
        maxZoom: 12,
        animate: true,
      });
    }
  }, [selectedDistricts, onSelectDistrict, activeDistrictId]);

  return (
    <div className="absolute inset-0 z-0 w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
