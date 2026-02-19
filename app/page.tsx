import "./landing.css";
import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  CtaSection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </>
  );
}
