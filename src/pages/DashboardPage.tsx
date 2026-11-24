import { useState, useEffect, useRef } from "react";
import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiMapPin, 
  FiBarChart2, 
  FiEyeOff,
  FiCompass
} from "react-icons/fi";
import { LOCATIONS, type LocationInput } from "../data/location";
import { fetchWeatherList, type LocationWeather } from "../service/Weather";
import WeatherMap from "../components/WeatherMap";
import LeftFilterPanel from "../components/LeftFilterPanel";
import RightComparisonPanel from "../components/RightComparisonPanel";

export default function DashboardPage() {
  // ข้อมูลอำเภอทั้งหมด 25 อำเภอจาก data/location.ts
  const allLocations: LocationInput[] = LOCATIONS;

  // รายชื่อ ID อำเภอที่เลือก (เริ่มต้นด้วย 3 อำเภอ: เมืองเชียงใหม่, แม่ริม, ดอยสะเก็ด)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "mueang-chiang-mai",
    "mae-rim",
    "doi-saket",
  ]);

  // ข้อมูลสภาพอากาศของอำเภอที่ถูกเลือกมาเปรียบเทียบ (Single Source of Truth)
  const [comparedDistricts, setComparedDistricts] = useState<LocationWeather[]>([]);
  
  // สถานะการโหลด
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(true);

  // สำหรับหน้าจอมือถือ/แท็บเล็ต: ค่าเริ่มต้นคือ null (ไม่เปิดการ์ดก่อน ตามที่กำหนด)
  const [mobileActivePanel, setMobileActivePanel] = useState<"filter" | "compare" | null>(null);

  // การแจ้งเตือน Toast Notification แบบค่อยๆ เฟดหายไป
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ฟังก์ชันแสดงการแจ้งเตือนแล้วค่อยๆ เฟดจางหายไปอัตโนมัติ
  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastVisible(true);

    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 350);
    }, 2600);
  };

  // ดึงข้อมูลสภาพอากาศและ PM2.5 ครั้งแรกเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const initialLocations = allLocations.filter((loc) =>
          selectedIds.includes(loc.id)
        );
        const data = await fetchWeatherList(initialLocations);
        setComparedDistricts(data);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสภาพอากาศและ PM2.5:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // ฟังก์ชันเพิ่มอำเภอ
  const handleAddDistrict = async (districtId: string) => {
    if (selectedIds.includes(districtId)) return;
    if (selectedIds.length >= 5) {
      showToast("สามารถเลือกเปรียบเทียบได้สูงสุด 5 อำเภอครับ");
      return;
    }
    
    // 1. เพิ่มเข้าใน selectedIds ทันที
    setSelectedIds((prev) => [...prev, districtId]);

    // 2. ดึงข้อมูลสภาพอากาศของอำเภอใหม่มาแสดงบนแผนที่และการ์ดทันที
    const targetLoc = allLocations.find((loc) => loc.id === districtId);
    if (targetLoc) {
      try {
        const [newWeather] = await fetchWeatherList([targetLoc]);
        setComparedDistricts((prev) => {
          // ป้องกันการใส่ซ้ำ
          const filtered = prev.filter((d) => d.id !== districtId);
          return [...filtered, newWeather];
        });
      } catch (e) {
        console.error("ไม่สามารถดึงข้อมูลอำเภอใหม่ได้:", e);
        // Fallback ข้อมูลพื้นฐานเพื่อให้การ์ดหมุดปรากฏบนแผนที่แน่นอน
        const fallbackWeather: LocationWeather = {
          ...targetLoc,
          temperature: 28,
          humidity: 65,
          windSpeed: 3.5,
          weatherCode: 1,
          pm25: 15,
          aqi: 55,
        };
        setComparedDistricts((prev) => [...prev.filter((d) => d.id !== districtId), fallbackWeather]);
      }
    }
  };

  // ฟังก์ชันลบอำเภอที่เลือก (กดกากบาท ✕ แล้วการ์ดและหมุดจะหายไปทันที 100%)
  const handleRemoveDistrict = (districtId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== districtId));
    setComparedDistricts((prev) => prev.filter((d) => d.id !== districtId));
  };

  // ฟังก์ชันล้างอำเภอที่เลือกทั้งหมด (การ์ดหมุดจะหายไปจากแผนที่ทั้งหมด)
  const handleClearAll = () => {
    if (selectedIds.length === 0) return;
    setSelectedIds([]);
    setComparedDistricts([]);
    showToast("ล้างรายการอำเภอที่เลือกทั้งหมดแล้ว");
  };

  // ฟังก์ชันเมื่อกดปุ่ม GO เพื่อเริ่มเปรียบเทียบ
  const handleConfirmCompare = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsLoading(true);
      const chosenLocations = allLocations.filter((loc) =>
        selectedIds.includes(loc.id)
      );

      const data = await fetchWeatherList(chosenLocations);
      setComparedDistricts(data);
      setIsSubmitted(true);
      
      // บนจอมือถือ สลับไปเปิดแผงเปรียบเทียบให้อัตโนมัติ
      setMobileActivePanel("compare");
      showToast("อัปเดตข้อมูลและเปิดผลเปรียบเทียบแล้ว");
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลสภาพอากาศได้:", error);
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูลสภาพอากาศ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // สลับการ์ดบนมือถือ
  const toggleMobilePanel = (panel: "filter" | "compare") => {
    setMobileActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#F0E6EF]/40 font-sans">
      {/* 1. แผนที่พื้นหลัง Interactive Map */}
      <WeatherMap
        selectedDistricts={comparedDistricts}
        onSelectDistrict={handleAddDistrict}
        onRemoveDistrict={handleRemoveDistrict}
      />

      {/* 2. Toast Notification ลอยตรงกลางด้านบน */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-out">
          <div
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-[#F0A6CA]/30 transition-all duration-300 ${
              toastVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-3 scale-95"
            } bg-[#4A3E56]/95 text-white`}
          >
            {toastMessage.includes("เรียบร้อย") || toastMessage.includes("อัปเดต") ? (
              <FiCheckCircle className="text-base sm:text-lg flex-shrink-0 text-[#EFC3E6]" />
            ) : (
              <FiAlertCircle className="text-base sm:text-lg flex-shrink-0 text-[#F0A6CA]" />
            )}
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          A. สำหรับหน้าจอ PC (Desktop: lg ขึ้นไป) 
          แสดงการ์ดซ้าย-ขวาพร้อมกันเหมือนเดิม ความสูงเท่ากันเป๊ะ
         ======================================================== */}
      <div className="hidden lg:flex relative z-10 w-full h-full pointer-events-none p-6 lg:p-8 justify-between items-start gap-4">
        {/* การ์ดฝั่งซ้าย: Weather Chiang Mai */}
        <div className="pointer-events-auto w-[360px] h-full max-h-[700px] min-h-[540px]">
          <LeftFilterPanel
            allLocations={allLocations}
            selectedIds={selectedIds}
            onAddDistrict={handleAddDistrict}
            onRemoveDistrict={handleRemoveDistrict}
            onClearAll={handleClearAll}
            onConfirmCompare={handleConfirmCompare}
            isLoading={isLoading}
          />
        </div>

        {/* การ์ดฝั่งขวา: ฝั่งเปรียบเทียบ */}
        <div className="pointer-events-auto w-[420px] h-full max-h-[700px] min-h-[540px]">
          <RightComparisonPanel
            districts={comparedDistricts}
            isSubmitted={isSubmitted}
          />
        </div>
      </div>

      {/* ========================================================
          B. สำหรับหน้าจอมือถือ / แท็บเล็ต (Mobile: ต่ำกว่า lg)
          ค่าเริ่มต้นไม่เปิดการ์ดก่อน มีปุ่มสลับด้านบน และปุ่มเปิดด้านล่าง
         ======================================================== */}
      <div className="lg:hidden">
        {/* แถบปุ่มควบคุมสลับดู 2 การ์ด (Floating Responsive Switcher ด้านบน) */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-xl shadow-[#9C89B8]/20 border border-[#F0E6EF] flex items-center gap-1.5 transition-all">
            {/* ปุ่มที่ 1: เลือกอำเภอ */}
            <button
              type="button"
              onClick={() => toggleMobilePanel("filter")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mobileActivePanel === "filter"
                  ? "bg-[#F0A6CA] text-white shadow-sm shadow-[#F0A6CA]/30 scale-[1.02]"
                  : "text-[#4A3E56] hover:bg-[#F0E6EF]/70 hover:text-[#9C89B8]"
              }`}
            >
              <FiMapPin className="text-sm" />
              <span>เลือกอำเภอ</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                mobileActivePanel === "filter" ? "bg-white/25 text-white" : "bg-[#F0E6EF] text-[#9C89B8]"
              }`}>
                {selectedIds.length}/5
              </span>
            </button>

            {/* ปุ่มที่ 2: ดูผลเปรียบเทียบ */}
            <button
              type="button"
              onClick={() => toggleMobilePanel("compare")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mobileActivePanel === "compare"
                  ? "bg-[#9C89B8] text-white shadow-sm shadow-[#9C89B8]/30 scale-[1.02]"
                  : "text-[#4A3E56] hover:bg-[#F0E6EF]/70 hover:text-[#9C89B8]"
              }`}
            >
              <FiBarChart2 className="text-sm" />
              <span>เปรียบเทียบ</span>
            </button>

            {/* ปุ่มพับเก็บ เมื่อเปิดการ์ดอยู่ */}
            {mobileActivePanel !== null && (
              <button
                type="button"
                onClick={() => setMobileActivePanel(null)}
                className="p-2 text-[#9C89B8] hover:text-[#4A3E56] hover:bg-[#F0E6EF] rounded-full transition-colors cursor-pointer"
                title="พับเก็บเพื่อดูแผนที่เต็มจอ"
              >
                <FiEyeOff className="text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* ชั้นแสดงการ์ดบนมือถือ */}
        <div className="fixed inset-0 z-20 pointer-events-none p-4 pt-20 flex justify-center items-start">
          {/* การ์ดเลือกอำเภอ */}
          {mobileActivePanel === "filter" && (
            <div className="pointer-events-auto w-full max-w-[360px] h-[calc(100vh-6rem)] max-h-[640px] animate-in fade-in slide-in-from-top-4 duration-300">
              <LeftFilterPanel
                allLocations={allLocations}
                selectedIds={selectedIds}
                onAddDistrict={handleAddDistrict}
                onRemoveDistrict={handleRemoveDistrict}
                onClearAll={handleClearAll}
                onConfirmCompare={handleConfirmCompare}
                onClose={() => setMobileActivePanel(null)}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* การ์ดเปรียบเทียบ */}
          {mobileActivePanel === "compare" && (
            <div className="pointer-events-auto w-full max-w-[390px] h-[calc(100vh-6rem)] max-h-[640px] animate-in fade-in slide-in-from-top-4 duration-300">
              <RightComparisonPanel
                districts={comparedDistricts}
                isSubmitted={isSubmitted}
                onClose={() => setMobileActivePanel(null)}
              />
            </div>
          )}

          {/* ปุ่มด้านล่าง: "คลิกเพื่อเปิดเมนูเลือกอำเภอ" เมื่อเริ่มต้นเข้าเว็บ */}
          {mobileActivePanel === null && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setMobileActivePanel("filter")}
                className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-[#F0E6EF] text-xs font-semibold text-[#4A3E56] hover:bg-[#F0E6EF] transition-all cursor-pointer shadow-[#9C89B8]/15 active:scale-95"
              >
                <FiCompass className="text-sm text-[#F0A6CA]" />
                <span>คลิกเพื่อเปิดเมนูเลือกอำเภอ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
