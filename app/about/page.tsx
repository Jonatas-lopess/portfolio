import Download from "@/components/svg/Download"
import Github from "@/components/svg/Github"
import Linkedin from "@/components/svg/Linkedin"

export default function About() {
    const ICON_SIZE = 36
    
    return (
        <div className="mt-20">
            <h1 className="text-5xl dark:text-white font-semibold mb-7">About me</h1>
            <p className="dark:text-white mb-5">
                Im a formed Computer technician and Full stack programmer, currently attending to Universidade de Vassouras seeking a degree in Software Engineering and have more than one year of experience in full stack and mobile development. <br />
                Already worked outsourced making applications to Unimed in Laravel and mobile apps in React Native. <br />
                Im studying NextJS, take a look in some of my projects.
            </p>
            <h2 className="text-3xl dark:text-white font-semibold mb-7">Links</h2>
            <div className=" flex flex-col space-y-4">
                <div className="w-min">
                    <a href="https://www.linkedin.com/in/jonatas-lopes-b6629a211" target="_blank" rel="noopener" className="flex items-center space-x-2 dark:text-white"><Linkedin  width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" /><span>LinkedIn</span></a>
                </div>
                <div className="w-min">
                    <a href="https://github.com/Jonatas-lopess" target="_blank" rel="noopener" className="flex items-center space-x-2 dark:text-white"><Github width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" /><span>GitHub</span></a>
                </div>
                <div className="w-min">
                    <a href="/curriculo-jonatas.pdf" download className="flex items-center space-x-2 dark:text-white w-max"><Download width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" /><span>Download CV</span></a>
                </div>
            </div>
        </div>
    )
}