/**
 * 抖音电商风格图标组件 - 基于 ByteDance IconPark 官方图标库
 * 图标来源: https://iconpark.oceanengine.com/official
 * 特点：统一4px描边宽度、圆角端点、简洁现代、与抖音系产品一致
 */
'use client';

import {
  Home as IconParkHome,
  ShoppingCart as IconParkShoppingCart,
  User as IconParkUser,
  Headset as IconParkHeadset,
  Search as IconParkSearch,
  Time as IconParkTime,
  Fire as IconParkFire,
  Tag as IconParkTag,
  Shield as IconParkShield,
  Wallet as IconParkWallet,
  DocumentFolder as IconParkDocumentFolder,
  Back as IconParkBack,
  Star as IconParkStar,
  CheckOne as IconParkCheckOne,
  Attention as IconParkAttention,
  Right as IconParkRight,
  Copy as IconParkCopy,
  Delete as IconParkDelete,
  Plus as IconParkPlus,
  Minus as IconParkMinus,
  Lock as IconParkLock,
  Left as IconParkLeft,
  Check as IconParkCheck,
  Close as IconParkClose,
  Info as IconParkInfo,
  PreviewOpen as IconParkPreviewOpen,
  FileCollection as IconParkFileCollection,
  Local as IconParkLocal,
  Logout as IconParkLogout,
  Lightning as IconParkLightning,
  Remind as IconParkRemind,
  Coupon as IconParkCoupon,
  PreviewCloseOne as IconParkPreviewCloseOne,
  ShoppingBag as IconParkShoppingBag,
  MedalOne as IconParkMedalOne,
  BankCard as IconParkBankCard,
  Camera as IconParkCamera,
  Setting as IconParkSetting,
  Finance as IconParkFinance,
  Message as IconParkMessage,
  BellRing as IconParkBellRing,
  People as IconParkPeople,
  StarOne as IconParkStarOne,
  Order as IconParkOrder,
  ArrowLeft as IconParkArrowLeft,
  CategoryManagement as IconParkCategoryManagement,
  AllApplication as IconParkAllApplication,
  Announcement as IconParkAnnouncement,
  Edit as IconParkEdit,
  More as IconParkMore,
  Help as IconParkHelp,
  Pic as IconParkPic,
  Key as IconParkKey,
  Link as IconParkLink,
} from '@icon-park/react';

// 统一图标主题
const iconTheme = {
  strokeWidth: 4,      // IconPark使用4px描边（对应24px viewBox）
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

interface IconProps {
  className?: string;
  filled?: boolean;
}

// ===== 底部导航图标 =====

export function HomeIcon({ className = "w-5 h-5", filled = false }: IconProps) {
  return <IconParkHome theme={filled ? 'filled' : 'outline'} size="1em" {...iconTheme} className={className} />;
}

export function ShoppingCartIcon({ className = "w-5 h-5", filled = false }: IconProps) {
  return <IconParkShoppingCart theme={filled ? 'filled' : 'outline'} size="1em" {...iconTheme} className={className} />;
}

export function CartIcon({ className = "w-5 h-5", filled = false }: IconProps) {
  return <ShoppingCartIcon className={className} filled={filled} />;
}

export function UserIcon({ className = "w-5 h-5", filled = false }: IconProps) {
  return <IconParkUser theme={filled ? 'filled' : 'outline'} size="1em" {...iconTheme} className={className} />;
}

export function HeadphoneIcon({ className = "w-5 h-5", filled = false }: IconProps) {
  return <IconParkHeadset theme={filled ? 'filled' : 'outline'} size="1em" {...iconTheme} className={className} />;
}

// ===== 功能图标 =====

export function SearchIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkSearch theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function ClockIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkTime theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function FireIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkFire theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function FlashIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkLightning theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function TagIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkTag theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function ShieldIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkShield theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function WalletIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkWallet theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function OrderIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkOrder theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function BackIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkBack theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function StarIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkStar theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CheckCircleIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkCheckOne theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function AlertIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkAttention theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function ChevronRightIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkRight theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CopyIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkCopy theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function TrashIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkDelete theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function PlusIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkPlus theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function MinusIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkMinus theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function LockIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkLock theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function ArrowLeftIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkLeft theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CheckIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkCheck theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function XIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkClose theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function InfoIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkInfo theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function EyeIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkPreviewOpen theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function BellIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkBellRing theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function FileTextIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkDocumentFolder theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function MapPinIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkLocal theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function LogoutIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkLogout theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function AnnounceIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkAnnouncement theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CouponIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkCoupon theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function StreamIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkPreviewCloseOne theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function ShoppingBagIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkShoppingBag theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function GoldIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkMedalOne theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CreditCardIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkBankCard theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CameraIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkCamera theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function SettingsIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkSetting theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function BankIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkFinance theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function MessageIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkMessage theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function CategoryIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkCategoryManagement theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function AllApplicationIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkAllApplication theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function EditIcon({ className = "w-4 h-4" }: IconProps) {
  return <IconParkEdit theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function MoreIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkMore theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function HelpIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkHelp theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function PeopleIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkPeople theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function RemindIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkRemind theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function PicIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkPic theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function KeyIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkKey theme="outline" size="1em" {...iconTheme} className={className} />;
}

export function LinkIcon({ className = "w-5 h-5" }: IconProps) {
  return <IconParkLink theme="outline" size="1em" {...iconTheme} className={className} />;
}

// ===== 抖音电商风格样式常量 =====

// 胶囊按钮渐变样式
export const douyinBtnPrimary = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-sm font-medium shadow-sm shadow-blue-200/50 hover:shadow-md hover:shadow-blue-300/50 active:scale-[0.97] transition-all duration-200";

export const douyinBtnDanger = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white text-sm font-medium shadow-sm shadow-red-200/50 hover:shadow-md hover:shadow-orange-300/50 active:scale-[0.97] transition-all duration-200";

export const douyinBtnOutline = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#1890FF]/30 text-[#1890FF] text-sm font-medium hover:bg-[#1890FF]/5 active:scale-[0.97] transition-all duration-200";

export const douyinBtnGhost = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[#1890FF] text-sm font-medium hover:bg-[#1890FF]/5 active:scale-[0.97] transition-all duration-200";

// 抖音风格图标背景圆
export const douyinIconBg = "w-10 h-10 rounded-xl bg-gradient-to-br from-[#1890FF]/10 to-[#00D4FF]/10 flex items-center justify-center text-[#1890FF]";
export const douyinIconBgDanger = "w-10 h-10 rounded-xl bg-gradient-to-br from-[#FE2C55]/10 to-[#FF6B35]/10 flex items-center justify-center text-[#FE2C55]";
