import Image from "next/image";
import styles from "./portal-intro.module.css";

export function PortalIntro() {
  return (
    <div className={styles.scene}>
      <div className={styles.vortex} aria-hidden="true">
        <div className={styles.surface} />
        <Image className={styles.flow} src="/landing/portal-flow.svg" alt="" width={600} height={600} unoptimized priority />
        <div className={styles.counterflow} />
      </div>
      <div className={styles.logo}>
        <Image src="/landing/evoverses-logo.png" alt="EvoVerses" width={1747} height={1195} priority sizes="(max-width: 640px) 88vw, (max-width: 1024px) 74vw, 760px" className={styles.image} />
      </div>
    </div>
  );
}
