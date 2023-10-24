import { ModeButton, WalletButton } from "@/app/_navbar/buttons";
import NavItems from "@/app/_navbar/NavItems";

import Image from "next/image";
import Logo from "@/app/icon.png";

const Navbar = () => {

  return (
    <div className="border-b fixed w-full bg-background">
      <div className="flex h-16 items-center px-4">
        <Image src={Logo} alt="EvoVerses" width={48} height={48} />
        <nav className="items-center ml-2 sm:space-x-4 sm:mx-6 lg:space-x-6"> {/* lg:flex  */}
          <NavItems />

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
