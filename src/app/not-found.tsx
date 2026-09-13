import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink px-4 text-paper">
      <div className="text-center">
        <LogoMark className="mx-auto h-14 w-14 text-lime" />
        <p className="display mt-6 text-[28vw] leading-none md:text-[14rem]">404</p>
        <p className="mt-2 text-paper/70">Esta página perdeu-se na alfândega.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-lime">
            Início
          </Link>
          <Link href="/produtos" className="btn btn-outline">
            Loja
          </Link>
        </div>
      </div>
    </div>
  );
}
