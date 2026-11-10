import ProfileLinks from "@/components/ProfileLinks"
import { getDictionary, type Locale } from "@/lib/locale"

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
    const locale = (await params).lang as Locale // middleware guarantees a valid Locale prefix
    const dictionary = getDictionary(locale)
    const about = dictionary.About
    const jobs = [
        { role: about.Job1Role, company: about.Job1Company, period: about.Job1Period, summary: about.Job1Summary },
        { role: about.Job2Role, company: about.Job2Company, period: about.Job2Period, summary: about.Job2Summary },
        { role: about.Job3Role, company: about.Job3Company, period: about.Job3Period, summary: about.Job3Summary },
        { role: about.Job4Role, company: about.Job4Company, period: about.Job4Period, summary: about.Job4Summary },
    ]

    // Grid rows beside the education bar (rows 2-4 are the bar; the last job sits below it).
    const jobRows = ["md:row-start-2", "md:row-start-3", "md:row-start-4", "md:row-start-5"]

    return (
        <div className="my-20">
            <h1 className="text-5xl dark:text-white font-semibold mb-7">{about.Title}</h1>
            <p className="dark:text-white mb-5">{about.Text}</p>
            <dl className="dark:text-white mb-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                <dt className="font-mono text-sm opacity-70">{about.LocationLabel}</dt>
                <dd>{about.Location}</dd>
                <dt className="font-mono text-sm opacity-70">{about.LanguagesLabel}</dt>
                <dd>{about.Languages}</dd>
            </dl>
            <div className="mb-14">
                <ProfileLinks variant="labelled" locale={locale} />
            </div>
            <div className="mb-10 grid gap-x-8 md:grid-cols-[11rem_1fr]">
                <h2 className="text-3xl font-semibold mb-7 text-neutral-500 dark:text-neutral-400 md:col-start-1 md:row-start-1 md:text-right">{about.EducationHeading}</h2>
                <div className="mb-10 flex gap-4 text-neutral-500 dark:text-neutral-400 md:col-start-1 md:row-start-2 md:row-span-3 md:mb-0 md:justify-end">
                    <div className="md:text-right">
                        <p className="font-mono text-sm">{about.StudyPeriod}</p>
                        <p className="text-lg font-semibold leading-snug">{about.StudyRole}</p>
                        <p className="font-mono text-sm">{about.StudyInstitution}</p>
                    </div>
                    <div aria-hidden="true" className="hidden w-1.5 shrink-0 self-stretch rounded-full bg-neutral-300 dark:bg-neutral-700 md:block" />
                </div>
                <h2 className="text-3xl dark:text-white font-semibold mb-7 md:col-start-2 md:row-start-1">{about.ExperienceHeading}</h2>
                {jobs.map((job, i) => (
                    <div key={job.company} className={`md:col-start-2 ${jobRows[i]} ml-2 border-l border-neutral-300 dark:border-neutral-700`}>
                        <div className="relative pl-8 pb-10 dark:text-white">
                            <span
                                aria-hidden="true"
                                className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border border-neutral-500 bg-white dark:bg-neutral-950 dark:border-neutral-400"
                            />
                            <p className="font-mono text-sm opacity-70">{job.period}</p>
                            <p className="text-xl font-semibold">{job.role}</p>
                            <p className="font-mono text-sm opacity-70">{job.company}</p>
                            <p className="mt-2 max-w-prose">{job.summary}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
