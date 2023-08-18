import { ModeButton, WalletButton } from "@/app/_navbar/buttons";
import { navigation } from "@/app/_navbar/naviagation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/app/icon.png";

const Navbar = () => {
  const active = false;
  return (
    <div className="border-b fixed w-full">
      <div className="flex h-16 items-center px-4">
        <Image src={Logo} alt="EvoVerses" width={48} height={48} />
        <nav className="hidden items-center space-x-4 mx-6 lg:space-x-6"> {/* lg:flex  */}
          {navigation.map(({ href, name }, key) => (
            <Link
              key={key}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                active || "text-muted-foreground",
              )}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <WalletButton />
          <ModeButton />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
