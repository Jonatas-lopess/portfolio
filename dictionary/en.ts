/**
 * The English Dictionary: the hand-edited Source text, and the single
 * definition of the Dictionary's shape. Add a string here and every other
 * Locale's file fails to type-check, and the parity test fails, until it has
 * the same key.
 */
export const en = {
    Meta: {
        Title: "Jonatas Lopes - Portfolio",
        Description: "Discover my career in programming: 6 years of study and more than 1 year of professional experience."
    },
    NavBar: {
        Home: "Home",
        Projects: "Projects",
        About: "About",
        Language: "Language",
        DarkTheme: "Dark theme"
    },
    Home: {
        Subtitle: "Full Stack Developer"
    },
    About: {
        Title: "About me",
        Text: "Im a formed Computer technician and Full stack programmer, currently attending to Universidade de Vassouras seeking a degree in Software Engineering and have more than one year of experience in full stack and mobile development. Already worked outsourced making applications to Unimed in Laravel and mobile apps in React Native. Im studying NextJS, take a look in some of my projects.",
        LinksHeading: "Links",
        CVDownload: "Download CV"
    },
    Projects: {
        Title: "Projects",
        CountLabel: "Number of projects"
    },
    ProjectInfo: {
        Summary: "Project summary",
        Stack: "Project Stack",
        CodeButton: "Code",
        VisitButton: "Visit",
        NotFound: "Project not found.",
        BackToProjects: "Back to projects"
    }
};

/** The shape of one Locale's Dictionary, derived from English; string leaves are plain `string`. */
export type DictionaryEntry = typeof en;
