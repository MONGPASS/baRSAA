import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { useLanguage } from "../contexts/language-context";

interface FooterSettings {
  companyName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  copyright: string;
  logoUrl?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  quickLinks: Array<{ title: string; url: string }>;
}

export function Footer() {
  const { t } = useLanguage();

  const { data: footerData } = useQuery<FooterSettings>({
    queryKey: ["footer-settings"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/footer");
        if (!response.ok) throw new Error("Failed to fetch footer settings");
        const footerInfo = (await response.json()) as any;
        if (!footerInfo || Object.keys(footerInfo).length === 0)
          return {} as FooterSettings;
        return {
          companyName: footerInfo.companyName || footerInfo.company_name,
          description: footerInfo.description,
          address: footerInfo.address,
          phone: footerInfo.phone,
          email: footerInfo.email,
          logoUrl: footerInfo.logoUrl || footerInfo.logo_url,
          socialLinks: footerInfo.socialLinks || footerInfo.social_links || {},
          quickLinks: footerInfo.quickLinks || footerInfo.quick_links || [],
          copyright:
            footerInfo.copyrightText ||
            footerInfo.copyright ||
            footerInfo.copyright_text,
        };
      } catch (error) {
        console.error("Error fetching footer settings:", error);
        return {} as FooterSettings;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    address = "청주시 흥덕구 봉명동 1091",
    phone = "010-6884-9193",
    email = "info@barsmakh.mn",
    copyright = t.copyright,
    socialLinks = {},
  } = footerData || {};

  return (
    <footer className="bg-[#2b2b2b] text-white pt-12 pb-8">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-10 md:gap-16 items-start">
        {/* Brand + legal + company info */}
        <div className="flex flex-col gap-4">
          <Link href="/">
            <div className="flex items-baseline gap-1.5 cursor-pointer">
              <span className="text-[26px] font-extrabold text-[#E8442E] tracking-[-.5px]">
                БАРС
              </span>
              <span className="text-base font-bold text-white">махны дэлгүүр</span>
            </div>
          </Link>

          <div className="flex flex-wrap gap-4 text-[12.5px] font-bold">
            <Link href="/terms">
              <span className="text-gray-300 hover:text-white transition-colors">
                Үйлчилгээний нөхцөл
              </span>
            </Link>
            <Link href="/privacy">
              <span className="text-white hover:text-gray-200 transition-colors">
                Нууцлалын бодлого
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-gray-300 hover:text-white transition-colors">
                Хүргэлтийн мэдээлэл
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-gray-300 hover:text-white transition-colors">
                Тусламжийн төв
              </span>
            </Link>
          </div>

          <div className="text-[11.5px] text-gray-400 leading-[1.7]">
            Хаяг: {address}
            <br />
            Утас: {phone}
            {email ? ` | И-мэйл: ${email}` : ""}
            <br />
            {copyright}
          </div>

          {/* Social icons */}
          <div className="flex gap-3 mt-1">
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#E8442E] flex items-center justify-center hover:brightness-110 transition"
              >
                <FaFacebook className="text-sm" />
              </a>
            )}
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#E8442E] flex items-center justify-center hover:brightness-110 transition"
              >
                <FaInstagram className="text-sm" />
              </a>
            )}
            {socialLinks.youtube && (
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#E8442E] flex items-center justify-center hover:brightness-110 transition"
              >
                <FaYoutube className="text-sm" />
              </a>
            )}
          </div>
        </div>

        {/* Call center */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[11px] font-extrabold tracking-[1.5px] text-gray-400">
            ЛАВЛАХ ТӨВ
          </div>
          <a href={`tel:${phone}`} className="text-[22px] font-extrabold text-white">
            {phone}
          </a>
          <div className="text-[11.5px] text-gray-400 leading-[1.7]">
            Ажлын өдөр: 09:00 – 18:00
            <br />
            Цайны цаг: 12:00 – 13:00
            <br />
            (Бямба, Ням амарна)
          </div>
        </div>

        {/* Delivery note */}
        <div className="flex flex-col gap-2.5">
          <div className="text-[11px] font-extrabold tracking-[1.5px] text-gray-400">
            ХҮРГЭЛТ
          </div>
          <div className="text-[15px] font-extrabold text-white">
            БНСУ-ын бүх хот
          </div>
          <div className="text-[11.5px] text-gray-400 leading-[1.7]">
            Өнөөдөр захиалбал маргааш хүргэнэ.
            <br />
            Шинэхэн мах, найдвартай үйлчилгээ.
          </div>
          <Link href="/admin/login">
            <div className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-[11px] mt-2 transition-colors">
              <span className="material-icons text-xs">admin_panel_settings</span>
              <span>{t.adminLogin}</span>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}
