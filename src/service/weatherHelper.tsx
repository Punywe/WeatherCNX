import React from "react";
import { 
  WiDaySunny, 
  WiCloudy, 
  WiDayCloudy, 
  WiRain, 
  WiThunderstorm, 
  WiFog, 
  WiShowers 
} from "react-icons/wi";

export interface WeatherCondition {
  label: string;
  icon: React.ReactNode;
  color: string;
}

// แปลงรหัสสภาพอากาศ WMO Weather Code เป็นข้อความภาษาไทยและไอคอน react-icons
export function getWeatherCondition(code: number): WeatherCondition {
  switch (code) {
    case 0:
      return {
        label: "ท้องฟ้าแจ่มใส",
        icon: <WiDaySunny className="text-amber-500 text-3xl" />,
        color: "text-amber-600",
      };
    case 1:
    case 2:
      return {
        label: "มีเมฆบางส่วน",
        icon: <WiDayCloudy className="text-sky-500 text-3xl" />,
        color: "text-sky-600",
      };
    case 3:
      return {
        label: "เมฆครึ้ม",
        icon: <WiCloudy className="text-slate-500 text-3xl" />,
        color: "text-slate-600",
      };
    case 45:
    case 48:
      return {
        label: "มีหมอกลง",
        icon: <WiFog className="text-teal-500 text-3xl" />,
        color: "text-teal-600",
      };
    case 51:
    case 53:
    case 55:
      return {
        label: "ฝนละอองเบาๆ",
        icon: <WiShowers className="text-blue-400 text-3xl" />,
        color: "text-blue-500",
      };
    case 61:
    case 63:
    case 65:
      return {
        label: "ฝนตก",
        icon: <WiRain className="text-blue-600 text-3xl" />,
        color: "text-blue-600",
      };
    case 80:
    case 81:
    case 82:
      return {
        label: "ฝนตกซู่",
        icon: <WiShowers className="text-indigo-500 text-3xl" />,
        color: "text-indigo-600",
      };
    case 95:
    case 96:
    case 99:
      return {
        label: "พายุฝนฟ้าคะนอง",
        icon: <WiThunderstorm className="text-purple-600 text-3xl" />,
        color: "text-purple-600",
      };
    default:
      return {
        label: "สภาพอากาศทั่วไป",
        icon: <WiDayCloudy className="text-sky-500 text-3xl" />,
        color: "text-slate-600",
      };
  }
}

export interface PM25Level {
  text: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

// ฟังก์ชันแปลงระดับฝุ่น PM2.5 ตามเกณฑ์มาตรฐาน
export function getPM25Level(pm25: number): PM25Level {
  if (pm25 <= 15) {
    return {
      text: "อากาศดีมาก",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
    };
  } else if (pm25 <= 25) {
    return {
      text: "อากาศดี",
      bgColor: "bg-sky-50",
      textColor: "text-sky-700",
      borderColor: "border-sky-200",
    };
  } else if (pm25 <= 37.5) {
    return {
      text: "ปานกลาง",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
    };
  } else if (pm25 <= 75) {
    return {
      text: "เริ่มมีผลต่อสุขภาพ",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
    };
  } else {
    return {
      text: "มีผลต่อสุขภาพ",
      bgColor: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
    };
  }
}
