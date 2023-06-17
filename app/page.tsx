import Image from "next/image";

export default function Home() {
  const ICON_SIZE = 48

  return (
    <main>
      <div>
        <h3>Full Stack Developer</h3>
        <h1>Jonatas Lopes</h1>
        <div>
          <Image alt="linkedin" src="/linkedin.svg" width={ICON_SIZE} height={ICON_SIZE} />
          <Image alt="github" src="/github.svg" width={ICON_SIZE} height={ICON_SIZE} />
          <Image alt="curriculum" src="/download.svg" width={ICON_SIZE} height={ICON_SIZE} />
        </div>
      </div>
    </main>
  )
}
