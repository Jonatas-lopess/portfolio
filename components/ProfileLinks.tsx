import type { ComponentType, SVGProps } from "react";
import Download from "@/components/svg/Download";
import Github from "@/components/svg/Github";
import Linkedin from "@/components/svg/Linkedin";
import { getDictionary, type Locale } from "@/lib/locale";
import { profileLinkAnchorProps, profileLinkHref, profileLinkName, profileLinks, type ProfileLinkId } from "@/lib/profile-links";

const ICON_SIZE = 36;

const icons: Record<ProfileLinkId, ComponentType<SVGProps<SVGSVGElement>>> = {
    linkedin: Linkedin,
    github: Github,
    cv: Download,
};

/**
 * The LinkedIn, GitHub and CV links. `icons` (Home) shows the icons alone and
 * names each link with `aria-label`; `labelled` (About) shows the icon and its
 * name as text. The URLs live in `lib/profile-links.ts`; the CV name comes from
 * the Dictionary.
 */
export default function ProfileLinks({ variant, locale }: { variant: "icons" | "labelled"; locale: Locale }) {
    const dictionary = getDictionary(locale);
    const links = profileLinks.map((link) => {
        const name = profileLinkName(link, dictionary);
        const Icon = icons[link.id];
        const icon = <Icon width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" aria-hidden="true" />;
        const href = profileLinkHref(link, locale);
        const target = profileLinkAnchorProps(link, locale);

        if (variant === "icons") {
            return <a key={link.id} href={href} aria-label={name} {...target}>{icon}</a>;
        }

        return (
            <div key={link.id} className="w-min">
                <a href={href} {...target} className={"flex items-center space-x-2 dark:text-white" + (link.external ? "" : " w-max")}>{icon}<span>{name}</span></a>
            </div>
        );
    });

    return variant === "icons"
        ? <div className="flex space-x-2 justify-center">{links}</div>
        : <div className=" flex flex-col space-y-4">{links}</div>;
}
