import Image from "next/image";

export default function Home() {
  const ICON_SIZE = 36

  return (
    <main className="flex flex-col h-full">
      <div className="flex justify-between mx-4 mt-2 space-x-8 text-white">
        <div className="space-x-4">
          <a href="/">Home</a>
          <a href="/projects">Projects</a>
          <a href="/about">About</a>
        </div>
        <div className="space-x-4">
          <span>PT</span>
          <span>Light</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center text-center">
        <h3 className="text-xl text-gray-300">Full Stack Developer</h3>
        <h1 className="text-7xl text-white font-semibold mb-7">Jonatas Lopes</h1>
        <div className="flex space-x-1 justify-center">
          <a href="https://www.linkedin.com/in/jonatas-lopes-b6629a211" target="_blank" rel="noopener"><Image alt="linkedin" src="/linkedin.svg" width={ICON_SIZE} height={ICON_SIZE} /></a>
          <a href="https://github.com/Jonatas-lopess" target="_blank" rel="noopener"><Image alt="github" src="/github.svg" width={ICON_SIZE} height={ICON_SIZE} /></a>
          <a href="/curriculo-jonatas.pdf" download><Image alt="curriculum" src="/download.svg" width={ICON_SIZE-2} height={ICON_SIZE-2} /></a>
        </div>
      </div>
    </main>
  )
}
