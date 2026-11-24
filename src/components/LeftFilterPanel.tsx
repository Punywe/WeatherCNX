import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiX, FiSearch, FiCheck, FiMapPin, FiTrash2 } from "react-icons/fi";
import type { LocationInput } from "../data/location";

interface LeftFilterPanelProps {
  allLocations: LocationInput[];
  selectedIds: string[];
  onAddDistrict: (districtId: string) => void;
  onRemoveDistrict: (districtId: string) => void;
  onClearAll: () => void;
  onConfirmCompare: () => void;
  onClose?: () => void; // ปุ่มปิดพับการ์ดเก็บ
  isLoading?: boolean;
}

export default function LeftFilterPanel({
  allLocations,
  selectedIds,
  onAddDistrict,
  onRemoveDistrict,
  onClearAll,
  onConfirmCompare,
  onClose,
  isLoading = false,
}: LeftFilterPanelProps) {
  // สถานะเปิด/ปิดเมนู Dropdown แบบ Custom
  const [isOpen, setIsOpen] = useState(false);
  // คำค้นหาใน Dropdown
  const [searchQuery, setSearchQuery] = useState("");
  // Ref สำหรับตรวจจับการคลิกข้างนอกเพื่อปิด Dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown อัตโนมัติเมื่อผู้ใช้คลิกบริเวณอื่นของหน้าจอ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // กรองรายชื่ออำเภอตามคำค้นหา
  const filteredLocations = allLocations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // หาข้อมูลอำเภอที่เลือกจาก ID
  const selectedLocations = allLocations.filter((item) =>
    selectedIds.includes(item.id)
  );

  // ฟังก์ชันเมื่อคลิกเลือกอำเภอใน Custom Dropdown
  const handleSelectDistrict = (districtId: string) => {
    onAddDistrict(districtId);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-[#9C89B8]/15 border border-[#F0E6EF] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300">
      {/* ส่วนบน: ส่วนเลือกอำเภอและรายชื่อที่เลือก */}
      <div className="flex flex-col flex-1 min-h-0 space-y-4 sm:space-y-5">
        {/* หัวข้อ Weather Chiang Mai พร้อมปุ่มปิด */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#4A3E56] tracking-tight">
              Weather Chiang Mai
            </h2>
            <p className="text-xs text-[#9C89B8] mt-0.5 font-medium">
              ระบบเปรียบเทียบสภาพอากาศและฝุ่น PM2.5
            </p>
          </div>

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

        {/* ส่วนที่ 1: เลือกอำเภอ (ใช้สี Blush Pop: #F0A6CA) */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-[#4A3E56]">
            เลือกอำเภอ
          </label>

          {/* ปุ่มเปิด Dropdown สไตล์ Blush Pop #F0A6CA */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#F0A6CA] hover:bg-[#e694bb] active:bg-[#d983aa] text-white text-sm font-medium py-3 px-4 rounded-2xl shadow-sm shadow-[#F0A6CA]/30 transition-all flex items-center justify-between cursor-pointer outline-none focus:ring-2 focus:ring-[#EFC3E6]"
          >
            <span className="truncate">เลือกอำเภอที่ต้องการ...</span>
            <FiChevronDown
              className={`text-lg transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* กล่องเมนูตัวเลือกแบบ Custom */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-[#F0E6EF] p-2.5">
              {/* ช่องค้นหาอำเภอใน Dropdown */}
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาชื่ออำเภอ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F0E6EF]/50 border border-[#B8BEDD]/40 rounded-xl py-2 pl-8 pr-3 text-xs text-[#4A3E56] placeholder-[#9C89B8]/70 focus:outline-none focus:ring-2 focus:ring-[#F0A6CA] focus:bg-white transition-all"
                  autoFocus
                />
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9C89B8] text-xs" />
              </div>

              {/* รายการอำเภอแบบ Scrollable สวยงาม */}
              <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {filteredLocations.length === 0 ? (
                  <p className="text-center text-xs text-[#9C89B8] py-3">
                    ไม่พบอำเภอที่ค้นหา
                  </p>
                ) : (
                  filteredLocations.map((loc) => {
                    const isSelected = selectedIds.includes(loc.id);

                    return (
                      <button
                        key={loc.id}
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleSelectDistrict(loc.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left ${
                          isSelected
                            ? "bg-[#F0E6EF]/60 text-slate-400 cursor-not-allowed"
                            : "hover:bg-[#EFC3E6]/30 hover:text-[#4A3E56] text-[#4A3E56] cursor-pointer active:scale-[0.99]"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FiMapPin
                            className={`text-xs ${
                              isSelected ? "text-slate-300" : "text-[#F0A6CA]"
                            }`}
                          />
                          <span>{loc.name}</span>
                        </span>

                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] text-[#F0A6CA] font-medium">
                            <FiCheck className="text-xs" />
                            เลือกแล้ว
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ส่วนที่ 2: อำเภอที่เลือก (พื้นหลังกล่องใช้ Lavender Blush: #F0E6EF) */}
        <div className="flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-[#4A3E56]">
              อำเภอที่เลือก ({selectedLocations.length}/5)
            </label>

            {/* ปุ่มเคลียร์อำเภอที่เลือกทั้งหมด */}
            {selectedLocations.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-[#9C89B8] hover:text-[#F0A6CA] transition-colors flex items-center gap-1 font-medium hover:underline cursor-pointer"
                title="ล้างอำเภอที่เลือกทั้งหมด"
              >
                <FiTrash2 className="text-xs" />
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F0E6EF]/60 rounded-2xl p-3.5 flex flex-wrap content-start gap-2 border border-[#EFC3E6]/50 custom-scrollbar">
            {selectedLocations.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center py-6">
                <p className="text-xs text-[#9C89B8]">
                  ยังไม่ได้เลือกอำเภอ
                  <br />
                  (คลิกเลือกจาก Dropdown ด้านบน)
                </p>
              </div>
            ) : (
              selectedLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="inline-flex items-center gap-1.5 bg-white text-[#4A3E56] text-xs font-medium px-3 py-1.5 rounded-full shadow-xs border border-[#EFC3E6] hover:border-[#F0A6CA] transition-all h-fit"
                >
                  <span className="truncate max-w-[130px]">{loc.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveDistrict(loc.id)}
                    className="text-[#F0A6CA] hover:text-rose-600 p-0.5 rounded-full hover:bg-[#F0E6EF] transition-colors"
                    title="ลบออก"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ข้อความแจ้งเตือนเลือกได้สูงสุด 5 อำเภอ (Blush Pop: #F0A6CA) */}
          <p className="text-xs text-[#F0A6CA] font-semibold mt-1">
            **เลือกได้สูงสุด 5 อำเภอ**
          </p>
        </div>
      </div>

      {/* ปุ่ม GO สไตล์ Amethyst Smoke (#9C89B8) */}
      <div className="pt-3 mt-auto">
        <button
          type="button"
          onClick={onConfirmCompare}
          disabled={selectedIds.length === 0 || isLoading}
          className="w-full bg-[#9C89B8] hover:bg-[#8e79ab] active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-2xl shadow-md shadow-[#9C89B8]/30 transition-all text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? "กำลังโหลดข้อมูล..." : "GO (ดูผลเปรียบเทียบ)"}
        </button>
      </div>
    </div>
  );
}
