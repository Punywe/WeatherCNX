import { useState } from "react";
import { 
  FiDroplet, 
  FiWind, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiGrid, 
  FiList, 
  FiMapPin, 
  FiInfo,
  FiShield,
  FiX
} from "react-icons/fi";
import { WiThermometer } from "react-icons/wi";
import type { LocationWeather } from "../service/Weather";
import { getWeatherCondition, getPM25Level } from "../service/weatherHelper";

interface RightComparisonPanelProps {
  districts: LocationWeather[];
  isSubmitted: boolean;
  onClose?: () => void; // ปุ่มปิดพับการ์ดเก็บ
}

export default function RightComparisonPanel({
  districts,
  isSubmitted,
  onClose,
}: RightComparisonPanelProps) {
  // สลับโหมดการแสดงผล: "cards" (การ์ด) หรือ "table" (ตาราง)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // กรณีที่ยังไม่ได้กด GO หรือไม่มีอำเภอที่เลือก
  if (!isSubmitted || districts.length === 0) {
    return (
      <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-[#9C89B8]/15 border border-[#F0E6EF] p-6 flex flex-col justify-between items-center text-center transition-all duration-300">
        <div className="w-full flex justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0E6EF] hover:bg-[#EFC3E6]/60 text-[#9C89B8] hover:text-[#4A3E56] flex items-center justify-center transition-colors cursor-pointer"
              title="ปิดการ์ด"
            >
              <FiX className="text-base" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center my-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#F0E6EF] text-[#9C89B8] flex items-center justify-center text-3xl mb-4 shadow-inner">
            <FiMapPin />
          </div>
          <h3 className="text-lg font-bold text-[#4A3E56] mb-2">
            ฝั่งเปรียบเทียบ
          </h3>
          <p className="text-sm text-[#9C89B8] max-w-xs leading-relaxed">
            เลือกอำเภอที่คุณต้องการเปรียบเทียบจากฝั่งเลือกอำเภอ (สูงสุด 5 อำเภอ) แล้วกดปุ่ม{" "}
            <span className="font-semibold text-[#9C89B8]">GO</span> เพื่อดูผลเปรียบเทียบสภาพอากาศและค่าฝุ่น PM2.5
          </p>
        </div>
      </div>
    );
  }

  // คำนวณค่าทางสถิติเพื่อสรุปไฮไลท์ (ร้อนสุด / เย็นสุด / อากาศสะอาดสุด)
  const warmest = districts.reduce((prev, curr) =>
    curr.temperature > prev.temperature ? curr : prev
  );
  const coolest = districts.reduce((prev, curr) =>
    curr.temperature < prev.temperature ? curr : prev
  );
  const cleanestAir = districts.reduce((prev, curr) =>
    curr.pm25 < prev.pm25 ? curr : prev
  );

  return (
    <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-[#9C89B8]/15 border border-[#F0E6EF] p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all duration-300">
      {/* ส่วนบน: Header + Quick Insights */}
      <div className="flex-none">
        {/* Header: ส่วนหัวของกล่องเปรียบเทียบ พร้อมปุ่มปิด */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E6EF]">
          <div>
            <h3 className="text-lg font-bold text-[#4A3E56]">
              ฝั่งเปรียบเทียบ
            </h3>
            <p className="text-xs text-[#9C89B8] font-medium">
              เปรียบเทียบสภาพอากาศ {districts.length} อำเภอ
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มสลับมุมมอง Cards / Table */}
            <div className="flex items-center gap-1 bg-[#F0E6EF] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg text-sm transition-all ${
                  viewMode === "cards"
                    ? "bg-white text-[#9C89B8] shadow-xs font-semibold"
                    : "text-[#9C89B8]/70 hover:text-[#9C89B8]"
                }`}
                title="มุมมองการ์ด"
              >
                <FiGrid />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-sm transition-all ${
                  viewMode === "table"
                    ? "bg-white text-[#9C89B8] shadow-xs font-semibold"
                    : "text-[#9C89B8]/70 hover:text-[#9C89B8]"
                }`}
                title="มุมมองตาราง"
              >
                <FiList />
              </button>
            </div>

            {/* ปุ่มปิดการ์ด */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F0E6EF] hover:bg-[#EFC3E6]/60 text-[#9C89B8] hover:text-[#4A3E56] flex items-center justify-center transition-colors cursor-pointer"
                title="ปิดการ์ด"
              >
                <FiX className="text-base" />
              </button>
            )}
          </div>
        </div>

        {/* สรุปจุดสำคัญอย่างรวดเร็ว (Quick Insights) */}
        <div className="grid grid-cols-3 gap-2 my-2.5">
          {/* เย็นที่สุด */}
          <div className="bg-[#B8BEDD]/25 border border-[#B8BEDD]/50 rounded-2xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[#657199] text-xs font-medium mb-0.5">
              <FiTrendingDown />
              <span>เย็นที่สุด</span>
            </div>
            <p className="text-xs font-bold text-[#4A3E56] truncate">{coolest.name}</p>
            <p className="text-xs font-semibold text-[#657199]">{coolest.temperature} °C</p>
          </div>

          {/* ร้อนที่สุด */}
          <div className="bg-[#F0A6CA]/20 border border-[#F0A6CA]/40 rounded-2xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[#d9669e] text-xs font-medium mb-0.5">
              <FiTrendingUp />
              <span>ร้อนที่สุด</span>
            </div>
            <p className="text-xs font-bold text-[#4A3E56] truncate">{warmest.name}</p>
            <p className="text-xs font-semibold text-[#d9669e]">{warmest.temperature} °C</p>
          </div>

          {/* อากาศสะอาดสุด */}
          <div className="bg-[#EFC3E6]/30 border border-[#EFC3E6]/60 rounded-2xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[#9C89B8] text-xs font-medium mb-0.5">
              <FiShield />
              <span>ฝุ่นน้อยสุด</span>
            </div>
            <p className="text-xs font-bold text-[#4A3E56] truncate">{cleanestAir.name}</p>
            <p className="text-xs font-semibold text-[#9C89B8]">{cleanestAir.pm25} µg</p>
          </div>
        </div>
      </div>

      {/* ส่วนกลาง: เนื้อหาการเปรียบเทียบ */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar my-1">
        {viewMode === "cards" ? (
          // แบบการ์ด (Cards View)
          districts.map((item) => {
            const condition = getWeatherCondition(item.weatherCode);
            const pm25Info = getPM25Level(item.pm25);

            return (
              <div
                key={item.id}
                className="bg-[#F0E6EF]/40 hover:bg-[#F0E6EF]/70 border border-[#EFC3E6]/60 rounded-2xl p-3 transition-all hover:shadow-xs"
              >
                {/* แถวบน: ภาพย่อสถานที่ + ชื่อสถานที่ + ชื่ออำเภอ และ สภาพอากาศ */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.landmark}
                        className="w-9 h-9 rounded-xl object-cover border border-[#B8BEDD]/40 flex-shrink-0"
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-[#4A3E56] text-xs sm:text-sm leading-normal truncate max-w-[150px]">
                        {item.landmark}
                      </h4>
                      <p className="text-[10px] text-[#9C89B8] leading-normal">{item.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${pm25Info.bgColor} ${pm25Info.textColor} ${pm25Info.borderColor}`}>
                      PM2.5: {item.pm25}
                    </div>
                    <div>{condition.icon}</div>
                  </div>
                </div>

                {/* แถวกลาง: อุณหภูมิ และ บาร์เปรียบเทียบ */}
                <div className="mb-2">
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-[#9C89B8] flex items-center gap-1 font-medium text-[11px]">
                      <WiThermometer className="text-base text-[#F0A6CA]" />
                      อุณหภูมิ
                    </span>
                    <span className="font-bold text-[#4A3E56] text-xs sm:text-sm">
                      {item.temperature} °C
                    </span>
                  </div>
                  {/* แถบระดับอุณหภูมิ */}
                  <div className="w-full bg-[#EFC3E6]/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#B8BEDD] via-[#EFC3E6] to-[#F0A6CA] h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max((item.temperature / 40) * 100, 10), 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* แถวล่าง: ความชื้นสัมพัทธ์ และ ลม */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#EFC3E6]/50">
                  <div className="flex items-center gap-1.5 text-[#4A3E56]">
                    <FiDroplet className="text-[#9C89B8] text-xs" />
                    <span>ความชื้น:</span>
                    <strong className="text-[#4A3E56]">{item.humidity}%</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#4A3E56]">
                    <FiWind className="text-[#B8BEDD] text-xs" />
                    <span>ลม:</span>
                    <strong className="text-[#4A3E56]">{item.windSpeed} km/h</strong>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          // แบบตาราง (Table Matrix View)
          <div className="border border-[#EFC3E6] rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0E6EF] text-[#4A3E56] font-semibold border-b border-[#EFC3E6]">
                <tr>
                  <th className="py-2.5 px-3">สถานที่ / อำเภอ</th>
                  <th className="py-2.5 px-2 text-center">อุณหภูมิ</th>
                  <th className="py-2.5 px-2 text-center">ความชื้น</th>
                  <th className="py-2.5 px-2 text-center">PM2.5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E6EF]">
                {districts.map((item) => {
                  const pm25Info = getPM25Level(item.pm25);
                  return (
                    <tr key={item.id} className="hover:bg-[#F0E6EF]/50 transition-colors">
                      <td className="py-2 px-3">
                        <p className="font-bold text-[#4A3E56] leading-normal">{item.landmark}</p>
                        <span className="text-[10px] text-[#9C89B8] leading-normal">{item.name}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-[#4A3E56]">
                        {item.temperature} °C
                      </td>
                      <td className="py-2 px-2 text-center text-[#4A3E56]">
                        {item.humidity}%
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${pm25Info.textColor} ${pm25Info.bgColor}`}>
                          {item.pm25} µg
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ส่วนล่าง: ข้อมูลที่มา API */}
      <div className="flex-none pt-2 border-t border-[#F0E6EF] flex items-center justify-between text-[10px] text-[#9C89B8]">
        <span className="flex items-center gap-1 font-medium">
          <FiInfo className="text-xs" /> ข้อมูลจาก Open-Meteo
        </span>
      </div>
    </div>
  );
}
