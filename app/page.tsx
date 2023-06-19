import Image from "next/image";

export default function Home() {
  const ICON_SIZE = 36

  return (
    <main className="flex h-screen bg-gradient-to-b from-[#434343] to-[#000000]">
      <div className="flex flex-1 flex-col justify-center text-center">
        <h3 className="text-xl text-gray-300">Full Stack Developer</h3>
        <h1 className="text-7xl text-white font-semibold mb-7">Jonatas Lopes</h1>
        <div className="flex space-x-1 justify-center">
          <a href="https://www.linkedin.com/in/jonatas-lopes-b6629a211" target="_blank" rel="noopener"><Image alt="linkedin" src="/linkedin.svg" width={ICON_SIZE} height={ICON_SIZE} /></a>
          <a href="https://github.com/Jonatas-lopess" target="_blank" rel="noopener"><Image alt="github" src="/github.svg" width={ICON_SIZE} height={ICON_SIZE} /></a>
          <a href="/curriculo-jonatas.pdf" download><Image alt="curriculum" src="/download.svg" width={ICON_SIZE} height={ICON_SIZE} /></a>
        </div>
      </div>
    </main>
  )
}
