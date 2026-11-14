import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import Sidebar from './components/Sidebar';
import TourGuide from './components/TourGuide';
import { sections } from './data/content';
import { useActiveSection } from './hooks/useActiveSection';
import { useAppReady } from './hooks/useAppReady';
import { useInterfaceSounds } from './hooks/useInterfaceSounds';
import { useReveal } from './hooks/useReveal';
import { useTheme } from './hooks/useTheme';
import { useTour } from './hooks/useTour';
import Experience from './sections/Experience';
import GitHubActivity from './sections/GitHubActivity';
import Home from './sections/Home';
import Projects from './sections/Projects';
import TechStack from './sections/TechStack';

const sectionIds = sections.map((section) => section.id);

// Which component renders each section. The order on the page comes from
// `sections` in data/content.js, the same list that orders the navigation and
// numbers the headings, so the three can never disagree.
const sectionComponents = {
  home: Home,
  projects: Projects,
  experience: Experience,
  stack: TechStack,
  github: GitHubActivity,
};

export default function App() {
  const isReady = useAppReady();
  const { preference, setPreference } = useTheme();
  const activeId = useActiveSection(sectionIds);
  const tour = useTour({ isEnabled: isReady });
  const sounds = useInterfaceSounds();
  useReveal();

  const navProps = {
    activeId,
    themePreference: preference,
    onThemeChange: setPreference,
    sounds,
    tour,
  };

  return (
    <>
      <a
        className="fixed top-2 left-2 z-90 -translate-y-[200%] bg-fg px-3.5 py-2 text-sm font-medium text-bg focus:translate-y-0"
        href="#main"
        data-menu-background=""
      >
        Skip to content
      </a>

      <Sidebar {...navProps} />
      <MobileNav {...navProps} />

      <div className="ml-(--sidebar-width) max-lg:ml-0 max-lg:pt-(--header-offset)" data-menu-background="">
        <main id="main" className="mx-auto w-full max-w-(--content-width) px-(--gutter)">
          {sectionIds.map((id) => {
            const SectionComponent = sectionComponents[id];
            // The hero portrait turns to the pixel avatar while the guide greets.
            const sectionProps = id === 'home' ? { greetingCue: tour.greetingCue } : {};
            return <SectionComponent key={id} {...sectionProps} />;
          })}
        </main>
        <Footer />
      </div>

      <TourGuide
        status={tour.status}
        step={tour.step}
        stepKey={tour.stepKey}
        isMessageShown={tour.isMessageShown}
        onSkip={tour.skip}
        onMessageStarted={tour.markMessageStarted}
        onMessageShown={tour.markMessageShown}
        onBeatsDone={tour.finishBeats}
      />
    </>
  );
}
